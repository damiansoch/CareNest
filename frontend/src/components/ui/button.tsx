"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";
import { motion } from "framer-motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// framer-motion redefines several React HTML event handler prop names with
// incompatible function signatures (onDrag → PanInfo, onAnimationStart →
// AnimationDefinition, etc.).  We omit ALL conflicting names from ButtonProps
// up front so TypeScript never sees the mismatch — callers who need those
// low-level events can use <motion.button> directly.
type MotionConflicts =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragOver"
  | "onDragEnter"
  | "onDragLeave"
  | "onDrop"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, MotionConflicts>,
    VariantProps<typeof buttonVariants> {}

// forwardRef<HTMLButtonElement> and motion.button have a minor ref type
// mismatch in framer-motion v11 — casting ref to any is the standard workaround.
const MotionButton = motion.button;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <MotionButton
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 450, damping: 18 }}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { buttonVariants };
