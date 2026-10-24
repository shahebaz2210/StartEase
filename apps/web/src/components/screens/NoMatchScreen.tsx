"use client";

import React from "react";
import { HelpCircle, RefreshCw } from "lucide-react";

interface NoMatchScreenProps {
  onTryAgain: () => void;
}

export function NoMatchScreen({ onTryAgain }: NoMatchScreenProps) {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg startease-card p-8 md:p-10 text-center space-y-6 animate-in fade-in duration-200">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#E1F0E6] flex items-center justify-center text-[#2D5A3D]">
          <HelpCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif-title text-2xl font-bold text-[#1A3323]">
            Let&apos;s try rephrasing your task
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5D50] leading-relaxed">
            I can&apos;t find a good match for that yet. StartEase works best for study and work tasks like writing a document, creating a slide deck, making a spreadsheet, or designing a poster.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onTryAgain}
            className="w-full py-3.5 px-5 rounded-xl btn-primary-dark font-medium text-sm flex items-center justify-center gap-2 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
