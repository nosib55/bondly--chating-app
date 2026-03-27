import React, { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "secondary";
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", className = "", ...props }, ref) => {
    let baseClass = "btn-primary";
    
    // Simplistic variant support for UI demo
    if (variant === "ghost") {
      baseClass = "icon-btn w-auto px-4"; 
    }

    return (
      <button
        ref={ref}
        className={`${baseClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
