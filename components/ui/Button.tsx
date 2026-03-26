import React, { forwardRef } from "react";

export const Button = forwardRef(
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
