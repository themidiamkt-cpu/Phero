"use client";

import { motion, type Variants } from "framer-motion";
import type { RefObject, ReactNode } from "react";
import { cn } from "@/lib/utils";

type TimelineContentProps = {
  as?: "div" | "p";
  animationNum?: number;
  timelineRef?: RefObject<HTMLElement | null>;
  customVariants?: Variants;
  className?: string;
  children: ReactNode;
};

export function TimelineContent({
  as = "div",
  animationNum = 0,
  customVariants,
  className,
  children,
}: TimelineContentProps) {
  const variants =
    customVariants ??
    ({
      hidden: { opacity: 0, y: 20 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.45 },
      }),
    } satisfies Variants);

  const motionProps = {
    custom: animationNum,
    variants,
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true, amount: 0.2 },
    className: cn(className),
  } as const;

  if (as === "p") {
    return <motion.p {...motionProps}>{children}</motion.p>;
  }

  return (
    <motion.div
      custom={animationNum}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
