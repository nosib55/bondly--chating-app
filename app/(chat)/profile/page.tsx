"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { Avatar } from "../../../components/ui/Avatar";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ArrowLeft, Camera, Check, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadToImgBB } from "../../../lib/imgbb";
import { useAppStore } from "../../../store/useAppStore";

export default function ProfilePage() {
  const router = useRouter();
  const { me, setMe } = useAppStore();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const dbUser = useAppStore((s: any) => s.me);

  // Form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    async function fetchUser() {
      if (!currentUser) return;
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success) {
          const found = data.users.find((u: any) => u.firebaseUid === currentUser.uid);
          if (found) {
            setMe(found);
            setName(found.name || "");
            setUsername(found.username || "");
            setAvatar(found.avatar || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [currentUser]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadToImgBB(file);
      setAvatar(url);
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser) return;

    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/users/${dbUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, avatar }),
      });
      const data = await res.json();
      if (data.success) {
        setMe(data.user || { ...dbUser, name, username, avatar });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-base">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0f14] overflow-y-auto animate-fadeIn select-none">
      {/* Header */}
      <div className="flex items-center gap-4 sticky top-0 bg-[#151820]/80 backdrop-blur-md border-b border-white/5 px-8 py-6 z-30">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-white/5 rounded-full transition-all text-text-secondary hover:text-white"
          title="Go back"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white leading-none">Edit Profile</h2>
          <p className="text-sm text-[#8890a6] mt-1.5">Personalize your Bondly experience</p>
        </div>
      </div>

      <div className="max-w-3xl w-full mx-auto px-6 py-12 md:px-12">
        <form onSubmit={handleSave} className="space-y-12">
          
          {/* Hero Profile Section */}
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative group">
              <div className={`p-1 rounded-full bg-gradient-to-tr from-accent to-[#a78bfa] shadow-2xl transform transition-transform duration-500 group-hover:scale-[1.02] ${uploadingAvatar ? "animate-pulse brightness-75" : ""}`}>
                <Avatar 
                  src={avatar} 
                  alt={name} 
                  className="!w-36 !h-36 !text-6xl border-4 border-[#151820] shadow-inner" 
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center -m-1 bg-black/40 rounded-full z-20">
                    <Loader2 className="animate-spin text-white" size={32} />
                  </div>
                )}
              </div>
              <label 
                className="absolute bottom-0 right-0 p-3.5 bg-accent hover:bg-accent-dim text-white rounded-full cursor-pointer shadow-2xl translate-x-1 translate-y-1 transform hover:scale-110 active:scale-95 transition-all duration-300 z-10 border-2 border-[#151820]"
                title="Upload new avatar"
              >
                {uploadingAvatar ? <Loader2 className="animate-spin" size={22} /> : <Camera size={22} />}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-bold text-white tracking-tight">{name || "Your Name"}</h3>
              <p className="text-[#8890a6] font-medium">{currentUser?.email}</p>
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#545d72] uppercase tracking-[0.1em] ml-1">Full Name</label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bondly user"
                required
                className="!h-14 !bg-[#1c2030] !border-white/5 hover:!border-white/10 focus:!border-accent/50 transition-colors !text-lg !px-5"
                wrapClass="!w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#545d72] uppercase tracking-[0.1em] ml-1">Username</label>
              <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="unique_username"
                className="!h-14 !bg-[#1c2030] !border-white/5 hover:!border-white/10 focus:!border-accent/50 transition-colors !font-mono !text-lg !px-5"
                wrapClass="!w-full"
              />
            </div>

          </div>

          {/* Action Footer */}
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 mt-8">
            <div className="min-h-[20px]">
              {success && (
                <div className="flex items-center gap-2.5 text-green-400 bg-green-400/10 px-4 py-2 rounded-full text-xs font-semibold animate-fadeInUp">
                  <Check size={14} strokeWidth={3} />
                  <span>Changes saved successfully</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <button 
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-[#8890a6] hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-98"
              >
                Discard Changes
              </button>
              <button 
                type="submit" 
                disabled={saving || !name}
                className="w-full sm:w-auto px-10 py-3.5 text-sm font-bold text-white bg-gradient-to-tr from-accent to-[#a78bfa] rounded-xl hover:opacity-90 hover:shadow-[0_0_25px_rgba(108,99,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98 flex items-center justify-center min-w-[180px]"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Update Profile"
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Danger Zone Section */}
        <div className="mt-28 p-8 rounded-3xl bg-red-500/5 border border-red-500/10 transition-all hover:bg-red-500/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 scale-150 rotate-12 transition-all">
            <Loader2 size={120} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <span className="text-red-400 text-lg font-bold">!</span>
              </div>
              <h4 className="text-sm font-black text-red-500 uppercase tracking-widest">Danger Zone</h4>
            </div>
            <p className="text-xs text-[#8890a6] max-w-md leading-relaxed">
              Once you delete your account, there is no going back. All your messages, contacts, and profile data will be 
              <span className="text-red-400/80 font-semibold px-1">permanently removed</span> from our servers.
            </p>
            <div className="pt-2">
              <button className="px-6 py-2.5 text-xs font-bold text-red-400 hover:text-white border border-red-500/30 hover:bg-red-500 rounded-lg transition-all active:scale-95 whitespace-nowrap">
                Permanently Delete Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
