"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** How many degrees of tilt at the edges. Default: 8 */
  maxTilt?: number;
}

export function TiltCard({ children, className, maxTilt = 8 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [maxTilt, -maxTilt]), {
    stiffness: 280,
    damping: 28,
  });
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-maxTilt, maxTilt]), {
    stiffness: 280,
    damping: 28,
  });
  const glareX = useTransform(rawX, [-0.5, 0.5], ["-30%", "130%"]);
  const glareY = useTransform(rawY, [-0.5, 0.5], ["-30%", "130%"]);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 25 });
  const scale = useSpring(1, { stiffness: 300, damping: 28 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
    glareOpacity.set(0.12);
    scale.set(1.025);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
    glareOpacity.set(0);
    scale.set(1);
  }

  return (
    <div ref={ref} style={{ perspective: "900px" }} className={cn("w-full", className)}>
      <motion.div
        style={{ rotateX, rotateY, scale, transformStyle: "preserve-3d" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full"
      >
        {children}

        {/* Glare overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden"
          style={{ opacity: glareOpacity }}
        >
          <motion.div
            className="absolute w-32 h-32 rounded-full bg-white blur-2xl"
            style={{ left: glareX, top: glareY, translateX: "-50%", translateY: "-50%" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
