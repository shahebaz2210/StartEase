"use client";

import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  Mic,
  MicOff,
  Sparkles,
  Sprout,
  RotateCcw,
  Lightbulb,
  ArrowRight,
  Check,
  Calendar,
} from "lucide-react";
import { createSpeechRecognizer, isSpeechRecognitionAvailable } from "@/lib/speech";
import { storage } from "@/lib/storage";
import { SessionData } from "@/lib/types";

interface TaskEntryScreenProps {
  onSubmitTask: (task: string, deadline: string | null) => void;
  onResumeSavedTask: (session: SessionData) => void;
  onClearSavedTask: () => void;
}

export function TaskEntryScreen({
  onSubmitTask,
  onResumeSavedTask,
  onClearSavedTask,
}: TaskEntryScreenProps) {
  const [taskText, setTaskText] = useState("");
  const [selectedDeadline, setSelectedDeadline] = useState<string>("skip");
  const [customDeadline, setCustomDeadline] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [savedSession, setSavedSession] = useState<SessionData | null>(null);

  useEffect(() => {
    // Load draft if any
    const draft = storage.getDraft();
    if (draft) setTaskText(draft);

    // Check for paused task
    const session = storage.getSession();
    if (session && session.step && session.status !== "completed") {
      setSavedSession(session);
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTaskText(e.target.value);
    storage.saveDraft(e.target.value);
  };

  const handleSpeechToggle = () => {
    if (!isSpeechRecognitionAvailable()) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript) => {
        setTaskText((prev) => {
          const updated = prev ? `${prev} ${transcript}` : transcript;
          storage.saveDraft(updated);
          return updated;
        });
      },
      () => setIsListening(false)
    );

    if (recognizer) {
      setIsListening(true);
      recognizer.onend = () => setIsListening(false);
      recognizer.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    let deadlineValue: string | null = null;
    if (selectedDeadline === "today") deadlineValue = "Today";
    else if (selectedDeadline === "tomorrow") deadlineValue = "Tomorrow";
    else if (selectedDeadline === "custom") deadlineValue = customDeadline || "Later";

    storage.saveDraft("");
    onSubmitTask(taskText.trim(), deadlineValue);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Main Task Entry Card matching 02-task-entry.png */}
      <div className="startease-card p-6 md:p-10 border border-[#D5E7DC] bg-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gentle Initiation Chip */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#E2EFE7] flex items-center justify-center text-[#234A30]">
              <HelpCircle className="w-3.5 h-3.5 text-[#234A30]" />
            </div>
            <span className="text-[11px] font-semibold tracking-wider text-[#34533E] uppercase">
              GENTLE INITIATION
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div>
            <h1 className="font-serif-title text-[36px] font-bold text-[#112316] tracking-tight leading-tight">
              What are you stuck on?
            </h1>
            <p className="text-[15px] text-[#425E4B] mt-1.5">
              You don&apos;t need a perfect plan. Just tell us what you need to do.
            </p>
          </div>

          {/* Text Area Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <label htmlFor="task-input" className="text-[#22412E] font-medium text-sm">
                Describe the messy task
              </label>
              <span className="text-[#6F8C7A]">No formatting required</span>
            </div>

            <div className="relative">
              <textarea
                id="task-input"
                rows={4}
                value={taskText}
                onChange={handleTextChange}
                placeholder="Stuck? Just type your task. We'll help you out."
                className="w-full bg-[#EDF6F0] border border-[#D5EAD9] rounded-2xl p-5 text-[#112316] placeholder-[#6F8C7A] text-base resize-none focus:outline-none focus:ring-2 focus:ring-[#2C553C]/30 focus:bg-white transition-all"
              />

              {/* Speak instead microphone button */}
              {isSpeechRecognitionAvailable() && (
                <button
                  type="button"
                  onClick={handleSpeechToggle}
                  className={`absolute bottom-3.5 right-3.5 px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isListening
                      ? "bg-[#DC2626] text-white animate-pulse"
                      : "bg-[#DCEEE1] text-[#244930] hover:bg-[#CFE5D5]"
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Speak instead</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Deadline Chips Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[#22412E] font-medium text-sm">Deadline (optional)</span>
              <span className="text-[#6F8C7A]">No stress, just helps pace if helpful</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedDeadline("skip")}
                className={`py-2 px-3.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedDeadline === "skip"
                    ? "bg-[#D0E8D7] text-[#14351F] font-semibold border border-[#2D5A3D]/30"
                    : "bg-[#E2F1E6] text-[#2B4B36] hover:bg-[#D5EBDC]"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${selectedDeadline === "skip" ? "bg-[#14351F] text-white" : "border border-[#2B4B36]"}`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Skip (no deadline)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDeadline("today")}
                className={`py-2 px-3.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedDeadline === "today"
                    ? "bg-[#D0E8D7] text-[#14351F] font-semibold border border-[#2D5A3D]/30"
                    : "bg-[#E2F1E6] text-[#2B4B36] hover:bg-[#D5EBDC]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#4D6D58]" />
                <span>Today</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDeadline("tomorrow")}
                className={`py-2 px-3.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedDeadline === "tomorrow"
                    ? "bg-[#D0E8D7] text-[#14351F] font-semibold border border-[#2D5A3D]/30"
                    : "bg-[#E2F1E6] text-[#2B4B36] hover:bg-[#D5EBDC]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#4D6D58]" />
                <span>Tomorrow</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDeadline("custom")}
                className={`py-2 px-3.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedDeadline === "custom"
                    ? "bg-[#D0E8D7] text-[#14351F] font-semibold border border-[#2D5A3D]/30"
                    : "bg-[#E2F1E6] text-[#2B4B36] hover:bg-[#D5EBDC]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#4D6D58]" />
                <span>Choose date & time</span>
              </button>
            </div>

            {selectedDeadline === "custom" && (
              <input
                type="text"
                placeholder="e.g. Friday 5 PM"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                className="mt-2 w-full max-w-xs text-xs p-2 rounded-lg bg-[#EDF6F0] border border-[#D5EAD9] text-[#112316] focus:outline-none focus:ring-1 focus:ring-[#2C553C]"
              />
            )}
          </div>

          {/* Primary Submit Button */}
          <div className="pt-2 text-center space-y-3">
            <button
              type="submit"
              disabled={!taskText.trim()}
              className="w-full py-4 px-6 rounded-xl bg-[#335C43] hover:bg-[#284C35] text-white font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors cursor-pointer"
            >
              <span>Help me start</span>
              <Sparkles className="w-4 h-4 fill-white" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-[#5A7764] pt-1">
              <svg className="w-3.5 h-3.5 text-[#5A7764]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.5C12 2.5 10.5 6.5 8 8C5.5 9.5 4 13 4 16C4 18 5.5 19.5 7.5 19.5C10.5 19.5 11.5 16 12 13C12.5 16 13.5 19.5 16.5 19.5C18.5 19.5 20 18 20 16C20 13 18.5 9.5 16 8C13.5 6.5 12 2.5 12 2.5Z" />
                <path d="M12 12V21" stroke="#5A7764" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>One tiny step at a time. No pressure.</span>
            </div>
          </div>
        </form>
      </div>

      {/* Continue Where You Left Off Card matching 02-task-entry.png */}
      {savedSession && savedSession.step && (
        <div className="space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#2D5A3D]" />
              <h2 className="text-sm font-bold text-[#142D1C]">Continue where you left off</h2>
            </div>
            <span className="text-xs text-[#6F8C7A]">Saved draft</span>
          </div>

          <div className="startease-card p-5 bg-white border border-[#D5E7DC] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="font-bold text-[17px] text-[#142D1C]">
                  {savedSession.task}
                </span>
                <span className="text-xs py-0.5 px-2.5 rounded-full bg-[#DCEBE0] text-[#32523D] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#32523D]" />
                  Paused
                </span>
              </div>
              <p className="text-xs text-[#4A5D50]">
                Your last step: &ldquo;{savedSession.step}&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onClearSavedTask}
                className="text-xs text-[#52705D] hover:underline transition-colors cursor-pointer"
              >
                Start a new task instead
              </button>
              <button
                type="button"
                onClick={() => onResumeSavedTask(savedSession)}
                className="py-2.5 px-4 rounded-xl bg-[#335C43] hover:bg-[#284C35] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Resume task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tip Callout Box matching 02-task-entry.png */}
      <div className="bg-[#EAF5EE] border border-[#D5EAD9] rounded-2xl p-4 md:p-5 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#244930] shadow-xs shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-[#244930]" />
        </div>
        <div className="text-xs sm:text-sm text-[#385040] space-y-0.5">
          <p className="font-semibold text-sm text-[#142D1C]">Overwhelmed by how big it feels?</p>
          <p className="text-xs text-[#3A5745] leading-relaxed">
            Try typing just the very first 30 seconds of the task. Even &ldquo;open laptop
            lid&rdquo; is a valid, victory-sized start.
          </p>
        </div>
      </div>
    </div>
  );
}
