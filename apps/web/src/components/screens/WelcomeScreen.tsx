"use client";

import React, { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
  onContinueAsGuest: () => void;
  onOpenPrivacy: () => void;
  onOpenAuth?: (mode?: "login" | "register") => void;
}

export function WelcomeScreen({
  onContinueAsGuest,
  onOpenPrivacy,
  onOpenAuth,
}: WelcomeScreenProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleUnavailableSignIn = () => {
    setToastMessage(
      "Sign-in is not available yet. You can continue as a guest. Nothing is lost."
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#EBF5EE]">
      <div className="w-full max-w-[440px] bg-white rounded-3xl p-8 sm:p-10 text-center relative shadow-xl shadow-[#142D1E]/4 border border-[#D5E7DC] animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Sprout Icon in Circle matching 01-welcome.png */}
        <div className="mx-auto w-14 h-14 rounded-full bg-[#E2F4E7] flex items-center justify-center text-[#1C3E27] mb-4">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.5C12 2.5 10.5 6.5 8 8C5.5 9.5 4 13 4 16C4 18 5.5 19.5 7.5 19.5C10.5 19.5 11.5 16 12 13C12.5 16 13.5 19.5 16.5 19.5C18.5 19.5 20 18 20 16C20 13 18.5 9.5 16 8C13.5 6.5 12 2.5 12 2.5Z" />
            <path d="M12 12V21" stroke="#1C3E27" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="font-serif-title text-[36px] font-bold text-[#112316] tracking-tight leading-tight">
          StartEase
        </h1>
        <p className="text-[15px] text-[#4A6352] mt-1 mb-5 font-normal">
          Small steps. Less pressure.
        </p>

        {/* Reassurance Info Callout matching 01-welcome.png */}
        <div className="bg-[#EAF5EE] rounded-xl p-4 text-left flex items-start gap-3 mb-6 border border-[#DCECE0]">
          <div className="w-5 h-5 rounded-full border-[1.5px] border-[#2A4C36] flex items-center justify-center text-[#2A4C36] shrink-0 mt-0.5">
            <span className="text-[11px] font-bold">?</span>
          </div>
          <p className="text-[13px] text-[#284933] leading-relaxed">
            Designed for when starting feels impossible. We gently guide you through
            tasks one tiny, bite-sized micro-action at a time.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleUnavailableSignIn}
            className="w-full h-12 rounded-xl border border-[#DFEAE2] bg-white text-sm font-semibold text-[#112316] hover:bg-[#F9FCFA] transition-colors flex items-center justify-center gap-3 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Continue with email */}
          <button
            type="button"
            onClick={() => {
              if (onOpenAuth) {
                onOpenAuth("login");
              } else {
                handleUnavailableSignIn();
              }
            }}
            className="w-full h-12 rounded-xl bg-[#E2EFE6] text-sm font-semibold text-[#1B3F27] hover:bg-[#D5E7DC] transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-[#1B3F27]" />
            <span>Continue with email</span>
          </button>

          {/* Divider */}
          <div className="flex items-center my-3.5">
            <div className="flex-1 h-px bg-[#DCECE0]" />
            <span className="px-3 text-xs text-[#7F998A] font-medium">or</span>
            <div className="flex-1 h-px bg-[#DCECE0]" />
          </div>

          {/* Primary Guest Button */}
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="w-full h-12 rounded-xl bg-[#BCE8CB] hover:bg-[#A9DEBA] text-[#14351F] font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <span>Continue as Guest — no signup needed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Toast alert for unavailable sign-in */}
        {toastMessage && (
          <div className="mt-4 p-3 bg-[#EAF5EE] border border-[#2C553C]/20 rounded-xl text-xs text-[#142D1E] animate-in fade-in">
            {toastMessage}
          </div>
        )}

        {/* Privacy Link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-xs text-[#6F8A79] hover:text-[#1B3F27] underline underline-offset-2 transition-colors cursor-pointer"
          >
            How your data is used
          </button>
        </div>
      </div>
    </div>
  );
}
