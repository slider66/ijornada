"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const Digit = ({ value }: { value: number }) => {
  return (
    <div className="relative w-10 h-14 overflow-hidden rounded-md bg-zinc-900 text-white font-mono text-3xl font-bold flex items-center justify-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default function FlipClock({ className }: { className?: string }) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setTime(new Date()));
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  return (
    <div className={cn("flex justify-center items-center gap-1", className)}>
      {hours.split("").map((digit, i) => (
        <Digit key={`h-${i}`} value={parseInt(digit)} />
      ))}
      <span className="text-3xl font-bold text-zinc-500">:</span>
      {minutes.split("").map((digit, i) => (
        <Digit key={`m-${i}`} value={parseInt(digit)} />
      ))}
      <span className="text-3xl font-bold text-zinc-500">:</span>
      {seconds.split("").map((digit, i) => (
        <Digit key={`s-${i}`} value={parseInt(digit)} />
      ))}
    </div>
  );
}
