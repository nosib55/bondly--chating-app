"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, MessageSquare, Camera, Plus } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { uploadToImgBB } from "../../../lib/imgbb";

// Using native style inline buttons since the auth styles are mostly in globals.css
export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let photoURL = "";
      
      // 1. Upload to ImgBB if a file is selected
      if (profileImage) {
        photoURL = await uploadToImgBB(profileImage);
      }

      // 2. Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 3. Set their display name & photo
      await updateProfile(userCredential.user, {
        displayName: name,
        photoURL: photoURL
      });

      // 4. Sync with MongoDB
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: userCredential.user.uid,
          name,
          email,
          avatar: photoURL
        }),
      });

      // 5. Navigate directly to dashboard on success
      router.push("/c1");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page px-4">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <MessageSquare color="#fff" />
          </div>
          <h1>Create an account</h1>
          <p>Join Bondly and start chatting instantly</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg text-center mb-6">{error}</div>}

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="flex justify-center mb-6">
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 rounded-full bg-elevated border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all group-hover:border-accent">
                {profileImage ? (
                  <img src={URL.createObjectURL(profileImage)} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="text-text-muted group-hover:text-accent transition-colors" />
                )}
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
              />
              <div className="absolute bottom-0 right-0 bg-accent p-1.5 rounded-full shadow-lg border-2 border-bg-surface group-hover:scale-110 transition-transform">
                <Plus size={12} color="#fff" strokeWidth={3} />
              </div>
            </label>
          </div>

          <div className="field-group">
            <label className="field-label">Full Name</label>
            <div className="input-wrap">
              <span className="input-icon"><User size={16} /></span>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Jane Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Email Address</label>
            <div className="input-wrap">
              <span className="input-icon"><Mail size={16} /></span>
              <input 
                type="email" 
                className="input-field" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <div className="input-wrap">
              <span className="input-icon"><Lock size={16} /></span>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
