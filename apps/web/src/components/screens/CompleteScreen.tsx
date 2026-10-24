"use client";

import React from "react";
import { Sparkles, ArrowRight, Heart } from "lucide-react";

interface CompleteScreenProps {
  onStartNewTask: () => void;
}

export function CompleteScreen({ onStartNewTask }: CompleteScreenProps) {
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

        <div className="flex items-center justify-center gap-1.5 text-xs text-[#718779] pt-2">
          <Heart className="w-3.5 h-3.5 text-[#2D5A3D]" />
          <span>Every small action adds up.</span>
        </div>
      </div>
    </div>
  );
}
