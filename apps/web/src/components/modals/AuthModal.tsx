"use client";

import React, { useState } from "react";
import { X, Mail, Lock, User, ArrowRight, Check, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { UserProfile } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  initialMode?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please provide both email and password.");
      return;
    }

    if (mode === "register" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const res = await api.register(email.trim(), password, name.trim() || undefined);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await api.login(email.trim(), password);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Could not connect to the service. Please make sure the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142D1E]/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#D5E7DC] relative animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#EFF7F1] text-[#4A5D50] hover:text-[#142D1E] hover:bg-[#E2EFE6] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#E2F4E7] flex items-center justify-center text-[#1C3E27] mb-3">
            <User className="w-6 h-6" />
          </div>
          <h2 className="font-serif-title text-2xl font-bold text-[#112316]">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-xs text-[#526B5A] mt-1">
            {mode === "login"
              ? "Sign in to keep your task history synced across devices."
              : "Get started with your private, zero-pressure account."}
          </p>
        </div>

        {/* Tabs: Sign In / Create Account */}
        <div className="flex bg-[#EAF3EC] p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white text-[#14351F] shadow-2xs"
                : "text-[#5B7363] hover:text-[#14351F]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "register"
                ? "bg-white text-[#14351F] shadow-2xs"
                : "text-[#5B7363] hover:text-[#14351F]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#F87171]/40 rounded-xl flex items-start gap-2.5 text-xs text-[#991B1B] animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-xs font-medium text-[#2E4736] block mb-1.5">
                Your Name <span className="text-[#8DA394] font-normal">(optional)</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7A9383] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#D1E3D6] bg-[#FBFDFB] text-sm text-[#112316] placeholder-[#8DA394] focus:outline-none focus:ring-2 focus:ring-[#2C553C]/30 focus:border-[#2C553C]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#2E4736] block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7A9383] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#D1E3D6] bg-[#FBFDFB] text-sm text-[#112316] placeholder-[#8DA394] focus:outline-none focus:ring-2 focus:ring-[#2C553C]/30 focus:border-[#2C553C]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#2E4736] block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7A9383] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#D1E3D6] bg-[#FBFDFB] text-sm text-[#112316] placeholder-[#8DA394] focus:outline-none focus:ring-2 focus:ring-[#2C553C]/30 focus:border-[#2C553C]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-xl bg-[#1C3E27] hover:bg-[#15301E] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Continue as Guest option */}
        <div className="mt-5 pt-4 border-t border-[#DCECE0] text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#526B5A] hover:text-[#14351F] transition-colors cursor-pointer"
          >
            Continue as guest without signing in
          </button>
        </div>
      </div>
    </div>
  );
}
