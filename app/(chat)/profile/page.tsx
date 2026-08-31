"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { Avatar } from "../../../components/ui/Avatar";
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
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  RotateCcw,
  Trash2,
  Clock,
  Timer,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadToImgBB } from "../../../lib/imgbb";
import { useAppStore } from "../../../store/useAppStore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import Swal from "sweetalert2";

type TabType = "general" | "privacy" | "security";

export default function ProfilePage() {
  const router = useRouter();
  const { me, setMe } = useAppStore();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("general");

  // General profile state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Auto-delete state
  const [autoDelete12h, setAutoDelete12h] = useState(false);
  const [togglingAutoDelete, setTogglingAutoDelete] = useState(false);
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
            setAutoDelete12h(!!found.autoDelete12h);
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
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
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
        text: "Don't forget to click 'Save Changes' to save your new avatar.",
        timer: 2200,
        showConfirmButton: false,
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
      });
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Could not upload image. Please try again.",
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
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
    setSuccess(false);

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
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);

        Swal.fire({
          icon: "success",
          title: "Profile Updated",
          timer: 1500,
          showConfirmButton: false,
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
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
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
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
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
        confirmButtonColor: "var(--accent)",
      });
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Password too short",
        text: "New password must be at least 6 characters.",
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
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
          title: "Password Updated",
          text: "Your password has been changed successfully.",
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          confirmButtonColor: "var(--accent)",
        });
      }
    } catch (err: any) {
      console.error("Failed to change password", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          err.code === "auth/invalid-credential" ||
          err.code === "auth/wrong-password"
            ? "Current password is incorrect."
            : err.message || "Failed to update password.",
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
        confirmButtonColor: "var(--accent)",
      });
    } finally {
      setChangingPwd(false);
    }
  };

  const handleToggleAutoDelete = async () => {
    if (!currentUser?.uid) return;
    const nextVal = !autoDelete12h;
    setTogglingAutoDelete(true);

    try {
      const res = await fetch(`/api/users/${currentUser.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoDelete12h: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoDelete12h(nextVal);
        setMe(data.user);
        Swal.fire({
          icon: "success",
          title: nextVal ? "12h Auto-Delete Enabled" : "12h Auto-Delete Disabled",
          text: nextVal
            ? "Messages older than 12 hours will automatically be wiped for both sides."
            : "Automatic 12-hour chat cleanup has been turned off.",
          timer: 2000,
          showConfirmButton: false,
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
        });
      }
    } catch (err) {
      console.error("Failed to update auto-delete setting", err);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: "Could not save 12-hour auto-delete preference.",
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
      });
    } finally {
      setTogglingAutoDelete(false);
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
      cancelButtonColor: "var(--bg-active)",
      confirmButtonText: "Yes, delete for both sides",
      cancelButtonText: "Cancel",
      background: "var(--bg-surface)",
      color: "var(--text-primary)",
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
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
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
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
        });
      } finally {
        setClearingChats(false);
      }
    }
  };

  const handleDelete12hChats = async () => {
    if (!currentUser?.uid) return;
    const result = await Swal.fire({
      title: "Purge >12h Old History?",
      text: "All messages older than 12 hours across all conversations will be permanently deleted for both sides.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "var(--bg-active)",
      confirmButtonText: "Yes, purge >12h messages",
      cancelButtonText: "Cancel",
      background: "var(--bg-surface)",
      color: "var(--text-primary)",
      iconColor: "#f59e0b",
    });

    if (result.isConfirmed) {
      setClearingChats(true);
      try {
        const res = await fetch(`/api/messages?uid=${currentUser.uid}&mode=12h`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({
            title: "Old Messages Purged",
            text: data.message || "Messages older than 12 hours have been wiped for both sides.",
            icon: "success",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            confirmButtonColor: "var(--accent)",
          });
        }
      } catch (err) {
        console.error(err);
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
      <div className="flex-1 flex flex-col items-center justify-center bg-base">
        <Loader2 className="animate-spin text-accent" size={32} />
        <span className="text-xs font-medium text-text-muted mt-3">
          Loading profile...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-base overflow-y-auto custom-scrollbar select-none">
      {/* Top Header */}
      <div className="sticky top-0 bg-surface/80 backdrop-blur-md border-b border-white/5 px-6 py-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-elevated/60 hover:bg-elevated flex items-center justify-center text-text-secondary hover:text-text-primary transition-all border border-white/5"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              Settings & Profile
            </h1>
            <p className="text-xs text-text-muted">
              Manage your account and preferences
            </p>
          </div>
        </div>

        {/* Quick Save Indicator / Button */}
        {activeTab === "general" && hasChanges && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary rounded-lg transition-all"
            >
              Discard
            </button>
            <button
              onClick={() => handleSave()}
              disabled={saving || !name.trim()}
              className="px-4 py-1.5 text-xs font-bold text-white bg-accent hover:bg-accent-dim rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-accent/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
              <span>Save</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Compact Hero Card */}
        <div className="rounded-2xl bg-surface/70 border border-white/5 p-5 shadow-sm backdrop-blur-sm flex items-center gap-5">
          {/* Avatar with Camera Overlay */}
          <div className="relative group flex-shrink-0">
            <div
              className={`w-20 h-20 rounded-full overflow-hidden border-2 border-accent/40 relative flex items-center justify-center bg-elevated shadow-inner ${
                uploadingAvatar ? "opacity-60" : ""
              }`}
            >
              <Avatar
                src={avatar}
                alt={name || "User"}
                className="!w-full !h-full !text-2xl"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="animate-spin text-accent" size={20} />
                </div>
              )}
            </div>

            <label
              className="absolute -bottom-1 -right-1 p-2 bg-accent hover:bg-accent-dim text-white rounded-full cursor-pointer shadow-md transform hover:scale-105 active:scale-95 transition-all border-2 border-surface z-10 flex items-center justify-center"
              title="Change picture"
            >
              {uploadingAvatar ? (
                <Loader2 className="animate-spin" size={13} />
              ) : (
                <Camera size={13} />
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

          {/* User Meta */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary truncate">
                {name || "User"}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-xs font-mono text-accent truncate">
              {username ? `@${username}` : "@set_username"}
            </p>
            <p className="text-xs text-text-muted truncate">
              {currentUser?.email || "No email"}
            </p>
          </div>
        </div>

        {/* Tab Navigation - Pill Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-surface/80 border border-white/5 rounded-xl">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "general"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-white/5"
            }`}
          >
            <User size={14} />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "privacy"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-white/5"
            }`}
          >
            <Timer size={14} />
            <span>Chat Privacy</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "security"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-white/5"
            }`}
          >
            <Lock size={14} />
            <span>Security</span>
          </button>
        </div>

        {/* TAB 1: Profile Info */}
        {activeTab === "general" && (
          <form
            onSubmit={handleSave}
            className="rounded-2xl bg-surface/60 border border-white/5 p-5 sm:p-6 space-y-5 animate-fadeIn"
          >
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-accent" />
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-elevated/70 border border-white/5 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <AtSign size={13} className="text-accent" />
                  Username Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    placeholder="username"
                    className="w-full h-11 pl-8 pr-4 rounded-xl bg-elevated/70 border border-white/5 text-text-primary placeholder-text-muted text-sm font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={13} className="text-accent" />
                    Email
                  </label>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified
                  </span>
                </div>
                <input
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  className="w-full h-11 px-3.5 rounded-xl bg-elevated/30 border border-white/5 text-text-muted text-sm cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={!hasChanges || saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-md shadow-accent/20"
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

        {/* TAB 2: Chat Privacy & Auto-Delete */}
        {activeTab === "privacy" && (
          <div className="space-y-4 animate-fadeIn">
            {/* 12-Hour Auto-Delete Toggle */}
            <div className="rounded-2xl bg-surface/60 border border-white/5 p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent flex-shrink-0">
                    <Timer size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-primary">
                        12-Hour Auto-Delete
                      </h4>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          autoDelete12h
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                            : "bg-white/5 text-text-muted border border-white/5"
                        }`}
                      >
                        {autoDelete12h ? "ON" : "OFF"}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      Messages automatically delete after 12 hours for <span className="text-text-primary">both sides</span>.
                    </p>
                  </div>
                </div>

                {/* Switch */}
                <button
                  type="button"
                  onClick={handleToggleAutoDelete}
                  disabled={togglingAutoDelete}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                    autoDelete12h ? "bg-accent" : "bg-elevated"
                  }`}
                  role="switch"
                  aria-checked={autoDelete12h}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      autoDelete12h ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {autoDelete12h && (
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-2 text-xs text-accent">
                  <Clock size={14} className="flex-shrink-0" />
                  <span>Auto-delete active: messages older than 12h are cleaned continuously for both sides.</span>
                </div>
              )}
            </div>

            {/* Quick Purge Options */}
            <div className="rounded-2xl bg-surface/60 border border-white/5 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                  <Trash2 size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-text-primary">
                    Clear Chat History
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    Permanently wipe chat history for <span className="text-text-primary">both sides</span>. Contacts will remain in your sidebar.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDelete12hChats}
                  disabled={clearingChats}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Clock size={13} />
                  <span>Purge &gt;12h History</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAllChats}
                  disabled={clearingChats}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 border border-red-500/30 transition-all flex items-center gap-1.5 shadow-sm shadow-red-500/20 disabled:opacity-50"
                >
                  {clearingChats ? (
                    <Loader2 className="animate-spin" size={13} />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  <span>Delete All Chats (Both Sides)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Security */}
        {activeTab === "security" && (
          <form
            onSubmit={handlePasswordChange}
            className="rounded-2xl bg-surface/60 border border-white/5 p-5 sm:p-6 space-y-4 animate-fadeIn"
          >
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <KeyRound size={15} className="text-accent" />
                Change Password
              </h3>
            </div>

            <div className="space-y-3">
              {/* Current Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showOldPwd ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-elevated/70 border border-white/5 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPwd(!showOldPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                  >
                    {showOldPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-elevated/70 border border-white/5 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                  >
                    {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-elevated/70 border border-white/5 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                  >
                    {showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={
                  changingPwd ||
                  !oldPassword ||
                  !newPassword ||
                  newPassword.length < 6
                }
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-md shadow-accent/20"
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
