"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface DesktopDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function DesktopDrawer({ open, onClose, children }: DesktopDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm dark:bg-slate-950/60 hidden lg:block"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[110] w-[100vw] max-w-4xl bg-white shadow-2xl dark:bg-[#0c0a1d] hidden lg:flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header / Close button inside drawer if needed, but DevisEditor has its own header */}
            <div className="absolute top-4 right-6 z-50">
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X size={20} />
                <span className="sr-only">Fermer</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar relative">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}