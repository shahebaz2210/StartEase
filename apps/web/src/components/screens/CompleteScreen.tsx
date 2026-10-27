"use client";

import React from "react";
import { Sparkles, ArrowRight, Heart } from "lucide-react";

interface CompleteScreenProps {
  onStartNewTask: () => void;
  hasMoreTasks?: boolean;
  nextTaskTitle?: string | null;
  onStartNextQueuedTask?: () => void;
  onRestOrLater?: () => void;
}

export function CompleteScreen({
  onStartNewTask,
  hasMoreTasks,
  nextTaskTitle,
  onStartNextQueuedTask,
  onRestOrLater,
}: CompleteScreenProps) {
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
          <div className="bg-[#EFF7F1] border border-[#C5DDCB] rounded-2xl p-5 space-y-4 text-left">
            <div className="space-y-1 text-center">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#2D5A3D]">
                Whenever you feel ready, next up:
              </span>
              <p className="font-serif-title text-base font-bold text-[#1A3323]">
                {nextTaskTitle}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={onStartNextQueuedTask}
                className="flex-1 py-3 px-4 rounded-xl btn-primary-dark font-medium text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Start this task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onRestOrLater || onStartNewTask}
                className="flex-1 py-3 px-4 rounded-xl btn-sage-medium font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Take a rest for now</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <button
              type="button"
              onClick={onStartNewTask}
              className="w-full py-3.5 px-5 rounded-xl btn-primary-dark font-medium text-sm flex items-center justify-center gap-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/40"
            >
              <span>Start a new task</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-xs text-[#718779] pt-2">
          <Heart className="w-3.5 h-3.5 text-[#2D5A3D]" />
          <span>Every small action adds up.</span>
        </div>
      </div>
    </div>
  );
}
