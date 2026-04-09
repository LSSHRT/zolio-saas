"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-6 h-24 w-24 overflow-hidden rounded-3xl bg-white shadow-xl shadow-violet-500/10 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <Image
            src="/logo.png"
            alt="Zolio Logo"
            fill
            className="object-contain p-2"
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Zolio</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Préparation de votre espace...</p>
        </motion.div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-violet-500"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
