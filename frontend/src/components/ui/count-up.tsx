"use client";

import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

interface CountUpProps {
  value: number;
  duration?: number;
}

export function CountUp({ value, duration = 1.2 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const controls = animate(0, value, {
      duration,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate(latest) {
        el.textContent = String(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [value, duration]);

  return <span ref={ref}>0</span>;
}
