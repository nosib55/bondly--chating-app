import React from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  status?: boolean;
  color?: string;
  className?: string;
}

export const Avatar = ({ src, alt, size = "md", status, color, className = "" }: AvatarProps) => {
  const getInitials = (name?: string) => {
    if (!name) return "";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{ backgroundColor: color || "var(--bg-hover)", color: "#fff" }}
    >
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <span>{getInitials(alt)}</span>
      )}
      
      {status !== undefined && (
        <span
          className={`avatar-status ${status ? "online" : "offline"}`}
        />
      )}
    </div>
  );
};
