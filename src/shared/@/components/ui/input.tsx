import * as React from "react";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const base =
  "flex h-10 border border-input w-full rounded-md bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const inputVariants = cva(base, {
  variants: {
    variant: {
      primary: "",
      ghost_number: "w-7 p-0 m-0 opacity-40 text-right text-sm font-medium bg border-0 without-ring",
    },
    sizing: {
      default: "",
    },
  },
  defaultVariants: {
    variant: "primary",
    sizing: "default",
  },
});

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, variant, sizing, type, ...props }, ref) => {
  return <input type={type} className={cn(inputVariants({ variant, sizing, className }))} ref={ref} {...props} />;
});
Input.displayName = "Input";

export { Input };
