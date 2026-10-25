"use client";

import React, { useState, useEffect, useRef } from "react";
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
  GripHorizontal,
} from "lucide-react";
import { api } from "@/lib/api";
import { storage } from "@/lib/storage";
import { SessionData } from "@/lib/types";

export default function FloatPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [transition, setTransition] = useState<{ title: string; subtitle: string } | null>(null);
  const [isStagnant, setIsStagnant] = useState(false);
  const lastActiveTimeRef = useRef(Date.now());

  useEffect(() => {
    // Load active session from storage and keep in sync
    const syncSession = () => {
      const saved = storage.getSession();
      if (saved) {
        setSession(saved);
      }
    };

    syncSession();

    window.addEventListener("storage", syncSession);
    window.addEventListener("focus", syncSession);

    if (typeof window !== "undefined" && (window as any).electronApi?.onSyncSession) {
      (window as any).electronApi.onSyncSession(syncSession);
    }

    // Dismiss first-time hint after 8 seconds
    const timer = setTimeout(() => setShowHint(false), 8000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("focus", syncSession);
    };
  }, []);

  // Stagnation Detection: 3 minutes (180,000 ms) of idle on the active step
  useEffect(() => {
    lastActiveTimeRef.current = Date.now();
    setIsStagnant(false);
  }, [session?.step, session?.status]);

  useEffect(() => {
    if (!session || session.status !== "step") {
      setIsStagnant(false);
      return;
    }

    const checkStagnation = async () => {
      if (isStagnant || isLoading || transition) return;

      // 1. Check OS-wide system idle time if running in Electron
      if (typeof window !== "undefined" && (window as any).electronApi?.getSystemIdleTime) {
        try {
          const idleSec = await (window as any).electronApi.getSystemIdleTime();
          if (idleSec >= 180) {
            setIsStagnant(true);
            return;
          }
        } catch {}
      }

      // 2. Check in-app local inactivity (3 minutes = 180,000 ms)
      const idleMs = Date.now() - lastActiveTimeRef.current;
      if (idleMs >= 180000) {
        setIsStagnant(true);
      }
    };

    const interval = setInterval(checkStagnation, 5000);
    return () => clearInterval(interval);
  }, [session, isStagnant, isLoading, transition]);

  // Track user input/pointer on the window to reset in-app idle timer
  useEffect(() => {
    const handleActivity = () => {
      lastActiveTimeRef.current = Date.now();
    };

    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("pointermove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    return () => {
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("pointermove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, []);

  const updateSession = (updated: Partial<SessionData>) => {
    if (!session) return;
    const next = { ...session, ...updated, lastUpdated: Date.now() };
    setSession(next);
    storage.saveSession(next);
  };

  // Window drag handler for Electron frameless transparent window
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only drag with left mouse button

    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest(".no-drag")
    ) {
      return;
    }

    if (typeof window === "undefined" || !(window as any).electronApi?.startDrag) {
      return;
    }

    e.preventDefault();
    const elem = e.currentTarget;
    try {
      elem.setPointerCapture(e.pointerId);
    } catch (err) {}

    (window as any).electronApi.startDrag();

    let animationFrameId: number | null = null;

    const onPointerMove = () => {
      if (animationFrameId !== null) return;
      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        if ((window as any).electronApi?.dragging) {
          (window as any).electronApi.dragging();
        }
      });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      try {
        elem.releasePointerCapture(upEvent.pointerId);
      } catch (err) {}

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if ((window as any).electronApi?.endDrag) {
        (window as any).electronApi.endDrag();
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const handleDone = async () => {
    if (!session || isLoading) return;
    setIsLoading(true);
    setTransition({
      title: "Moving forward...",
      subtitle: "Getting your next gentle step ready.",
    });
    try {
      const res = await api.respond(session.session_id, "done");
      updateSession({ ...res, variant: "normal" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setTransition(null);
    }
  };

  const handleConfused = async () => {
    if (!session || isLoading) return;
    setIsLoading(true);
    setTransition({
      title: "Finding simpler words...",
      subtitle: "Putting this in clearer language for you.",
    });
    try {
      const res = await api.respond(session.session_id, "confused");
      updateSession({ ...res, variant: "simpler" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setTransition(null);
    }
  };

  const handleTooBig = async () => {
    if (!session || isLoading) return;
    setIsLoading(true);
    setTransition({
      title: "Making this step smaller...",
      subtitle: "Breaking it into tinier, gentler actions.",
    });
    try {
      const res = await api.respond(session.session_id, "too_big");
      updateSession({ ...res, variant: "smaller" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setTransition(null);
    }
  };

  const handleNotNow = async () => {
    if (!session || isLoading) return;
    try {
      const res = await api.respond(session.session_id, "not_now");
      updateSession({ ...res, status: "rest" });
    } catch (e) {
      updateSession({ status: "rest" });
    }
  };

  const handleResume = async (mode: "same" | "smaller") => {
    if (!session || isLoading) return;
    setIsLoading(true);
    setTransition({
      title: mode === "smaller" ? "Making this step smaller..." : "Resuming step...",
      subtitle: mode === "smaller" ? "Breaking it into tinier, gentler actions." : "Picking up right where you left off.",
    });
    try {
      const res = await api.resume(session.session_id, mode);
      updateSession({ ...res, status: "step", variant: mode === "smaller" ? "smaller" : "normal" });
    } catch (e) {
      updateSession({ status: "step" });
    } finally {
      setIsLoading(false);
      setTransition(null);
    }
  };

  // Keyboard shortcuts (1: Done, 2: Confused, 3: Too big, Space: Not now)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading || transition || !session || session.status !== "step") return;
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (isStagnant) {
        if (e.key === "1" || e.key === "Enter") {
          e.preventDefault();
          setIsStagnant(false);
          lastActiveTimeRef.current = Date.now();
        } else if (e.key === " " || e.code === "Space" || e.key === "2") {
          e.preventDefault();
          setIsStagnant(false);
          handleNotNow();
        }
        return;
      }

      if (e.key === "1") {
        e.preventDefault();
        handleDone();
      } else if (e.key === "2") {
        e.preventDefault();
        handleConfused();
      } else if (e.key === "3") {
        e.preventDefault();
        handleTooBig();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handleNotNow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session, isLoading, transition, isStagnant]);

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
    <div className="min-h-screen bg-transparent p-2 flex items-center justify-center">
      <div className="floating-window w-[340px] border border-[#D3E4D8] bg-white shadow-2xl flex flex-col justify-between">
        {/* Compact Draggable Titlebar */}
        <div
          onPointerDown={handleDragStart}
          className="bg-[#EFF7F1] px-3.5 py-2 border-b border-[#D3E4D8]/60 flex items-center justify-between select-none cursor-move active:cursor-grabbing touch-none"
        >
          <div className="flex items-center gap-1.5 pointer-events-none">
            <Sprout className="w-3.5 h-3.5 text-[#2D5A3D]" />
            <span className="font-serif-title text-xs font-bold text-[#1A3323]">StartEase</span>
          </div>

          <div className="flex items-center gap-1 text-[#8EA696] pointer-events-none">
            <GripHorizontal className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-1 no-drag">
            <button
              onClick={() => {
                if (typeof window !== "undefined" && (window as any).electronApi) {
                  (window as any).electronApi.switchToFull();
                } else if (window.opener) {
                  window.close();
                }
              }}
              title="Expand to full window"
              className="p-1 rounded text-[#718779] hover:bg-[#DDEEE2] transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              title="Collapse to pill"
              className="p-1 rounded text-[#718779] hover:bg-[#DDEEE2] transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Draggable Hint Banner */}
        {showHint && (
          <div
            onPointerDown={handleDragStart}
            className="bg-[#E1F0E6] px-3 py-1 text-[11px] text-[#2D5A3D] flex items-center justify-between select-none cursor-move active:cursor-grabbing touch-none"
          >
            <span>Drag me anywhere. Tap bar to tuck away.</span>
            <button onClick={() => setShowHint(false)} className="cursor-pointer p-0.5 no-drag">
              <X className="w-3 h-3 text-[#2D5A3D]" />
            </button>
          </div>
        )}

        {/* Body content based on state */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3 min-h-[190px]">
          {transition ? (
            <div className="py-7 px-2 text-center space-y-3 flex flex-col items-center justify-center flex-1 animate-in fade-in duration-200">
              <div className="w-10 h-10 rounded-full bg-[#E1F0E6] flex items-center justify-center text-[#2D5A3D] mx-auto animate-pulse">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-serif-title text-sm font-bold text-[#1A3323]">
                  {transition.title}
                </p>
                <p className="text-[11px] text-[#5A7764] leading-relaxed">
                  {transition.subtitle}
                </p>
              </div>
            </div>
          ) : !session || !session.step ? (
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

              {/* Actions or Ambient Stagnation Check-in */}
              {isStagnant ? (
                <div className="bg-[#EFF7F1] border border-[#C5DDCB] rounded-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-1.5 text-[#2D5A3D]">
                    <Sprout className="w-4 h-4 shrink-0 text-[#2D5A3D]" />
                    <p className="font-serif-title text-xs font-bold text-[#1A3323]">
                      Still on this step, or take a rest?
                    </p>
                  </div>
                  <p className="text-[11px] text-[#5A7764] leading-relaxed">
                    No rush at all. You can keep going or step away with zero guilt.
                  </p>
                  <div className="flex gap-2 pt-0.5">
                    <button
                      onClick={() => {
                        setIsStagnant(false);
                        lastActiveTimeRef.current = Date.now();
                      }}
                      className="flex-1 py-2 px-2.5 rounded-lg btn-primary-dark text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Still on it</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsStagnant(false);
                        handleNotNow();
                      }}
                      className="flex-1 py-2 px-2.5 rounded-lg btn-sage-medium text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Pause className="w-3 h-3 text-[#2D5A3D]" />
                      <span>Take a rest</span>
                    </button>
                  </div>
                </div>
              ) : (
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
