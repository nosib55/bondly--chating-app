import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  wrapClass?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, className = "", wrapClass = "", ...props }, ref) => {
    return (
      <div className={`input-wrap ${wrapClass}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          ref={ref}
          className={`input-field ${icon ? "" : "pl-[14px]"} ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
