"use client";

import React from "react";
import { Phone, ArrowLeft, HeartHandshake } from "lucide-react";

interface CrisisScreenProps {
  onBackToStartEase: () => void;
}

export function CrisisScreen({ onBackToStartEase }: CrisisScreenProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-[#FECACA] rounded-2xl p-8 md:p-10 shadow-lg text-left space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#B91C1C]">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif-title text-2xl font-bold text-[#991B1B]">
              You don&apos;t have to face it alone.
            </h1>
            <p className="text-xs text-[#7F1D1D]">Support and care are available right now.</p>
          </div>
        </div>

        <div className="text-sm text-[#374151] leading-relaxed space-y-4">
          <p>
            I&apos;m really sorry you&apos;re going through this. You don&apos;t have to face it alone.
          </p>

          <p>
            If you might be in danger, please call your local emergency number now.<br />
            <strong>In India, you can call 112.</strong>
          </p>

          <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 rounded-xl space-y-2.5">
            <p className="font-semibold text-[#991B1B] text-xs uppercase tracking-wider">
              You can also talk to someone who is trained to listen:
            </p>
            <div className="space-y-1.5 text-xs text-[#1F2937]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#B91C1C]" />
                <span><strong>Tele-MANAS</strong> (India, free, 24/7): <strong>14416</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#B91C1C]" />
                <span><strong>KIRAN</strong> mental health helpline (India): <strong>1800-599-0019</strong></span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#6B7280]">
            If you are outside India, please look up a local helpline or contact a trusted person near you.
          </p>

          <p className="text-xs italic text-[#4B5563]">
            I&apos;m not able to help with this myself, but I am glad you told me.
          </p>
        </div>

        <div className="pt-4 border-t border-[#F3F4F6]">
          <button
            type="button"
            onClick={onBackToStartEase}
            className="w-full py-3 px-4 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] text-xs font-semibold text-[#374151] flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to StartEase</span>
          </button>
        </div>
      </div>
    </div>
  );
}
