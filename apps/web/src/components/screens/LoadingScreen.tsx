"use client";

import React, { useState, useEffect } from "react";
import { Sprout } from "lucide-react";

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export function LoadingScreen({
  title = "Finding a small first step...",
  subtitle = "Looking through tools to find the gentlest start for you.",
}: LoadingScreenProps) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSlow(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md startease-card p-10 text-center space-y-5 animate-in fade-in duration-200">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#E1F0E6] flex items-center justify-center text-[#2D5A3D] animate-pulse">
          <Sprout className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif-title text-2xl font-bold text-[#1A3323]">
            {title}
          </h2>
          <p className="text-xs text-[#718779]">
            {isSlow
              ? "Still working on it. Thank you for waiting."
              : subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
