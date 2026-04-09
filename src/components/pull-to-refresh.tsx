"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { motion, useAnimation } from "framer-motion";
import { RefreshCw } from "lucide-react";

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullDistanceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const threshold = 80;
  const maxPull = 120;

  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0 && window.scrollY <= 0) {
        // Prevent default only if we are actively pulling down at the top
        // This stops the browser's native pull-to-refresh if we handle it
        if (e.cancelable) e.preventDefault();
        
        const pull = Math.min(distance * 0.4, maxPull);
        setPullDistance(pull);
        controls.set({ y: pull });
      } else {
        isPulling = false;
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling || isRefreshing) return;
      isPulling = false;

      if (pullDistanceRef.current >= threshold) {
        setIsRefreshing(true);
        controls.start({ y: 50 });
        Promise.resolve(onRefresh()).finally(() => {
          setIsRefreshing(false);
          controls.start({ y: 0 });
          setPullDistance(0);
        });
      } else {
        controls.start({ y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
        setPullDistance(0);
      }
    };

    // Need passive: false to prevent default browser behavior
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isRefreshing, controls, onRefresh]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-screen touch-pan-y">
      <motion.div
        className="absolute left-0 right-0 top-0 flex w-full justify-center z-50 pointer-events-none"
        style={{ top: -50 }}
        animate={controls}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg shadow-violet-500/20 dark:bg-slate-800 dark:shadow-black/50">
          <RefreshCw
            size={20}
            className={`text-violet-500 ${isRefreshing ? "animate-spin" : ""}`}
            style={{
              transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
              opacity: Math.min(pullDistance / threshold, 1)
            }}
          />
        </div>
      </motion.div>
      <motion.div animate={controls}>
        {children}
      </motion.div>
    </div>
  );
}