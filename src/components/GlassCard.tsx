"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";
import { forwardRef, type ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: ReactNode;
  variant?: "default" | "elevated" | "inset" | "glow";
  intensity?: "light" | "medium" | "strong";
  hoverEffect?: boolean;
  glowColor?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className,
      variant = "default",
      intensity = "medium",
      hoverEffect = true,
      glowColor,
      ...props
    },
    ref
  ) => {
    const intensityStyles = {
      light: "bg-white/5 backdrop-blur-md",
      medium: "bg-white/10 backdrop-blur-xl",
      strong: "bg-white/15 backdrop-blur-2xl",
    };

    const variantStyles = {
      default: "border border-white/10 shadow-lg",
      elevated: "border border-white/20 shadow-2xl shadow-black/20",
      inset: "border border-white/5 shadow-inner",
      glow: "border border-white/20 shadow-2xl",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-3xl overflow-hidden",
          intensityStyles[intensity],
          variantStyles[variant],
          hoverEffect && "transition-all duration-500",
          className
        )}
        whileHover={
          hoverEffect
            ? {
                scale: 1.01,
                boxShadow: glowColor
                  ? `0 0 60px ${glowColor}`
                  : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }
            : undefined
        }
        {...props}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Animated border gradient */}
        <div className="absolute inset-0 rounded-3xl opacity-50 pointer-events-none">
          <div className="absolute inset-[-1px] rounded-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
