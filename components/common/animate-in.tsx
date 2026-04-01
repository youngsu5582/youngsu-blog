"use client";

import { type ReactNode } from "react";

interface AnimateInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimateIn({ children, delay = 0, className = "" }: AnimateInProps) {
  return (
    <div
      className={`animate-in ${className}`}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
