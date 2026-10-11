"use client";

import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect } from "react";

/** Counts up to `value` (and re-animates when it changes), like iOS widgets. */
export function AnimatedNumber({ value, format = (n) => String(Math.round(n)), className }: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, format);
  useEffect(() => {
    const controls = animate(mv, value, { type: "spring", stiffness: 120, damping: 22 });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span className={className}>{text}</motion.span>;
}
