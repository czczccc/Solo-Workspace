"use client";

import type { VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { press } from "../../motion";
import { Spinner } from "./spinner";
import { buttonVariants } from "./button-variants";

export { buttonVariants };


type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** 把样式交给子元素（例如 <a>），此时不带按下动效 */
    asChild?: boolean;
    /** 加载中：禁用并显示转圈 */
    loading?: boolean;
  };

export function Button({ className, variant, size, asChild, loading, disabled, children, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }
  const {
    onDrag: _onDrag,
    onDragStart: _onDragStart,
    onDragEnd: _onDragEnd,
    onAnimationStart: _onAnimationStart,
    ...rest
  } = props;
  return (
    <motion.button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileTap={variant === "link" ? undefined : press.whileTap}
      transition={press.transition}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </motion.button>
  );
}
