"use client";

import React, { useEffect } from "react";
import { Sparkles, ArrowRight, Heart, Pause, Play } from "lucide-react";

interface CompleteScreenProps {
  onStartNewTask: () => void;
  onNotNow?: () => void;
  hasMoreTasks?: boolean;
  nextTaskTitle?: string | null;
  onStartNextQueuedTask?: () => void;
  onRestOrLater?: () => void;
}

export function CompleteScreen({
  onStartNewTask,
  onNotNow,
  hasMoreTasks,
  nextTaskTitle,
  onStartNextQueuedTask,
  onRestOrLater,
}: CompleteScreenProps) {
  const handleRest = onNotNow || onRestOrLater || onStartNewTask;

  // Keyboard shortcut: Space for Not now, 1 for start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        if (hasMoreTasks && nextTaskTitle && onStartNextQueuedTask) {
          onStartNextQueuedTask();
        } else {
          onStartNewTask();
        }
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handleRest();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMoreTasks, nextTaskTitle, onStartNextQueuedTask, onStartNewTask, handleRest]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg startease-card p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#E1F0E6] flex items-center justify-center text-[#2D5A3D]">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif-title text-3xl font-bold text-[#1A3323]">
            You finished this task.
          </h1>
          <p className="text-sm text-[#4A5D50]">
            That took real effort. Well done.
          </p>
        </div>

        {hasMoreTasks && nextTaskTitle ? (
          <div className="bg-[#EFF7F1] border border-[#C5DDCB] rounded-2xl p-5 space-y-3.5 text-left">
            <div className="space-y-1 text-center">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#2D5A3D]">
                Whenever you feel ready, next up:
              </span>
              <p className="font-serif-title text-base font-bold text-[#1A3323]">
                {nextTaskTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onStartNextQueuedTask}
              className="w-full py-3 px-4 rounded-xl btn-primary-dark font-medium text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start this task</span>
            </button>
          </div>
        ) : null}

        {/* Core two buttons similarly as core */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onStartNewTask}
            className="w-full h-[50px] px-5 rounded-xl btn-primary-dark font-medium text-sm flex items-center justify-center gap-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/40 cursor-pointer"
          >
            <span>Start a new task</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRest}
            className="w-full h-[46px] px-4 rounded-xl bg-[#E7F3EB] hover:bg-[#DBEDE1] text-[#234930] font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 text-[#5A7764]" />
            <span>Not now • Pause and rest without losing progress</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-[#718779] pt-2">
          <Heart className="w-3.5 h-3.5 text-[#2D5A3D]" />
          <span>Every small action adds up.</span>
        </div>
      </div>
    </div>
  );
}

