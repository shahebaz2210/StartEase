"use client";

import React, { useState, useEffect } from "react";
import {
  Sprout,
  CheckCircle2,
  MessageSquare,
  Minimize2,
  Pause,
  Maximize2,
  X,
  Play,
  RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";
import { storage } from "@/lib/storage";
import { SessionData } from "@/lib/types";

export default function FloatPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load active session from storage
    const saved = storage.getSession();
    if (saved) {
      setSession(saved);
    }

    // Dismiss first-time hint after 8 seconds
    const timer = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const updateSession = (updated: Partial<SessionData>) => {
    if (!session) return;
    const next = { ...session, ...updated, lastUpdated: Date.now() };
    setSession(next);
    storage.saveSession(next);
  };

  const handleDone = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const res = await api.respond(session.session_id, "done");
      updateSession({ ...res, variant: "normal" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfused = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const res = await api.respond(session.session_id, "confused");
      updateSession({ ...res, variant: "simpler" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTooBig = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const res = await api.respond(session.session_id, "too_big");
      updateSession({ ...res, variant: "smaller" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotNow = async () => {
    if (!session) return;
    try {
      const res = await api.respond(session.session_id, "not_now");
      updateSession({ ...res, status: "rest" });
    } catch (e) {
      updateSession({ status: "rest" });
    }
  };

  const handleResume = async (mode: "same" | "smaller") => {
    if (!session) return;
    setIsLoading(true);
    try {
      const res = await api.resume(session.session_id, mode);
      updateSession({ ...res, status: "step", variant: mode === "smaller" ? "smaller" : "normal" });
    } catch (e) {
      updateSession({ status: "step" });
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Collapsed Pill View
  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 bg-[#2D5A3D] text-white px-3.5 py-2 rounded-full shadow-xl hover:bg-[#244931] transition-all focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]"
        >
          <Sprout className="w-4 h-4" />
          <span className="text-xs font-semibold tracking-wide">StartEase</span>
        </button>
      </div>
    );
  }

  // 2. Expanded Floating Window View
  return (
    <div className="min-h-screen bg-transparent p-3 flex items-center justify-center">
      <div className="floating-window w-[340px] border border-[#D3E4D8] bg-white shadow-2xl flex flex-col justify-between">
        {/* Compact Titlebar */}
        <div className="bg-[#EFF7F1] px-3.5 py-2 border-b border-[#D3E4D8]/60 flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-[#2D5A3D]" />
            <span className="font-serif-title text-xs font-bold text-[#1A3323]">StartEase</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(true)}
              title="Collapse to pill"
              className="p-1 rounded text-[#718779] hover:bg-[#DDEEE2] transition-colors"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* First time drag hint */}
        {showHint && (
          <div className="bg-[#E1F0E6] px-3 py-1 text-[11px] text-[#2D5A3D] flex items-center justify-between">
            <span>Drag me anywhere. Tap bar to tuck away.</span>
            <button onClick={() => setShowHint(false)}>
              <X className="w-3 h-3 text-[#2D5A3D]" />
            </button>
          </div>
        )}

        {/* Body content based on state */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          {!session || !session.step ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs font-medium text-[#1A3323]">Nothing in progress.</p>
              <p className="text-[11px] text-[#718779]">
                Start a task in the main window to follow along here.
              </p>
            </div>
          ) : session.status === "completed" ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#2D5A3D] mx-auto" />
              <p className="text-xs font-semibold text-[#1A3323]">
                You finished this task. Well done.
              </p>
            </div>
          ) : session.status === "rest" ? (
            <div className="space-y-3 text-center py-2">
              <p className="text-xs text-[#4A5D50]">
                Rest is a good choice. Progress saved.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResume("same")}
                  className="flex-1 py-2 px-3 rounded-lg btn-primary-dark text-xs font-medium flex items-center justify-center gap-1"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={() => handleResume("smaller")}
                  className="flex-1 py-2 px-3 rounded-lg btn-sage-medium text-xs font-medium"
                >
                  Smaller
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step State */}
              <div className="space-y-1.5">
                {session.app && (
                  <span className="text-[10px] uppercase font-bold text-[#2D5A3D] tracking-wider block">
                    Use {typeof session.app === "object" ? (session.app as any)?.name : session.app}
                  </span>
                )}
                <h2 className="font-serif-title text-base font-bold text-[#1A3323] leading-snug">
                  {session.step}
                </h2>
                {session.explanation && (
                  <p className="text-xs text-[#2D5A3D] bg-[#EFF7F1] p-2 rounded-lg">
                    {session.explanation}
                  </p>
                )}
              </div>

              {/* 4 Compact Buttons */}
              <div className="space-y-1.5 pt-2">
                <button
                  onClick={handleDone}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 rounded-xl btn-primary-dark text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Done</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={handleConfused}
                    disabled={isLoading}
                    className="py-2 px-2.5 rounded-lg btn-sage-medium text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3 text-[#2D5A3D]" />
                    <span>Confused</span>
                  </button>

                  <button
                    onClick={handleTooBig}
                    disabled={isLoading}
                    className="py-2 px-2.5 rounded-lg btn-sage-medium text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Minimize2 className="w-3 h-3 text-[#2D5A3D]" />
                    <span>Too big</span>
                  </button>
                </div>

                <button
                  onClick={handleNotNow}
                  className="w-full py-1.5 text-[11px] text-[#718779] hover:text-[#1A3323] flex items-center justify-center gap-1"
                >
                  <Pause className="w-3 h-3" />
                  <span>Not now</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
