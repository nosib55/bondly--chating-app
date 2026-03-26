import React, { forwardRef } from "react";

export const Input = forwardRef(
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
