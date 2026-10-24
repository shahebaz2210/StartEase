"use client";

import React, { useState } from "react";
import { Sprout, User, Shield, Trash2, X } from "lucide-react";

interface NavbarProps {
  activeTab: "focus" | "decompose" | "log" | "preferences";
  onTabChange: (tab: "focus" | "decompose" | "log" | "preferences") => void;
  onOpenPrivacy: () => void;
  onClearSession: () => void;
  hasActiveTask: boolean;
}

export function Navbar({
  activeTab,
  onTabChange,
  onOpenPrivacy,
  onClearSession,
  hasActiveTask,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-[#EBF5EE] px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onTabChange("decompose")}
          className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/30 rounded-lg p-0.5 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-[#E2EFE7] flex items-center justify-center text-[#1C3E27]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.5C12 2.5 10.5 6.5 8 8C5.5 9.5 4 13 4 16C4 18 5.5 19.5 7.5 19.5C10.5 19.5 11.5 16 12 13C12.5 16 13.5 19.5 16.5 19.5C18.5 19.5 20 18 20 16C20 13 18.5 9.5 16 8C13.5 6.5 12 2.5 12 2.5Z" />
              <path d="M12 12V21" stroke="#1C3E27" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-serif-title text-[22px] font-bold text-[#112316] tracking-tight">
            StartEase
          </span>
        </button>
        <span className="hidden sm:inline-flex rounded-full px-3 py-1 bg-[#DEEDE2] text-[#34533E] text-xs font-normal">
          Calm task initiation
        </span>
      </div>

      {/* Center pill badge matching 02-task-entry.png */}
      <div className="hidden md:flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-[#DEEDE2] text-[#274B33] text-xs font-normal">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.5C12 2.5 10.5 6.5 8 8C5.5 9.5 4 13 4 16C4 18 5.5 19.5 7.5 19.5C10.5 19.5 11.5 16 12 13C12.5 16 13.5 19.5 16.5 19.5C18.5 19.5 20 18 20 16C20 13 18.5 9.5 16 8C13.5 6.5 12 2.5 12 2.5Z" />
          <path d="M12 12V21" stroke="#274B33" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>One tiny step at a time</span>
      </div>

      {/* Navigation tabs & Avatar menu */}
      <div className="flex items-center gap-1 sm:gap-2">
        <nav className="flex items-center gap-1 text-sm">
          <button
            onClick={() => onTabChange("focus")}
            className={`px-4 py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === "focus"
                ? "bg-[#DBECE0] text-[#15301E] font-semibold"
                : "text-[#435F4D] hover:text-[#15301E] font-normal"
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => onTabChange("decompose")}
            className={`px-4 py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === "decompose"
                ? "bg-[#DBECE0] text-[#15301E] font-semibold"
                : "text-[#435F4D] hover:text-[#15301E] font-normal"
            }`}
          >
            Decompose
          </button>
          <button
            onClick={() => onTabChange("log")}
            className={`px-4 py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === "log"
                ? "bg-[#DBECE0] text-[#15301E] font-semibold"
                : "text-[#435F4D] hover:text-[#15301E] font-normal"
            }`}
          >
            Gentle Log
          </button>
          <button
            onClick={() => onTabChange("preferences")}
            className={`px-4 py-1.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === "preferences"
                ? "bg-[#DBECE0] text-[#15301E] font-semibold"
                : "text-[#435F4D] hover:text-[#15301E] font-normal"
            }`}
          >
            Preferences
          </button>
        </nav>

        <div className="h-4 w-px bg-[#CDE0D3] mx-2" />

        {/* Avatar Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Profile menu"
            className="w-8 h-8 rounded-full bg-[#183B20] text-white flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/40 cursor-pointer"
          >
            <User className="w-4 h-4 text-white" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-[#D3E4D8]/60 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-[#D3E4D8]/30">
                  <p className="text-xs font-medium text-[#718779]">Signed in as</p>
                  <p className="text-sm font-semibold text-[#1A3323]">Guest</p>
                </div>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenPrivacy();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#4A5D50] hover:bg-[#EFF7F1] flex items-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-[#2D5A3D]" />
                  How your data is used
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onClearSession();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-2 border-t border-[#D3E4D8]/30 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear my session
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
