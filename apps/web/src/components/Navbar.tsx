"use client";

import React, { useState } from "react";
import { User, Shield, Trash2, LogIn, LogOut } from "lucide-react";
import { UserProfile } from "@/lib/types";

interface NavbarProps {
  activeTab: "focus" | "decompose" | "log" | "preferences";
  onTabChange: (tab: "focus" | "decompose" | "log" | "preferences") => void;
  onOpenPrivacy: () => void;
  onClearSession: () => void;
  hasActiveTask: boolean;
  user?: UserProfile | null;
  onOpenAuth?: (mode?: "login" | "register") => void;
  onLogout?: () => void;
}

export function Navbar({
  activeTab,
  onTabChange,
  onOpenPrivacy,
  onClearSession,
  hasActiveTask,
  user,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-[#EBF5EE] px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Brand title */}
      <div className="flex items-center">
        <button
          onClick={() => onTabChange("decompose")}
          className="flex items-center text-left focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/30 rounded-lg p-0.5 cursor-pointer"
        >
          <span className="font-serif-title text-[22px] font-bold text-[#112316] tracking-tight">
            StartEase
          </span>
        </button>
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
            Logs
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
            className="w-8 h-8 rounded-full bg-[#183B20] text-white flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/40 cursor-pointer text-xs font-semibold"
          >
            {user ? (
              <span>{(user.name || user.email)[0].toUpperCase()}</span>
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white shadow-xl border border-[#D3E4D8]/60 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-[#D3E4D8]/30">
                  <p className="text-xs font-medium text-[#718779]">Signed in as</p>
                  <p className="text-sm font-semibold text-[#1A3323] truncate">
                    {user ? user.name || user.email : "Guest"}
                  </p>
                  {user && user.name && (
                    <p className="text-xs text-[#718779] truncate">{user.email}</p>
                  )}
                </div>

                {!user && onOpenAuth && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAuth("login");
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#1B3F27] bg-[#EAF5EE] hover:bg-[#DFEFE4] flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-[#1B3F27]" />
                    Sign In / Create Account
                  </button>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (typeof window !== "undefined" && (window as any).electronApi) {
                      (window as any).electronApi.switchToFloat();
                    } else {
                      window.open("/float", "StartEaseFloat", "width=360,height=300,menubar=no,toolbar=no");
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#4A5D50] hover:bg-[#EFF7F1] flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-[#2D5A3D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="14" x="3" y="3" rx="2" />
                    <rect width="8" height="6" x="11" y="9" rx="1" />
                  </svg>
                  Floating companion mode
                </button>

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

                {user && onLogout && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#4A5D50] hover:bg-[#EFF7F1] flex items-center gap-2 cursor-pointer border-t border-[#D3E4D8]/30"
                  >
                    <LogOut className="w-4 h-4 text-[#4A5D50]" />
                    Sign out
                  </button>
                )}

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
