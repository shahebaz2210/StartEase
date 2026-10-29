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
    <header className="sticky top-0 z-30 w-full bg-[#EBF5EE]/90 backdrop-blur-md border-b border-[#D8E8DC]/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand title */}
        <div className="flex items-center min-w-[120px] sm:min-w-[140px]">
          <button
            onClick={() => onTabChange("decompose")}
            className="group flex items-center text-left focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/30 rounded-lg py-1 px-1.5 -ml-1.5 cursor-pointer transition-colors"
          >
            <span className="font-serif-title text-[24px] font-bold text-[#112316] tracking-tight group-hover:text-[#234530] transition-colors">
              StartEase
            </span>
          </button>
        </div>

        {/* Center: Navigation tabs (Segmented pill bar) */}
        <nav className="flex items-center bg-[#DEEDE2]/80 p-1 rounded-full border border-[#D0E2D5]/70 shadow-xs">
          <button
            onClick={() => onTabChange("focus")}
            className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === "focus"
                ? "bg-white text-[#15301E] font-semibold shadow-xs"
                : "text-[#435F4D] hover:text-[#15301E] hover:bg-white/40"
            }`}
          >
            <span className="flex items-center gap-1.5">
              Focus
              {hasActiveTask && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#2C553C] animate-pulse" />
              )}
            </span>
          </button>
          <button
            onClick={() => onTabChange("decompose")}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === "decompose"
                ? "bg-white text-[#15301E] font-semibold shadow-xs"
                : "text-[#435F4D] hover:text-[#15301E] hover:bg-white/40"
            }`}
          >
            Decompose
          </button>
          <button
            onClick={() => onTabChange("log")}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === "log"
                ? "bg-white text-[#15301E] font-semibold shadow-xs"
                : "text-[#435F4D] hover:text-[#15301E] hover:bg-white/40"
            }`}
          >
            Logs
          </button>
          <button
            onClick={() => onTabChange("preferences")}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === "preferences"
                ? "bg-white text-[#15301E] font-semibold shadow-xs"
                : "text-[#435F4D] hover:text-[#15301E] hover:bg-white/40"
            }`}
          >
            Preferences
          </button>
        </nav>

        {/* Right: Actions & Profile */}
        <div className="flex items-center justify-end min-w-[120px] sm:min-w-[140px] gap-2">
          {/* Quick float companion shortcut */}
          <button
            onClick={() => {
              if (typeof window !== "undefined" && (window as any).electronApi) {
                (window as any).electronApi.switchToFloat();
              } else {
                window.open("/float", "StartEaseFloat", "width=360,height=300,menubar=no,toolbar=no");
              }
            }}
            title="Open floating companion"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#385341] hover:text-[#15301E] hover:bg-[#DEEDE2]/70 transition-all cursor-pointer border border-transparent hover:border-[#D0E2D5]/70"
          >
            <svg className="w-3.5 h-3.5 text-[#2C553C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="14" x="3" y="3" rx="2" />
              <rect width="8" height="6" x="11" y="9" rx="1" />
            </svg>
            <span>Float</span>
          </button>

          {/* Avatar Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Profile menu"
              className="w-8 h-8 rounded-full bg-[#183B20] text-white flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/40 ring-2 ring-white/70 shadow-xs cursor-pointer text-xs font-semibold transition-all"
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
    </div>
  </header>
  );
}
