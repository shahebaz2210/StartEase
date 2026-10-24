"use client";

import React from "react";
import { X, Shield, Trash2 } from "lucide-react";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearSession: () => void;
}

export function PrivacyModal({
  isOpen,
  onClose,
  onClearSession,
}: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 md:p-8 shadow-2xl border border-[#D3E4D8] space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#D3E4D8]/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E1F0E6] flex items-center justify-center text-[#2D5A3D]">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="font-serif-title text-xl font-bold text-[#1A3323]">
              How your data is used
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#718779] hover:bg-[#EFF7F1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-[#385040] space-y-3 leading-relaxed">
          <div>
            <p className="font-semibold text-[#1A3323]">What I use:</p>
            <p>Only the task you type, and which button you press. Nothing else.</p>
          </div>

          <div>
            <p className="font-semibold text-[#1A3323]">What I never do:</p>
            <p>
              StartEase does not look at your screen, other apps, window titles or what you type elsewhere. It has no camera access.
            </p>
          </div>

          <div>
            <p className="font-semibold text-[#1A3323]">Where it goes:</p>
            <p>
              Your task is sent to our server and to Google&apos;s Gemini service to write your steps. Please do not include names or personal details.
            </p>
          </div>

          <div>
            <p className="font-semibold text-[#1A3323]">What is saved:</p>
            <p>
              Your current step is saved on your device so you can come back. A copy of your steps is kept on our server for 7 days so you can resume, then deleted.
            </p>
          </div>

          <div>
            <p className="font-semibold text-[#1A3323]">Stays on your device only:</p>
            <p>Your deadline, your list of past tasks, your settings and message drafts.</p>
          </div>

          <div>
            <p className="font-semibold text-[#1A3323]">If you use &ldquo;Speak instead&rdquo;:</p>
            <p>
              Your voice is handled by your browser&apos;s speech service. Only the transcribed text goes to StartEase.
            </p>
          </div>

          <div>
            <p className="font-semibold text-[#1A3323]">Your control:</p>
            <p>You can hide or stop at any time. &ldquo;Clear my session&rdquo; deletes your saved data.</p>
          </div>

          <div>
            <p className="font-semibold text-[#1A3323]">What StartEase is not:</p>
            <p>It is not a medical or diagnostic tool. It does not tell you how you feel.</p>
          </div>
        </div>

        <div className="pt-3 border-t border-[#D3E4D8]/50 flex flex-col sm:flex-row gap-2 justify-between">
          <button
            type="button"
            onClick={() => {
              onClearSession();
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-xs font-semibold text-[#DC2626] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear my session</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl btn-primary-dark text-xs font-semibold text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
