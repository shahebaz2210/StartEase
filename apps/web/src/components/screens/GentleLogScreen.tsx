"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Trash2, ArrowRight } from "lucide-react";
import { storage, deduplicateLogs } from "@/lib/storage";
import { TaskLogItem } from "@/lib/types";
import { supabaseDb } from "@/lib/supabase";

interface GentleLogScreenProps {
  onResumeTask: (item: TaskLogItem) => void;
  userId?: string;
}

export function GentleLogScreen({ onResumeTask, userId }: GentleLogScreenProps) {
  const [logItems, setLogItems] = useState<TaskLogItem[]>([]);
  const [resumingId, setResumingId] = useState<string | null>(null);

  const handleResumeClick = (item: TaskLogItem) => {
    if (resumingId) return;
    setResumingId(item.id);
    setTimeout(() => {
      onResumeTask(item);
    }, 280);
  };

  useEffect(() => {
    const refreshLogs = () => {
      const local = storage.getLog(userId);
      setLogItems(local);
    };

    // 1. Initial load from local user-scoped storage (auto-deduplicated)
    refreshLogs();

    // 2. If authenticated user, sync with Supabase cloud task_logs
    if (userId && userId !== "guest") {
      supabaseDb.fetchTaskLogs(userId).then((cloudLogs) => {
        if (cloudLogs && cloudLogs.length > 0) {
          const local = storage.getLog(userId);
          // Combine local & cloud logs and deduplicate
          const combined = [...cloudLogs];
          for (const loc of local) {
            if (!combined.some((m) => m.id === loc.id)) {
              combined.push(loc);
            }
          }
          const deduplicated = deduplicateLogs(combined);
          storage.setLog(deduplicated, userId);
          setLogItems(deduplicated);
        }
      });
    }

    window.addEventListener("focus", refreshLogs);
    window.addEventListener("storage", refreshLogs);
    return () => {
      window.removeEventListener("focus", refreshLogs);
      window.removeEventListener("storage", refreshLogs);
    };
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
                Logs
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
            {resumingId && (
              <div className="bg-[#EAF5EE] border border-[#2D5A3D]/25 rounded-xl p-3.5 flex items-center gap-3 text-xs text-[#1B3F27] animate-in fade-in slide-in-from-top-1 duration-150 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2D5A3D] animate-ping shrink-0" />
                <span className="font-medium">
                  Picking up your task right at your saved step...
                </span>
              </div>
            )}
            {logItems.map((item, idx) => (
              <div
                key={`${item.id}_${item.task || idx}`}
                className="p-4 rounded-xl bg-[#EFF7F1] border border-[#D3E4D8]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-[#C5DDCB]"
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
                          : item.status === "Queued"
                          ? "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
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

                {(item.status === "Paused" || item.status === "Queued") && (
                  <button
                    type="button"
                    disabled={resumingId !== null}
                    onClick={() => handleResumeClick(item)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-center transition-all duration-150 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/30 ${
                      resumingId === item.id
                        ? "bg-[#244930] text-emerald-100 scale-95 shadow-inner"
                        : "btn-primary-dark hover:scale-[1.03] active:scale-95"
                    }`}
                  >
                    {resumingId === item.id ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-emerald-200/40 border-t-emerald-200 rounded-full animate-spin" />
                        <span>{item.status === "Queued" ? "Starting..." : "Resuming..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{item.status === "Queued" ? "Start" : "Resume"}</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
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
