"use client";

import React, { useState, useRef } from "react";
import { Send, Smile, Paperclip, Mic, X, Loader2 } from "lucide-react";
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react";
import { uploadToImgBB } from "../../lib/imgbb";

export const ChatInput = ({ onSend }) => {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!text.trim() && !selectedImage) return;

    let finalImageUrl = "";
    if (selectedImage) {
      setIsUploading(true);
      try {
        finalImageUrl = await uploadToImgBB(selectedImage);
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Failed to upload image. Please try again.");
        setIsUploading(false);
        return;
      }
    }

    onSend(text.trim(), finalImageUrl);
    setText("");
    setSelectedImage(null);
    setTempImageUrl("");
    setShowEmoji(false);
    setIsUploading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setTempImageUrl(URL.createObjectURL(file));
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setText((prev) => prev + emojiObject.emoji);
  };

  return (
    <div className="chat-input-area relative">
      {/* Photo Preview */}
      {tempImageUrl && (
        <div className="absolute bottom-full left-0 p-4 w-full bg-[#151820]/80 backdrop-blur-md border-t border-white/5 animate-fadeIn">
          <div className="relative inline-block">
            <img 
              src={tempImageUrl} 
              className="h-24 rounded-lg border border-white/10" 
              alt="Preview" 
            />
            <button 
              onClick={() => { setSelectedImage(null); setTempImageUrl(""); }}
              className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white shadow-lg"
            >
              <X size={12} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-full right-0 mb-4 z-50">
          <EmojiPicker 
            theme={Theme.DARK}
            emojiStyle={EmojiStyle.GOOGLE}
            onEmojiClick={onEmojiClick}
            lazyLoadEmojis={true}
          />
        </div>
      )}

      <div className="chat-input-row relative">
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          accept="image/*"
          onChange={handleFileChange}
        />
        <button 
          className="p-2.5 hover:bg-white/5 text-[#8890a6] hover:text-white rounded-full transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={22} />
        </button>

        <div className="chat-input-wrap !bg-[#1c2030]/80 !border-white/5 h-auto py-2">
          <textarea
            className="chat-textarea !text-white !placeholder-[#545d72]"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ minHeight: "24px", maxHeight: "120px" }}
          />
          <div className="chat-input-attachments ml-2">
            <button 
              className={`p-1.5 hover:bg-white/5 rounded-full transition-all ${showEmoji ? "text-accent" : "text-[#8890a6]"}`}
              onClick={() => setShowEmoji(!showEmoji)}
            >
              <Smile size={20} />
            </button>
            <button className="p-1.5 hover:bg-white/5 text-[#8890a6] rounded-full transition-all hidden sm:block">
              <Mic size={20} />
            </button>
          </div>
        </div>

        <button 
          className="btn-send !bg-gradient-to-tr !from-accent !to-[#a78bfa] !shadow-[0_0_15px_rgba(108,99,255,0.3)] hover:!opacity-90 disabled:!opacity-40 disabled:!cursor-not-allowed transition-all"
          onClick={handleSend}
          disabled={(!text.trim() && !selectedImage) || isUploading}
        >
          {isUploading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Send size={18} style={{ marginLeft: -2 }} />
          )}
        </button>
      </div>
    </div>
  );
};
