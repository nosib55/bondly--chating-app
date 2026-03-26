import React from "react";

export const Avatar = ({ src, alt, size = "md", status, color }) => {
  const getInitials = (name) => {
    if (!name) return "";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={`avatar avatar-${size}`}
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
