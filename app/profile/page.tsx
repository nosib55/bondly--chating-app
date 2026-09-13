"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { Avatar } from "../../components/ui/Avatar";
import {
  ArrowLeft,
  Camera,
  Check,
  Loader2,
  Lock,
  User,
  AtSign,
  Mail,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  RotateCcw,
  Trash2,
  Palette,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadToImgBB } from "../../lib/imgbb";
import { useAppStore } from "../../store/useAppStore";
import { COLOR_THEMES, WALLPAPER_PRESETS } from "../../constants/theme.constants";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import Swal from "sweetalert2";

type TabType = "general" | "theme" | "privacy" | "security";

export default function ProfilePage() {
  const router = useRouter();
  const { 
    me, 
    setMe, 
    themeId, 
    setThemeId, 
    wallpaperId, 
    setWallpaperId, 
    wallpaperDim, 
    setWallpaperDim 
  } = useAppStore();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("general");

  // General profile state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [clearingChats, setClearingChats] = useState(false);

  // Original state for discard functionality
  const [originalData, setOriginalData] = useState({
    name: "",
    username: "",
    avatar: "",
  });

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (!currentUser) return;
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success) {
          const found = data.users.find(
            (u: any) => u.firebaseUid === currentUser.uid
          );
          if (found) {
            setMe(found);
            const initialName = found.name || "";
            const initialUsername = found.username || "";
            const initialAvatar = found.avatar || "";

            setName(initialName);
            setUsername(initialUsername);
            setAvatar(initialAvatar);
            setOriginalData({
              name: initialName,
              username: initialUsername,
              avatar: initialAvatar,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [currentUser, setMe]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "File too large",
        text: "Please select an image smaller than 5MB.",
        background: "#151820",
        color: "#e8eaf6",
        confirmButtonColor: "var(--accent)",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadToImgBB(file);
      setAvatar(url);
      Swal.fire({
        icon: "success",
        title: "Avatar Uploaded",
        text: "Click 'Save Changes' to apply your new profile photo.",
        timer: 2000,
        showConfirmButton: false,
        background: "#151820",
        color: "#e8eaf6",
      });
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Could not upload image. Please try again.",
        background: "#151820",
        color: "#e8eaf6",
        confirmButtonColor: "var(--accent)",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/users/${currentUser?.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          avatar: avatar.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMe(data.user);
        setOriginalData({
          name: data.user.name || "",
          username: data.user.username || "",
          avatar: data.user.avatar || "",
        });

        Swal.fire({
          icon: "success",
          title: "Profile Updated",
          timer: 1500,
          showConfirmButton: false,
          background: "#151820",
          color: "#e8eaf6",
        });
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Failed to update profile", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message || "An error occurred while saving your profile.",
        background: "#151820",
        color: "#e8eaf6",
        confirmButtonColor: "var(--accent)",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setName(originalData.name);
    setUsername(originalData.username);
    setAvatar(originalData.avatar);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Passwords mismatch",
        text: "New password and confirm password do not match.",
        background: "#151820",
        color: "#e8eaf6",
        confirmButtonColor: "var(--accent)",
      });
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Password too short",
        text: "New password must be at least 6 characters.",
        background: "#151820",
        color: "#e8eaf6",
        confirmButtonColor: "var(--accent)",
      });
      return;
    }

    setChangingPwd(true);
    try {
      if (currentUser && currentUser.email) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          oldPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);

        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");

        Swal.fire({
          icon: "success",
          title: "Password Changed",
          text: "Your password has been updated securely.",
          background: "#151820",
          color: "#e8eaf6",
          confirmButtonColor: "var(--accent)",
        });
      }
    } catch (err: any) {
      console.error("Failed to change password", err);
      Swal.fire({
        icon: "error",
        title: "Change Failed",
        text:
          err.code === "auth/invalid-credential" ||
          err.code === "auth/wrong-password"
            ? "Current password is incorrect."
            : err.message || "Failed to update password.",
        background: "#151820",
        color: "#e8eaf6",
        confirmButtonColor: "var(--accent)",
      });
    } finally {
      setChangingPwd(false);
    }
  };

  const handleDeleteAllChats = async () => {
    if (!currentUser?.uid) return;
    const result = await Swal.fire({
      title: "Delete ALL Chat History?",
      text: "This will permanently delete all messages and conversations for BOTH SIDES. This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#252a42",
      confirmButtonText: "Yes, delete for both sides",
      cancelButtonText: "Cancel",
      background: "#151820",
      color: "#e8eaf6",
      iconColor: "#ef4444",
    });

    if (result.isConfirmed) {
      setClearingChats(true);
      try {
        const res = await fetch(`/api/messages?uid=${currentUser.uid}&mode=all`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          useAppStore.getState().setActiveChatId(null);
          Swal.fire({
            title: "Chat History Deleted",
            text: data.message || "All chat conversations have been wiped for both sides.",
            icon: "success",
            background: "#151820",
            color: "#e8eaf6",
            confirmButtonColor: "var(--accent)",
          });
        } else {
          throw new Error(data.message || "Failed to delete chat history");
        }
      } catch (err: any) {
        console.error(err);
        Swal.fire({
          title: "Deletion Failed",
          text: err.message || "Something went wrong while deleting history.",
          icon: "error",
          background: "#151820",
          color: "#e8eaf6",
        });
      } finally {
        setClearingChats(false);
      }
    }
  };

  const hasChanges =
    name !== originalData.name ||
    username !== originalData.username ||
    avatar !== originalData.avatar;

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0f14]">
        <Loader2 className="animate-spin text-accent" size={32} />
        <span className="text-xs font-medium text-text-muted mt-3">
          Loading profile...
        </span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }} className="bg-[#0d0f14]">
      {/* Top Header Bar */}
      <div className="sticky top-0 bg-[#151820]/90 backdrop-blur-xl border-b border-white/10 px-6 sm:px-10 py-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-[#1c2030] hover:bg-[#252a42] flex items-center justify-center text-text-secondary hover:text-white transition-all border border-white/10 shadow-sm cursor-pointer"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Settings & Profile
            </h1>
            <p className="text-xs text-text-muted">
              Manage your personal account, themes, and preferences
            </p>
          </div>
        </div>

        {/* Action button if changes exist */}
        {activeTab === "general" && hasChanges && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-3.5 py-2 text-xs font-semibold text-text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={() => handleSave()}
              disabled={saving || !name.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-accent hover:opacity-90 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-accent/25 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
              <span>Save</span>
            </button>
          </div>
        )}
      </div>

      {/* Centered Content Container */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* User Showcase Hero Card */}
        <div className="rounded-3xl bg-[#151820] border border-white/10 p-6 sm:p-7 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center sm:items-center gap-6">
          {/* Avatar with Camera Icon */}
          <div className="relative group flex-shrink-0">
            <div
              className={`w-24 h-24 rounded-2xl overflow-hidden border-2 border-accent/40 relative flex items-center justify-center bg-[#1c2030] shadow-2xl ${
                uploadingAvatar ? "opacity-60" : ""
              }`}
            >
              <Avatar
                src={avatar}
                alt={name || "User"}
                className="!w-full !h-full !text-3xl !rounded-2xl"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <Loader2 className="animate-spin text-accent" size={24} />
                </div>
              )}
            </div>

            <label
              className="absolute -bottom-2 -right-2 p-2.5 bg-accent hover:opacity-90 text-white rounded-xl cursor-pointer shadow-lg transform hover:scale-105 active:scale-95 transition-all border-2 border-[#151820] z-10 flex items-center justify-center"
              title="Upload new avatar"
            >
              {uploadingAvatar ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Camera size={14} />
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </label>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-white truncate tracking-tight">
                {name || "Anonymous"}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-accent/15 border border-accent/25 text-accent">
                {username ? `@${username}` : "@username_unset"}
              </span>
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Mail size={12} />
                {currentUser?.email || "No email"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Responsive Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-[#181b24] border border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "general"
                ? "bg-accent text-white shadow-lg shadow-accent/25 scale-[1.02]"
                : "text-text-muted hover:text-white hover:bg-white/5"
            }`}
          >
            <User size={15} />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("theme")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "theme"
                ? "bg-accent text-white shadow-lg shadow-accent/25 scale-[1.02]"
                : "text-text-muted hover:text-white hover:bg-white/5"
            }`}
          >
            <Palette size={15} />
            <span>Theme & Wallpaper</span>
          </button>

          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "privacy"
                ? "bg-accent text-white shadow-lg shadow-accent/25 scale-[1.02]"
                : "text-text-muted hover:text-white hover:bg-white/5"
            }`}
          >
            <ShieldCheck size={15} />
            <span>Chat History</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "security"
                ? "bg-accent text-white shadow-lg shadow-accent/25 scale-[1.02]"
                : "text-text-muted hover:text-white hover:bg-white/5"
            }`}
          >
            <Lock size={15} />
            <span>Security</span>
          </button>
        </div>

        {/* TAB 1: Profile Information Form */}
        {activeTab === "general" && (
          <form
            onSubmit={handleSave}
            className="rounded-3xl bg-[#151820] border border-white/10 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl animate-fadeIn"
          >
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User size={16} className="text-accent" />
                Personal Information
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Update how other users see you across Bondly
              </p>
            </div>

            <div className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-accent" />
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full h-12 px-4 rounded-xl bg-[#1c2030] border border-white/10 text-white placeholder-text-muted text-sm font-medium focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all shadow-inner"
                />
              </div>

              {/* Username Handle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <AtSign size={13} className="text-accent" />
                  Username Handle
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="your_unique_handle"
                    className="w-full h-12 pl-9 pr-4 rounded-xl bg-[#1c2030] border border-white/10 text-white placeholder-text-muted text-sm font-mono focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-text-muted">
                  Used by friends to search and find you easily.
                </p>
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={13} className="text-accent" />
                    Account Email
                  </label>
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Check size={12} /> Verified
                  </span>
                </div>
                <input
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  className="w-full h-12 px-4 rounded-xl bg-[#1c2030]/60 border border-white/5 text-text-muted text-sm cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-text-muted hover:text-white hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Discard</span>
                </button>
              )}
              <button
                type="submit"
                disabled={saving || !name.trim() || !hasChanges}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-accent/25 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Theme & Wallpaper */}
        {activeTab === "theme" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Color Accent Card */}
            <div className="rounded-3xl bg-[#151820] border border-white/10 p-6 sm:p-8 space-y-5 shadow-xl backdrop-blur-xl">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette size={16} className="text-accent" />
                  Color Theme Accent
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Pick your favorite primary color for buttons, glowing accents, and message bubbles
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {COLOR_THEMES.map((theme) => {
                  const isSelected = themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeId(theme.id)}
                      className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? "bg-white/10 border-accent shadow-[0_0_20px_var(--accent-glow)] scale-[1.02]"
                          : "bg-[#1c2030] border-white/5 hover:bg-[#252a42] hover:border-white/10"
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shadow-md relative flex-shrink-0"
                        style={{ background: theme.accent }}
                      >
                        {isSelected && <Check size={15} className="text-white drop-shadow" strokeWidth={3} />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {theme.name}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block">
                          {theme.accent}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Wallpaper Card */}
            <div className="rounded-3xl bg-[#151820] border border-white/10 p-6 sm:p-8 space-y-5 shadow-xl backdrop-blur-xl">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon size={16} className="text-accent" />
                  Chat Wallpaper Presets (Gemini AI Included)
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Select a wallpaper background to personalize your conversation screen
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {WALLPAPER_PRESETS.map((wp) => {
                  const isSelected = wallpaperId === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => setWallpaperId(wp.id)}
                      className={`group relative h-28 rounded-2xl border overflow-hidden transition-all text-left flex flex-col justify-end p-3.5 cursor-pointer ${
                        isSelected
                          ? "border-accent shadow-[0_0_20px_var(--accent-glow)] scale-[1.02]"
                          : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{
                          backgroundImage: wp.type === "image" ? `url('${wp.bgStyle}')` : undefined,
                          background: wp.type !== "image" ? wp.bgStyle : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 bg-black/40" />
                      </div>

                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center shadow-lg z-10">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      )}

                      <div className="relative z-10">
                        <span className="text-xs font-bold text-white drop-shadow block truncate">
                          {wp.name}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-white/75 font-semibold">
                          {wp.type}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Wallpaper Dimmer Control */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-[#1c2030] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-secondary flex items-center gap-2">
                    <Sliders size={14} className="text-accent" />
                    Wallpaper Dimming / Darkness
                  </label>
                  <span className="text-xs font-bold text-accent px-2 py-0.5 rounded-full bg-accent/15 border border-accent/25">
                    {wallpaperDim}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={wallpaperDim}
                  onChange={(e) => setWallpaperDim(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer h-2 bg-[#151820] rounded-lg appearance-none"
                />
                <p className="text-[11px] text-text-muted">
                  Slide to adjust darkness. Higher dimming keeps text high-contrast and very easy to read.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Chat History Management */}
        {activeTab === "privacy" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="rounded-3xl bg-[#151820] border border-white/10 p-6 sm:p-8 space-y-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                  <Trash2 size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-white">
                    Clear All Chat History
                  </h4>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Permanently wipe all messages across all conversations for <span className="text-white font-semibold">both sides</span>. Your contacts and profile will remain intact.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDeleteAllChats}
                  disabled={clearingChats}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 border border-red-500/30 transition-all flex items-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-50"
                >
                  {clearingChats ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  <span>Delete All Chats (Both Sides)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Security & Password */}
        {activeTab === "security" && (
          <form
            onSubmit={handlePasswordChange}
            className="rounded-3xl bg-[#151820] border border-white/10 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl animate-fadeIn"
          >
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound size={16} className="text-accent" />
                Change Password
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Ensure your account is using a strong and unique password
              </p>
            </div>

            <div className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showOldPwd ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full h-12 px-4 pr-11 rounded-xl bg-[#1c2030] border border-white/10 text-white placeholder-text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPwd(!showOldPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    {showOldPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full h-12 px-4 pr-11 rounded-xl bg-[#1c2030] border border-white/10 text-white placeholder-text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full h-12 px-4 pr-11 rounded-xl bg-[#1c2030] border border-white/10 text-white placeholder-text-muted text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="submit"
                disabled={changingPwd || !oldPassword || !newPassword || !confirmPassword}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-accent/25 cursor-pointer"
              >
                {changingPwd ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Lock size={14} />
                )}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
