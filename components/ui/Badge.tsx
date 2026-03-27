import React from "react";

interface BadgeProps {
  count?: number;
  className?: string;
}

export const Badge = ({ count, className = "" }: BadgeProps) => {
  if (!count || count <= 0) return null;
  return (
    <span className={`badge ${className}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
};
