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
  RefreshCw,
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

type TabType = "general" | "security" | "danger";

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
        background: "#151820",
        color: "#fff",
        confirmButtonColor: "#6c63ff",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadToImgBB(file);
      setAvatar(url);
      Swal.fire({
        icon: "success",
        title: "Avatar Uploaded!",
        text: "Click 'Save Changes' to apply your new picture.",
        timer: 2000,
        showConfirmButton: false,
        background: "#151820",
        color: "#fff",
      });
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Could not upload image. Please try again.",
        background: "#151820",
        color: "#fff",
        confirmButtonColor: "#6c63ff",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDiscard = () => {
    setName(originalData.name);
    setUsername(originalData.username);
    setAvatar(originalData.avatar);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me?._id) return;

    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/users/${me._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, avatar }),
      });
      const data = await res.json();
      if (data.success) {
        setMe(data.user || { ...me, name, username, avatar });
        setOriginalData({ name, username, avatar });
        setSuccess(true);
        Swal.fire({
          icon: "success",
          title: "Profile Updated!",
          text: "Your profile information has been saved.",
          timer: 2000,
          showConfirmButton: false,
          background: "#151820",
          color: "#fff",
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Failed to update profile", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message || "Something went wrong.",
        background: "#151820",
        color: "#fff",
        confirmButtonColor: "#6c63ff",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.email) return;

    if (newPassword.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Weak Password",
        text: "New password must be at least 6 characters.",
        background: "#151820",
        color: "#fff",
        confirmButtonColor: "#6c63ff",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Mismatch",
        text: "New password and confirmation do not match.",
        background: "#151820",
        color: "#fff",
        confirmButtonColor: "#6c63ff",
      });
      return;
    }

    setChangingPwd(true);
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        oldPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      Swal.fire({
        icon: "success",
        title: "Password Updated!",
        text: "Your security credentials have been updated successfully.",
        background: "#151820",
        color: "#fff",
        confirmButtonColor: "#6c63ff",
      });

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      const msg =
        err.code === "auth/wrong-password" || err.code === "auth/invalid-credential"
          ? "Incorrect current password. Please try again."
          : err.message || "Something went wrong.";
      Swal.fire({
        icon: "error",
        title: "Security Error",
        text: msg,
        background: "#151820",
        color: "#fff",
        confirmButtonColor: "#6c63ff",
      });
    } finally {
      setChangingPwd(false);
    }
  };

  const handleToggleAutoDelete = async () => {
    if (!me?._id) return;
    const newValue = !autoDelete12h;
    setTogglingAutoDelete(true);
    try {
      const res = await fetch(`/api/users/${me._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoDelete12h: newValue }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoDelete12h(newValue);
        setMe({ ...me, autoDelete12h: newValue });
        Swal.fire({
          icon: "success",
          title: newValue ? "12-Hour Auto-Delete Enabled" : "12-Hour Auto-Delete Disabled",
          text: newValue
            ? "Messages older than 12 hours will automatically be deleted for both sides."
            : "Automatic 12-hour chat history deletion is now disabled.",
          timer: 2500,
          showConfirmButton: false,
          background: "#151820",
          color: "#fff",
        });
      }
    } catch (err) {
      console.error("Failed to update auto-delete setting", err);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: "Could not save 12-hour auto-delete preference.",
        background: "#151820",
        color: "#fff",
      });
    } finally {
      setTogglingAutoDelete(false);
    }
  };

  const handleDeleteAllChats = async () => {
    if (!currentUser?.uid) return;
    const result = await Swal.fire({
      title: "Delete ALL Chat History?",
      text: "This will permanently delete every single message and conversation for BOTH SIDES (both you and the other participants). This action CANNOT be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#222638",
      confirmButtonText: "Yes, delete for both sides",
      cancelButtonText: "Cancel",
      background: "#151820",
      color: "#fff",
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
            title: "Chat History Deleted!",
            text: data.message || "All chat conversations have been wiped for both sides.",
            icon: "success",
            background: "#151820",
            color: "#fff",
            confirmButtonColor: "#6c63ff",
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
          color: "#fff",
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
      cancelButtonColor: "#222638",
      confirmButtonText: "Yes, purge >12h messages",
      cancelButtonText: "Cancel",
      background: "#151820",
      color: "#fff",
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
            title: "Old Messages Purged!",
            text: data.message || "Messages older than 12 hours have been wiped for both sides.",
            icon: "success",
            background: "#151820",
            color: "#fff",
            confirmButtonColor: "#6c63ff",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setClearingChats(false);
      }
    }
  };

  const handleDeleteAccountClick = () => {
    Swal.fire({
      title: "Delete Account?",
      text: "This action is permanent and cannot be undone. All your chats and media will be erased.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#222638",
      confirmButtonText: "Yes, delete my account",
      cancelButtonText: "Cancel",
      background: "#151820",
      color: "#fff",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Account Deletion",
          text: "Please contact support or re-authenticate to finalize account termination.",
          icon: "info",
          background: "#151820",
          color: "#fff",
          confirmButtonColor: "#6c63ff",
        });
      }
    });
  };

  const hasChanges =
    name !== originalData.name ||
    username !== originalData.username ||
    avatar !== originalData.avatar;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d0f14]">
        <Loader2 className="animate-spin text-accent" size={36} />
        <span className="text-sm font-medium text-[#8890a6] mt-3">
          Loading profile...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0f14] overflow-y-auto select-none">
      {/* Top App Header */}
      <div className="sticky top-0 bg-[#151820]/90 backdrop-blur-xl border-b border-white/[0.08] px-6 sm:px-10 py-5 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8890a6] hover:text-white transition-all active:scale-95 border border-white/5"
            title="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Edit Profile
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/15 text-accent font-semibold border border-accent/20 hidden sm:inline-block">
                Settings
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#8890a6] mt-0.5">
              Manage your personal info and security preferences
            </p>
          </div>
        </div>

        {activeTab === "general" && hasChanges && (
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-2 text-xs font-semibold text-[#8890a6] hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-accent to-[#8b5cf6] rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-accent/25 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Save size={14} />
              )}
              <span>Save</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Profile Hero Card */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#1c2030]/90 to-[#151820]/90 border border-white/[0.08] p-6 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Ambient Glow in background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-accent/20 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Avatar with Ring & Camera Button */}
            <div className="relative group flex-shrink-0">
              <div
                className={`p-1 rounded-full bg-gradient-to-tr from-accent via-[#a78bfa] to-[#ec4899] shadow-xl transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(108,99,255,0.4)] ${
                  uploadingAvatar ? "animate-pulse brightness-90" : ""
                }`}
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#151820] bg-[#1c2030] relative flex items-center justify-center">
                  <Avatar
                    src={avatar}
                    alt={name || "User"}
                    className="!w-full !h-full !text-4xl"
                  />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                      <Loader2 className="animate-spin text-accent" size={28} />
                      <span className="text-[10px] font-bold mt-1 text-white/90">
                        Uploading
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Trigger Button */}
              <label
                className="absolute bottom-1 right-1 p-3 bg-gradient-to-tr from-accent to-[#8b5cf6] hover:from-[#7c73ff] hover:to-[#9d74ff] text-white rounded-full cursor-pointer shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-[#151820] z-20 flex items-center justify-center"
                title="Change profile picture"
              >
                {uploadingAvatar ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Camera size={18} />
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

            {/* Profile Info Summary */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {name || "Anonymous User"}
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit mx-auto sm:mx-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Account
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-[#8890a6]">
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                  <AtSign size={13} className="text-accent" />
                  <span className="font-mono text-text-primary">
                    {username ? `@${username}` : "no_username"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                  <Mail size={13} className="text-accent" />
                  <span>{currentUser?.email || "No email"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-[#151820] border border-white/[0.08] rounded-2xl">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "general"
                ? "bg-accent text-white shadow-lg shadow-accent/25"
                : "text-[#8890a6] hover:text-white hover:bg-white/5"
            }`}
          >
            <User size={16} />
            <span>General Info</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "security"
                ? "bg-accent text-white shadow-lg shadow-accent/25"
                : "text-[#8890a6] hover:text-white hover:bg-white/5"
            }`}
          >
            <Lock size={16} />
            <span>Security & Password</span>
          </button>

          <button
            onClick={() => setActiveTab("danger")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "danger"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "text-[#8890a6] hover:text-red-400 hover:bg-red-500/5"
            }`}
          >
            <AlertTriangle size={16} />
            <span>Account Actions</span>
          </button>
        </div>

        {/* TAB 1: General Info */}
        {activeTab === "general" && (
          <form
            onSubmit={handleSave}
            className="rounded-3xl bg-[#151820] border border-white/[0.08] p-6 sm:p-8 space-y-6 shadow-xl animate-fadeIn"
          >
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User size={18} className="text-accent" />
                Personal Information
              </h3>
              <p className="text-xs text-[#8890a6] mt-1">
                Update how your name and handle appear across Bondly
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8890a6] uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} className="text-accent" />
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full h-12 px-4 rounded-xl bg-[#1c2030] border border-white/10 text-white placeholder-[#545d72] text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8890a6] uppercase tracking-wider flex items-center gap-1.5">
                  <AtSign size={14} className="text-accent" />
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))
                    }
                    placeholder="e.g. johndoe"
                    className="w-full h-12 px-4 rounded-xl bg-[#1c2030] border border-white/10 text-white placeholder-[#545d72] text-sm font-mono focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#8890a6] uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={14} className="text-accent" />
                    Email Address
                  </label>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={13} /> Verified
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    value={currentUser?.email || ""}
                    disabled
                    className="w-full h-12 px-4 rounded-xl bg-[#1c2030]/60 border border-white/5 text-[#8890a6] text-sm cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[11px] text-[#545d72]">
                  Your email address is managed via your Firebase Authentication login.
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="min-h-[20px]">
                {success && (
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3.5 py-1.5 rounded-full text-xs font-semibold animate-fadeIn">
                    <Check size={14} />
                    <span>Changes saved successfully!</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={!hasChanges || saving}
                  className="flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs font-semibold text-[#8890a6] hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Discard</span>
                </button>
                <button
                  type="submit"
                  disabled={saving || !name}
                  className="flex-1 sm:flex-initial px-8 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-accent to-[#8b5cf6] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-98 min-w-[150px]"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Security & Password */}
        {activeTab === "security" && (
          <form
            onSubmit={handlePasswordChange}
            className="rounded-3xl bg-[#151820] border border-white/[0.08] p-6 sm:p-8 space-y-6 shadow-xl animate-fadeIn"
          >
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound size={18} className="text-accent" />
                Change Password
              </h3>
              <p className="text-xs text-[#8890a6] mt-1">
                Ensure your account stays secure with a strong password
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8890a6] uppercase tracking-wider">
                  Current Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showOldPwd ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-[#1c2030] border border-white/10 text-white placeholder-[#545d72] text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPwd(!showOldPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8890a6] hover:text-white p-1"
                  >
                    {showOldPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8890a6] uppercase tracking-wider">
                  New Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-[#1c2030] border border-white/10 text-white placeholder-[#545d72] text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8890a6] hover:text-white p-1"
                  >
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8890a6] uppercase tracking-wider">
                  Confirm New Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-[#1c2030] border border-white/10 text-white placeholder-[#545d72] text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8890a6] hover:text-white p-1"
                  >
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={
                  changingPwd ||
                  !oldPassword ||
                  !newPassword ||
                  newPassword.length < 6
                }
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-accent/20"
              >
                {changingPwd ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Lock size={16} />
                )}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Danger Zone & Privacy Settings */}
        {activeTab === "danger" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header banner */}
            <div className="rounded-3xl bg-gradient-to-r from-red-500/[0.08] via-amber-500/[0.04] to-transparent border border-red-500/20 p-6 sm:p-8 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-red-400">
                    Chat Privacy & Danger Zone
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8890a6] leading-relaxed">
                    Manage one-click chat history deletion, 12-hour automated wipe settings, and permanent account actions. Deletions apply to <strong className="text-white">both sides</strong> (both sender and receiver).
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 1: 12-Hour Auto-Delete Chat History Toggle */}
            <div className="rounded-3xl bg-[#151820] border border-white/[0.08] p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
                    <Timer size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        12-Hour Auto-Delete Chat History
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          autoDelete12h
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/5 text-[#8890a6] border border-white/10"
                        }`}
                      >
                        {autoDelete12h ? "Active (12h)" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-[#8890a6] mt-1 max-w-xl">
                      After every 12 hours, messages will automatically disappear and be permanently deleted for <span className="text-white font-medium">both sides</span> across all your conversations.
                    </p>
                  </div>
                </div>

                {/* Toggle switch button */}
                <button
                  type="button"
                  onClick={handleToggleAutoDelete}
                  disabled={togglingAutoDelete}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                    autoDelete12h ? "bg-accent" : "bg-[#222638]"
                  }`}
                  role="switch"
                  aria-checked={autoDelete12h}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      autoDelete12h ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Status banner */}
              {autoDelete12h && (
                <div className="p-3.5 rounded-2xl bg-accent/5 border border-accent/20 flex items-center gap-3 text-xs text-accent">
                  <Clock size={16} className="flex-shrink-0" />
                  <span>
                    Auto-cleanup is active. Messages older than 12 hours are regularly wiped for both sides in real time.
                  </span>
                </div>
              )}
            </div>

            {/* Feature 2: One-Click Delete All Chat History (Both Sides) */}
            <div className="rounded-3xl bg-[#151820] border border-white/[0.08] p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0 mt-0.5">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      One-Click Delete All Chat History
                    </h4>
                    <p className="text-xs text-[#8890a6] mt-1 max-w-xl">
                      Instantly and permanently wipe all messages and conversations for <span className="text-white font-medium">both sides</span> (all chat participants).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:self-center">
                  <button
                    type="button"
                    onClick={handleDelete12hChats}
                    disabled={clearingChats}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 disabled:opacity-50"
                  >
                    <Clock size={14} />
                    <span>Purge &gt;12h History</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAllChats}
                    disabled={clearingChats}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
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

            {/* Feature 3: Delete Account */}
            <div className="rounded-3xl bg-[#151820] border border-white/[0.08] p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8890a6] flex-shrink-0 mt-0.5">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Delete this account</h4>
                    <p className="text-xs text-[#8890a6] mt-1">
                      Erase your profile, credentials, and all account association permanently.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAccountClick}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 self-start sm:self-center"
                >
                  <Trash2 size={14} />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
