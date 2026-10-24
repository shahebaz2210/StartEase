"use client";

import React, { useState } from "react";
import { X, RefreshCw } from "lucide-react";

interface CantUseAppModalProps {
  currentApp: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CantUseAppModal({
  currentApp,
  isOpen,
  onClose,
  onConfirm,
}: CantUseAppModalProps) {
  const [reason, setReason] = useState<"no_access" | "simpler">("no_access");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-[#D3E4D8] space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-title text-xl font-bold text-[#1A3323]">
            No problem.
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#718779] hover:bg-[#EFF7F1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#4A5D50] leading-relaxed">
          If <strong className="text-[#1A3323]">{currentApp}</strong> isn&apos;t right for you today, we can switch to another app or a plain blank document.
        </p>

        <div className="space-y-2">
          <label
            onClick={() => setReason("no_access")}
            className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
              reason === "no_access"
                ? "bg-[#DDEEE2] border-[#2D5A3D]/40 text-[#1A3323]"
                : "bg-[#EFF7F1] border-[#D3E4D8]/60 text-[#4A5D50]"
            }`}
          >
            <input
              type="radio"
              name="reason"
              checked={reason === "no_access"}
              onChange={() => setReason("no_access")}
              className="accent-[#2D5A3D]"
            />
            <span className="text-xs font-medium">I don&apos;t have access to {currentApp}</span>
          </label>

          <label
            onClick={() => setReason("simpler")}
            className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
              reason === "simpler"
                ? "bg-[#DDEEE2] border-[#2D5A3D]/40 text-[#1A3323]"
                : "bg-[#EFF7F1] border-[#D3E4D8]/60 text-[#4A5D50]"
            }`}
          >
            <input
              type="radio"
              name="reason"
              checked={reason === "simpler"}
              onChange={() => setReason("simpler")}
              className="accent-[#2D5A3D]"
            />
            <span className="text-xs font-medium">I&apos;d rather use something simpler</span>
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#D3E4D8] text-xs font-medium text-[#4A5D50] hover:bg-[#EFF7F1]"
          >
            Keep current app
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl btn-primary-dark text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Switch app</span>
          </button>
        </div>
      </div>
    </div>
  );
}
