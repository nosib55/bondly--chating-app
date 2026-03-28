import React from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  status?: boolean;
  color?: string;
  className?: string;
  unreadCount?: number;
}

export const Avatar = ({ src, alt, size = "md", status, color, className = "", unreadCount }: AvatarProps) => {
  const getInitials = (name?: string) => {
    if (!name) return "";
    return name.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: "w-9 h-9 text-[13px]",
    md: "w-11 h-11 text-[16px]",
    lg: "w-13 h-13 text-[20px]",
  };

  return (
    <div
      className={`relative flex-shrink-0 rounded-full flex items-center justify-center font-semibold uppercase select-none ${sizeClasses[size] || sizeClasses.md} ${className}`}
      style={{ backgroundColor: color || "var(--bg-hover)", color: "#fff" }}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span className="flex items-center justify-center w-full h-full">
          {getInitials(alt)}
        </span>
      )}
      
      {status !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1d2d] ${
            status ? "bg-[#34d399]" : "bg-gray-500"
          }`}
          style={{ zIndex: 10 }}
        />
      )}

      {unreadCount !== undefined && unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-accent text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black border-2 border-[#0a0a0d] shadow-lg animate-pulse">
           {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}
    </div>
  );
};
