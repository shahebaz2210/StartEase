"use client";

import React, { useState } from "react";
import {
  Coffee,
  CheckCircle2,
  Calendar,
  Play,
  Minimize2,
  Mail,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  LogOut,
  Heart,
} from "lucide-react";
import { SessionData } from "@/lib/types";

interface RestScreenProps {
  session: SessionData;
  onResumeSame: () => void;
  onResumeSmaller: () => void;
  onLeaveApp: () => void;
}

export function RestScreen({
  session,
  onResumeSame,
  onResumeSmaller,
  onLeaveApp,
}: RestScreenProps) {
  const [draftOpen, setDraftOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<"teacher" | "manager" | "teammate">("teacher");
  const [copied, setCopied] = useState(false);

  const getTemplateText = () => {
    const taskName = session.task || "my task";
    if (selectedRecipient === "teacher") {
      return `Hi [Name], I'm working on ${taskName}. I'd like to ask for a little more time so I can do it well. Would [date] be possible? Thank you for understanding.`;
    } else if (selectedRecipient === "manager") {
      return `Hi [Name], I'm making progress on ${taskName} and I'd like a little more time to finish it properly. Would [date] work? I'll let you know if anything changes. Thanks.`;
    } else {
      return `Hi [Name], I'm still working on ${taskName} and would like a little more time. Could we move it to [date]? Thanks for your patience.`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getTemplateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      <div className="startease-card p-6 md:p-10 text-center space-y-6 border border-[#D5E7DC] bg-white shadow-xl shadow-[#142D1E]/3">
        {/* Coffee Mug Icon matching 08-rest.png */}
        <div className="mx-auto w-16 h-16 rounded-full bg-[#D5E8DC] flex items-center justify-center text-[#1F4229]">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#1F4229" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
            <line x1="6" y1="2" x2="6" y2="4" />
            <line x1="10" y1="2" x2="10" y2="4" />
            <line x1="14" y1="2" x2="14" y2="4" />
          </svg>
        </div>

        {/* Safe Pause Point Chip matching 08-rest.png */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DDEFE3] text-[#2A4B35] text-xs font-medium py-1 px-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2A4B35]" />
          <span>Safe pause point active</span>
        </div>

        {/* Heading & Body matching 08-rest.png */}
        <div className="space-y-2">
          <h1 className="font-serif-title text-[32px] md:text-[34px] font-bold text-[#112316] tracking-tight leading-tight">
            That&apos;s okay. Come back whenever you like.
          </h1>
          <p className="text-[14.5px] text-[#3D5A47] leading-relaxed max-w-lg mx-auto">
            Your task is safely saved at your current step: &ldquo;<strong className="text-[#112316] font-semibold">{session.step}</strong>&rdquo;. You can step away, stretch, drink water, or sleep. No alarms, no penalties.
          </p>
        </div>

        {/* Gentle Context Note (Only if deadline was set) matching 08-rest.png */}
        {session.deadline && (
          <div className="bg-[#E8F4EC] border border-[#D5EAD9] rounded-2xl p-4 text-left flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#244930] shadow-2xs shrink-0 mt-0.5">
              <Calendar className="w-4 h-4 text-[#244930]" />
            </div>
            <div className="text-xs text-[#385040] space-y-0.5 flex-1">
              <div className="flex items-center justify-between font-bold text-[#1E3F28]">
                <span>Gentle context note</span>
                <span className="text-xs font-normal text-[#5C7C68]">{session.deadline}</span>
              </div>
              <p className="leading-relaxed text-[#3D5A47]">
                You set a gentle target for {session.deadline}. Whenever you are ready, we can focus on the smallest useful outcome or help you ask for more time with zero stress.
              </p>
            </div>
          </div>
        )}

        {/* Resume Choices Buttons matching 08-rest.png */}
        <div className="space-y-3 pt-2">
          {/* Start again */}
          <button
            type="button"
            onClick={onResumeSame}
            className="w-full h-[50px] px-4 rounded-xl bg-[#335C43] hover:bg-[#284C35] text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start again</span>
          </button>

          {/* Make the step smaller first */}
          <button
            type="button"
            onClick={onResumeSmaller}
            className="w-full h-[50px] px-4 rounded-xl bg-[#D8EADF] hover:bg-[#CDE2D5] text-[#183622] font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Minimize2 className="w-4 h-4 text-[#183622]" />
            <span>Make the step smaller first</span>
          </button>

          {/* Help me draft a message dropdown */}
          <div className="border border-[#D5EAD9] rounded-xl overflow-hidden bg-[#E2F1E6]/50">
            <button
              type="button"
              onClick={() => setDraftOpen(!draftOpen)}
              className="w-full h-[48px] px-4 text-sm font-medium text-[#1E4029] hover:bg-[#D5E9DA]/50 flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#1E4029]" />
                <span>Help me draft a message to ask for more time</span>
              </div>
              {draftOpen ? (
                <ChevronUp className="w-4 h-4 text-[#5C7C68]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#5C7C68]" />
              )}
            </button>

            {draftOpen && (
              <div className="p-4 bg-white border-t border-[#D5EAD9] text-left space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6F8C7A]">Send to:</span>
                  {(["teacher", "manager", "teammate"] as const).map((recipient) => (
                    <button
                      key={recipient}
                      type="button"
                      onClick={() => setSelectedRecipient(recipient)}
                      className={`text-xs px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                        selectedRecipient === recipient
                          ? "bg-[#335C43] text-white font-medium"
                          : "bg-[#EDF6F0] text-[#3D5A47] hover:bg-[#DCEEE1]"
                      }`}
                    >
                      {recipient}
                    </button>
                  ))}
                </div>

                <div className="bg-[#EDF6F0] p-3 rounded-xl border border-[#D5EAD9] text-xs text-[#112316] font-mono leading-relaxed select-all">
                  {getTemplateText()}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="py-1.5 px-3 rounded-lg bg-[#335C43] hover:bg-[#284C35] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leave and close app link */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onLeaveApp}
            className="text-xs text-[#3E5C49] hover:underline flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave and close app (Progress is saved)</span>
          </button>
        </div>
      </div>

      {/* Footer line with heart icon matching 08-rest.png */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-[#5C7C68]">
        <Heart className="w-3.5 h-3.5 text-[#335C43]" />
        <span>Pacing yourself is productive.</span>
      </div>
    </div>
  );
}
