"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Check } from "lucide-react";
import { storage } from "@/lib/storage";
import { UserPreferences } from "@/lib/types";

interface PreferencesScreenProps {
  userId?: string;
  onPreferencesChange: (prefs: UserPreferences) => void;
}

export function PreferencesScreen({ userId, onPreferencesChange }: PreferencesScreenProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(() => storage.getPreferences(userId));
  const [isElectron, setIsElectron] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsElectron(!!(window as any).electronApi);
    }
  }, []);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    storage.savePreferences(updated, userId);
    onPreferencesChange(updated);

    // Apply immediate system-level changes
    if (typeof document !== "undefined") {
      const root = document.documentElement;

      if (key === "textSize") {
        root.classList.remove("text-size-normal", "text-size-large", "text-size-xlarge");
        root.classList.add(`text-size-${value}`);
        root.style.fontSize = value === "xlarge" ? "20px" : value === "large" ? "18px" : "16px";
      }

      if (key === "calmMotion") {
        if (value) {
          root.classList.add("calm-motion");
        } else {
          root.classList.remove("calm-motion");
        }
      }

      if (key === "dyslexiaFriendly") {
        if (value) {
          root.classList.add("dyslexia-friendly");
        } else {
          root.classList.remove("dyslexia-friendly");
        }
      }
    }

    // Direct Electron window opacity control
    if (key === "windowOpacity" && typeof window !== "undefined") {
      if ((window as any).electronApi?.setOpacity) {
        (window as any).electronApi.setOpacity(Number(value) / 100);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      <div className="startease-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-[#D3E4D8]/50 pb-4">
          <div className="w-9 h-9 rounded-full bg-[#E1F0E6] flex items-center justify-center text-[#2D5A3D]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif-title text-2xl font-bold text-[#1A3323]">
              Make StartEase comfortable
            </h1>
            <p className="text-xs text-[#718779]">
              These settings stay on this device only.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Text Size */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#1A3323] uppercase tracking-wider block">
              Text size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["normal", "large", "xlarge"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updatePreference("textSize", size)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium capitalize flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    prefs.textSize === size
                      ? "bg-[#2D5A3D] text-white"
                      : "bg-[#EFF7F1] text-[#4A5D50] hover:bg-[#E2EFE6]"
                  }`}
                >
                  {prefs.textSize === size && <Check className="w-3.5 h-3.5" />}
                  {size === "xlarge" ? "Extra Large" : size}
                </button>
              ))}
            </div>
          </div>

          {/* Calm Motion */}
          <div className="flex items-center justify-between py-2 border-t border-[#D3E4D8]/30">
            <div>
              <p className="text-sm font-semibold text-[#1A3323]">Calm motion</p>
              <p className="text-xs text-[#718779]">Reduce all interface transitions, animations, and pulses</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.calmMotion}
              onChange={(e) => updatePreference("calmMotion", e.target.checked)}
              className="w-5 h-5 accent-[#2D5A3D] rounded cursor-pointer"
            />
          </div>

          {/* Dyslexia-friendly reading */}
          <div className="flex items-center justify-between py-2 border-t border-[#D3E4D8]/30">
            <div>
              <p className="text-sm font-semibold text-[#1A3323]">Dyslexia-friendly reading</p>
              <p className="text-xs text-[#718779]">
                Uses specialized high-legibility typography, wider letter spacing, and open character shapes
              </p>
            </div>
            <input
              type="checkbox"
              checked={prefs.dyslexiaFriendly}
              onChange={(e) => updatePreference("dyslexiaFriendly", e.target.checked)}
              className="w-5 h-5 accent-[#2D5A3D] rounded cursor-pointer"
            />
          </div>

          {/* Read steps aloud */}
          <div className="flex items-center justify-between py-2 border-t border-[#D3E4D8]/30">
            <div>
              <p className="text-sm font-semibold text-[#1A3323]">Read steps aloud</p>
              <p className="text-xs text-[#718779]">Automatically speak the first tiny step when it appears</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.readAloud}
              onChange={(e) => updatePreference("readAloud", e.target.checked)}
              className="w-5 h-5 accent-[#2D5A3D] rounded cursor-pointer"
            />
          </div>

          {/* Show keyboard shortcuts */}
          <div className="flex items-center justify-between py-2 border-t border-[#D3E4D8]/30">
            <div>
              <p className="text-sm font-semibold text-[#1A3323]">Show keyboard shortcuts</p>
              <p className="text-xs text-[#718779]">Display 1, 2, Space guidance on step screens</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.showShortcuts}
              onChange={(e) => updatePreference("showShortcuts", e.target.checked)}
              className="w-5 h-5 accent-[#2D5A3D] rounded cursor-pointer"
            />
          </div>

          {/* Window Opacity (Desktop Floating Window) */}
          <div className="space-y-2 py-2 border-t border-[#D3E4D8]/30">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#1A3323]">
                Window opacity (desktop floating window){" "}
                <span className="font-normal text-[#5A7764]">
                  {isElectron ? "• Connected" : "• Active in desktop app"}
                </span>
              </span>
              <span className="font-mono text-[#2D5A3D] font-bold">{prefs.windowOpacity}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={prefs.windowOpacity}
              onChange={(e) => updatePreference("windowOpacity", Number(e.target.value))}
              className="w-full accent-[#2D5A3D] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
