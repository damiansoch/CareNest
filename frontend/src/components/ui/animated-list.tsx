"use client";

import { motion } from "framer-motion";

// Snappy custom cubic-bezier — fast out, very slight overshoot feel
const ease = [0.22, 1, 0.36, 1] as const;

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 28,
    scale: 0.95,
    filter: "blur(6px)",
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease },
  },
};

export function AnimatedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
