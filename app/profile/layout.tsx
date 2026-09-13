"use client";

import React, { useEffect } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: "block", width: "100%", minHeight: "100vh", background: "#0d0f14" }}>
      {children}
    </div>
  );
}
