import React from "react";

export const Badge = ({ count, className = "" }) => {
  if (!count || count <= 0) return null;
  return (
    <span className={`badge ${className}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
};
