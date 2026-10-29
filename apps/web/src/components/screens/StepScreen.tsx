"use client";

import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  Volume2,
  VolumeX,
  FileText,
  CheckCircle2,
  MessageSquare,
  Minimize2,
  Pause,
  ExternalLink,
} from "lucide-react";
import { speakText, stopSpeaking, isSpeechSynthesisAvailable } from "@/lib/speech";
import { SessionData, StepVariant } from "@/lib/types";

interface StepScreenProps {
  session: SessionData;
  onDone: () => void;
  onSimplerStep?: () => void;
  onConfused?: () => void;
  onTooBig?: () => void;
  onNotNow: () => void;
  onCantUseApp: () => void;
  showShortcuts?: boolean;
  autoReadAloud?: boolean;
}

export function StepScreen({
  session,
  onDone,
  onSimplerStep,
  onConfused,
  onTooBig,
  onNotNow,
  onCantUseApp,
  showShortcuts = true,
  autoReadAloud = false,
}: StepScreenProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeAction, setActiveAction] = useState<"done" | "simpler" | "rest" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto read-aloud when step loads if enabled in preferences
  useEffect(() => {
    if (autoReadAloud && session.step && isSpeechSynthesisAvailable()) {
      const textToSpeak = session.explanation
        ? `${session.step}. ${session.explanation}`
        : session.step;
      setIsPlayingAudio(true);
      speakText(textToSpeak, () => setIsPlayingAudio(false));
    }
    return () => {
      stopSpeaking();
      setIsPlayingAudio(false);
    };
  }, [session.step, autoReadAloud]);

  // Reset transition state whenever a new step or variant arrives
  useEffect(() => {
    setActiveAction(null);
    setIsTransitioning(false);
  }, [session.step, session.variant]);

  const handleDoneClick = () => {
    if (activeAction) return;
    setActiveAction("done");
    setIsTransitioning(true);
    onDone();
  };

  const handleSimplerClick = () => {
    if (activeAction) return;
    setActiveAction("simpler");
    setIsTransitioning(true);
    if (onSimplerStep) onSimplerStep();
    else if (onTooBig) onTooBig();
    else if (onConfused) onConfused();
  };

  const handleNotNowClick = () => {
    if (activeAction) return;
    setActiveAction("rest");
    setIsTransitioning(true);
    onNotNow();
  };

  // Setup keyboard shortcuts 1, 2, Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "1") {
        e.preventDefault();
        handleDoneClick();
      } else if (e.key === "2") {
        e.preventDefault();
        handleSimplerClick();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handleNotNowClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeAction, onDone, onSimplerStep, onConfused, onTooBig, onNotNow]);

  const handleReadAloud = () => {
    if (!isSpeechSynthesisAvailable()) return;

    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = session.explanation
      ? `${session.step}. ${session.explanation}`
      : session.step || "";

    if (textToSpeak) {
      setIsPlayingAudio(true);
      speakText(textToSpeak, () => setIsPlayingAudio(false));
    }
  };

  // Header banner label based on variant
  let headerLabel = "YOUR NEXT TINY STEP";
  if (session.variant === "simpler") {
    headerLabel = "HERE IT IS IN SIMPLER WORDS";
  } else if (session.variant === "smaller") {
    headerLabel = "HERE IS A SMALLER STEP";
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-in fade-in duration-200">
      {/* Top Status Bar matching 04-step.png: Working on chip & Read aloud button */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#DDEEE2] text-[#1E3E28] text-xs font-medium py-1.5 px-3.5 max-w-[70%] truncate">
          <FileText className="w-3.5 h-3.5 text-[#1E3E28] shrink-0" />
          <span className="truncate">Working on: <strong className="font-bold text-[#112316]">{session.task}</strong></span>
        </div>

        {isSpeechSynthesisAvailable() && (
          <button
            type="button"
            onClick={handleReadAloud}
            className={`inline-flex items-center gap-1.5 rounded-full py-1.5 px-3.5 text-xs font-medium transition-colors cursor-pointer ${
              isPlayingAudio
                ? "bg-[#315B41] text-white"
                : "bg-[#DDEEE2] text-[#1E3E28] hover:bg-[#D0E2D5]"
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop reading</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Read aloud</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Focus Step Card with Optimistic Transition feedback */}
      <div
        className={`startease-card p-6 md:p-10 border border-[#D5E7DC] bg-white shadow-xl shadow-[#142D1E]/3 space-y-6 transition-all duration-150 ${
          isTransitioning ? "opacity-80 scale-[0.998]" : "opacity-100 scale-100"
        }`}
      >
        {/* Header label with green dot */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#244930]" />
            <span className="text-xs font-bold text-[#244930] tracking-wider uppercase">
              {headerLabel}
            </span>
          </div>

          {session.app && (
            <div className="flex items-center gap-2">
              <span className="rounded-full text-xs py-0.5 px-2.5 bg-[#EDF6F0] text-[#244930] font-medium border border-[#D5EAD9]">
                Use {typeof session.app === "object" ? (session.app as any)?.name : session.app}
              </span>
              <button
                type="button"
                onClick={onCantUseApp}
                className="text-xs text-[#6F8C7A] hover:text-[#244930] underline underline-offset-2 transition-colors cursor-pointer"
              >
                I can&apos;t use this app
              </button>
            </div>
          )}
        </div>

        {/* The Main Step Text */}
        <div className="space-y-3">
          <h1 className="font-serif-title text-[32px] md:text-[36px] font-bold text-[#112316] leading-tight">
            {session.step}
          </h1>

          {/* Explanation if Confused variant */}
          {session.explanation && (
            <p className="text-[15px] text-[#244930] bg-[#EAF5EE] p-4 rounded-xl border border-[#D5EAD9] leading-relaxed font-medium">
              {session.explanation}
            </p>
          )}

          {/* Calm Reassurance text matching docs/copy.md */}
          <p className="text-[15px] text-[#3D5A47] leading-relaxed">
            {session.step?.toLowerCase().startsWith("open ")
              ? "That's all you need to do right now. Don't worry about typing words, collecting citations, or formatting. Just launch the app and open the blank file."
              : "That's all you need to do right now."}
          </p>
        </div>

        {/* Zero Expectation Milestone Box matching 04-step.png & docs/copy.md */}
        <div className="bg-[#EAF5EE] border border-[#D5EAD9] rounded-2xl p-4 md:p-5 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#244930] shadow-2xs shrink-0 mt-0.5">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-xs sm:text-sm text-[#385040] space-y-0.5">
            <p className="font-semibold text-xs text-[#1E3E28]">Zero expectation milestone</p>
            <p className="text-xs text-[#3D5C49] leading-relaxed">
              {session.step?.toLowerCase().startsWith("open ")
                ? "Once the page is on your screen, this step is 100% complete."
                : "Do just this one thing and this step counts as complete."}
            </p>
          </div>
        </div>

        {/* Action Buttons Section matching 04-step.png */}
        <div className="space-y-3 pt-2">
          <p className="text-[11px] font-bold text-[#5A7764] tracking-wider uppercase">
            HOW DOES THIS STEP FEEL?
          </p>

          {/* Primary "Done" Button - Optimistic feedback on pointerdown/click */}
          <button
            type="button"
            onClick={handleDoneClick}
            disabled={activeAction !== null}
            className={`w-full h-[52px] px-5 rounded-xl text-white flex items-center justify-between shadow-xs transition-all duration-150 cursor-pointer ${
              activeAction === "done"
                ? "bg-[#244930] scale-[0.99] shadow-inner"
                : "bg-[#315B41] hover:bg-[#284C35] active:scale-[0.99]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2
                className={`w-5 h-5 text-white transition-transform ${
                  activeAction === "done" ? "scale-110 text-emerald-200 animate-pulse" : ""
                }`}
              />
              <span className="text-[15px] font-semibold">
                {activeAction === "done" ? "Moving forward..." : "Done"}
              </span>
            </div>
            <span className="text-xs text-[#A3CBA6] font-normal">
              Takes you to next tiny step {showShortcuts && "[1]"}
            </span>
          </button>

          {/* Single Secondary Action: Simpler step */}
          <button
            type="button"
            onClick={handleSimplerClick}
            disabled={activeAction !== null}
            className={`w-full h-[50px] px-5 rounded-xl text-[#1E3F29] font-semibold text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
              activeAction === "simpler"
                ? "bg-[#D1E3D6] scale-[0.99]"
                : "bg-[#DEECE2] hover:bg-[#D1E3D6] active:scale-[0.99]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Minimize2
                className={`w-4 h-4 text-[#1E3F29] transition-transform ${
                  activeAction === "simpler" ? "scale-110 animate-pulse" : ""
                }`}
              />
              <span className="text-[14px]">
                {activeAction === "simpler" ? "Finding simpler words..." : "Simpler step"}
              </span>
            </div>
            <span className="text-xs text-[#5B7A68] font-normal">
              Makes it plainer and smaller {showShortcuts && "[2]"}
            </span>
          </button>

          {/* Not now Button */}
          <button
            type="button"
            onClick={handleNotNowClick}
            disabled={activeAction !== null}
            className={`w-full h-[46px] px-4 rounded-xl text-[#234930] font-medium text-xs flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer ${
              activeAction === "rest"
                ? "bg-[#DBEDE1] scale-[0.99]"
                : "bg-[#E7F3EB] hover:bg-[#DBEDE1] active:scale-[0.99]"
            }`}
          >
            <Pause className={`w-3.5 h-3.5 text-[#5A7764] ${activeAction === "rest" ? "animate-pulse" : ""}`} />
            <span>
              {activeAction === "rest" ? "Pausing gently..." : "Not now • Pause and rest without losing progress"}
            </span>
            {showShortcuts && <span className="text-[#5A7764] text-[11px]">[Space]</span>}
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Footer matching 04-step.png */}
      {showShortcuts && (
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#5A7764] px-2 pt-2 gap-2">
          <div className="flex items-center gap-1.5">
            <span>Shortcuts: </span>
            <span className="font-semibold text-[#142D1E]">[1]</span> Done •{" "}
            <span className="font-semibold text-[#142D1E]">[2]</span> Simpler step •{" "}
            <span className="font-semibold text-[#142D1E]">[Space]</span> Rest
          </div>
          <div>
            <span>No timers. No guilt.</span>
          </div>
        </div>
      )}
    </div>
  );
}
