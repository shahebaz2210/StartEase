"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Trash2, ArrowRight } from "lucide-react";
import { storage } from "@/lib/storage";
import { TaskLogItem } from "@/lib/types";
import { supabaseDb } from "@/lib/supabase";

interface GentleLogScreenProps {
  onResumeTask: (item: TaskLogItem) => void;
  userId?: string;
}

export function GentleLogScreen({ onResumeTask, userId }: GentleLogScreenProps) {
  const [logItems, setLogItems] = useState<TaskLogItem[]>([]);

  useEffect(() => {
    // 1. Initial load from local user-scoped storage
    const local = storage.getLog(userId);
    setLogItems(local);

    // 2. If authenticated user, sync with Supabase cloud task_logs
    if (userId && userId !== "guest") {
      supabaseDb.fetchTaskLogs(userId).then((cloudLogs) => {
        if (cloudLogs && cloudLogs.length > 0) {
          // Merge by id (preferring recent)
          const merged = [...cloudLogs];
          for (const loc of local) {
            if (!merged.some((m) => m.id === loc.id)) {
              merged.push(loc);
            }
          }
          storage.setLog(merged, userId);
          setLogItems(merged);
        }
      });
    }
  }, [userId]);

  const handleClearLog = () => {
    storage.clearLog(userId);
    if (userId && userId !== "guest") {
      supabaseDb.clearTaskLogs(userId).catch(() => {});
    }
    setLogItems([]);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      <div className="startease-card p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#D3E4D8]/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#E1F0E6] flex items-center justify-center text-[#2D5A3D]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif-title text-2xl font-bold text-[#1A3323]">
                Gentle Log
              </h1>
              <p className="text-xs text-[#718779]">
                {userId && userId !== "guest"
                  ? "Tasks you started, private to your account."
                  : "Tasks you started, kept on this device only."}
              </p>
            </div>
          </div>

          {logItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearLog}
              className="text-xs text-[#718779] hover:text-[#DC2626] flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear log</span>
            </button>
          )}
        </div>

        {logItems.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm text-[#4A5D50]">Nothing here yet.</p>
            <p className="text-xs text-[#718779]">
              Tasks you start will appear here so you can pick them back up at your own pace.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#EFF7F1] border border-[#D3E4D8]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#1A3323]">
                      {item.task}
                    </span>
                    <span
                      className={`startease-pill text-[11px] py-0.5 px-2 ${
                        item.status === "Finished"
                          ? "bg-[#DDEEE2] text-[#2D5A3D]"
                          : "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5D50]">
                    Last step: &ldquo;{item.lastStep}&rdquo;
                  </p>
                  <p className="text-[11px] text-[#718779]">{item.date}</p>
                </div>

                {item.status === "Paused" && (
                  <button
                    type="button"
                    onClick={() => onResumeTask(item)}
                    className="py-1.5 px-3 rounded-lg btn-primary-dark text-xs font-medium flex items-center gap-1.5 self-start sm:self-center shadow-xs"
                  >
                    <span>Resume</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
