"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WelcomeScreen } from "@/components/screens/WelcomeScreen";
import { TaskEntryScreen } from "@/components/screens/TaskEntryScreen";
import { StepScreen } from "@/components/screens/StepScreen";
import { RestScreen } from "@/components/screens/RestScreen";
import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { CompleteScreen } from "@/components/screens/CompleteScreen";
import { CrisisScreen } from "@/components/screens/CrisisScreen";
import { NoMatchScreen } from "@/components/screens/NoMatchScreen";
import { GentleLogScreen } from "@/components/screens/GentleLogScreen";
import { PreferencesScreen } from "@/components/screens/PreferencesScreen";
import { CantUseAppModal } from "@/components/modals/CantUseAppModal";
import { PrivacyModal } from "@/components/modals/PrivacyModal";
import { api, ApiError } from "@/lib/api";
import { storage } from "@/lib/storage";
import { SessionData, TaskLogItem, UserPreferences } from "@/lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"focus" | "decompose" | "log" | "preferences">("decompose");
  const [currentScreen, setCurrentScreen] = useState<
    "welcome" | "decompose" | "loading" | "step" | "rest" | "complete" | "crisis" | "no_match" | "error"
  >("welcome");

  const [session, setSession] = useState<SessionData | null>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCantUseAppOpen, setIsCantUseAppOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(storage.getPreferences());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<{ title: string; subtitle: string } | null>(null);

  // Restore session from localStorage on initial load and keep synchronized across windows
  useEffect(() => {
    const syncFromStorage = () => {
      const saved = storage.getSession();
      const prefs = storage.getPreferences();
      setPreferences(prefs);

      if (saved && saved.step) {
        setSession(saved);
        if (saved.status === "completed") {
          setCurrentScreen("complete");
          setActiveTab("focus");
        } else if (saved.status === "rest") {
          setCurrentScreen("rest");
          setActiveTab("focus");
        } else {
          setCurrentScreen("step");
          setActiveTab("focus");
        }
      }
    };

    // Initial check on mount
    const initialSaved = storage.getSession();
    const initialPrefs = storage.getPreferences();
    setPreferences(initialPrefs);
    if (initialSaved && initialSaved.step && initialSaved.status !== "completed") {
      setSession(initialSaved);
      if (initialSaved.status === "rest") {
        setCurrentScreen("rest");
        setActiveTab("focus");
      } else {
        setCurrentScreen("step");
        setActiveTab("focus");
      }
    } else {
      setCurrentScreen("welcome");
    }

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("focus", syncFromStorage);

    if (typeof window !== "undefined" && (window as any).electronApi?.onSyncSession) {
      (window as any).electronApi.onSyncSession(syncFromStorage);
    }

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("focus", syncFromStorage);
    };
  }, []);

  // Update session in storage whenever it changes
  const updateSessionState = (newSession: SessionData | null) => {
    setSession(newSession);
    if (newSession) {
      storage.saveSession(newSession);
      // Update Gentle Log
      storage.addOrUpdateLog({
        id: newSession.session_id,
        task: newSession.task,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        status: newSession.status === "completed" ? "Finished" : "Paused",
        lastStep: newSession.step || "",
        app: newSession.app,
      });
    } else {
      storage.clearSession();
    }
  };

  // 1. Welcome -> Guest
  const handleContinueAsGuest = () => {
    setCurrentScreen("decompose");
    setActiveTab("decompose");
  };

  // 2. Submit Task
  const handleSubmitTask = async (task: string, deadline: string | null) => {
    setLoadingMessage({
      title: "Finding a small first step...",
      subtitle: "Looking through tools to find the gentlest start for you.",
    });
    setCurrentScreen("loading");
    setErrorMessage(null);

    try {
      const data = await api.createSession(task);
      const enriched: SessionData = {
        ...data,
        deadline: deadline,
      };

      if (enriched.status === "crisis") {
        updateSessionState(enriched);
        setCurrentScreen("crisis");
      } else if (enriched.status === "no_match") {
        updateSessionState(enriched);
        setCurrentScreen("no_match");
      } else {
        updateSessionState(enriched);
        setCurrentScreen("step");
        setActiveTab("focus");
      }
    } catch (err: any) {
      console.error("Task initiation error:", err);
      // Check if crisis error or general error
      if (err.data && err.data.status === "crisis") {
        setCurrentScreen("crisis");
      } else if (err.data && err.data.status === "no_match") {
        setCurrentScreen("no_match");
      } else {
        setErrorMessage(err.message || "Something went wrong on my side. Your progress is safe.");
        setCurrentScreen("error");
      }
    }
  };

  // 3. Step Action: Done
  const handleDone = async () => {
    if (!session) return;
    setLoadingMessage({
      title: "Moving forward...",
      subtitle: "Getting your next gentle step ready.",
    });
    setCurrentScreen("loading");

    try {
      const res = await api.respond(session.session_id, "done");
      if (res.status === "completed") {
        const completedSession = { ...session, ...res, status: "completed" as const };
        updateSessionState(completedSession);
        setCurrentScreen("complete");
      } else {
        const updatedSession = { ...session, ...res, variant: "normal" as const };
        updateSessionState(updatedSession);
        setCurrentScreen("step");
      }
    } catch (err: any) {
      console.error("Done step error:", err);
      if (err?.status === 404 && session?.task) {
        try {
          const fresh = await api.createSession(session.task);
          updateSessionState({ ...fresh, deadline: session.deadline });
          setCurrentScreen("step");
          return;
        } catch {}
      }
      setErrorMessage("Something went wrong on my side. Your progress is safe.");
      setCurrentScreen("error");
    }
  };

  // 4. Step Action: Simpler Step (combines Confused & Too Big)
  const handleSimplerStep = async () => {
    if (!session) return;
    setLoadingMessage({
      title: "Making this step simpler...",
      subtitle: "Putting this in clearer words and tinier actions.",
    });
    setCurrentScreen("loading");

    try {
      const res = await api.respond(session.session_id, "simpler_step");
      const updated = { ...session, ...res, variant: "smaller" as const };
      updateSessionState(updated);
      setCurrentScreen("step");
    } catch (err: any) {
      console.error("Simpler step error:", err);
      if (err?.status === 404 && session?.task) {
        try {
          const fresh = await api.createSession(session.task);
          updateSessionState({ ...fresh, deadline: session.deadline });
          setCurrentScreen("step");
          return;
        } catch {}
      }
      setErrorMessage("Something went wrong on my side. Your progress is safe.");
      setCurrentScreen("error");
    }
  };

  // 4b. Legacy Step Action: Confused
  const handleConfused = async () => {
    if (!session) return;
    setLoadingMessage({
      title: "Finding simpler words...",
      subtitle: "Putting this in clearer language for you.",
    });
    setCurrentScreen("loading");

    try {
      const res = await api.respond(session.session_id, "confused");
      const updated = { ...session, ...res, variant: "simpler" as const };
      updateSessionState(updated);
      setCurrentScreen("step");
    } catch (err: any) {
      console.error("Confused error:", err);
      if (err?.status === 404 && session?.task) {
        try {
          const fresh = await api.createSession(session.task);
          updateSessionState({ ...fresh, deadline: session.deadline });
          setCurrentScreen("step");
          return;
        } catch {}
      }
      setErrorMessage("Something went wrong on my side. Your progress is safe.");
      setCurrentScreen("error");
    }
  };

  // 5. Step Action: Too Big
  const handleTooBig = async () => {
    if (!session) return;
    setLoadingMessage({
      title: "Making this step smaller...",
      subtitle: "Breaking it into tinier, gentler actions.",
    });
    setCurrentScreen("loading");

    try {
      const res = await api.respond(session.session_id, "too_big");
      const updated = { ...session, ...res, variant: "smaller" as const };
      updateSessionState(updated);
      setCurrentScreen("step");
    } catch (err: any) {
      console.error("Too big error:", err);
      if (err?.status === 404 && session?.task) {
        try {
          const fresh = await api.createSession(session.task);
          updateSessionState({ ...fresh, deadline: session.deadline });
          setCurrentScreen("step");
          return;
        } catch {}
      }
      setErrorMessage("Something went wrong on my side. Your progress is safe.");
      setCurrentScreen("error");
    }
  };

  // 6. Step Action: Not Now
  const handleNotNow = async () => {
    if (!session) return;
    try {
      const res = await api.respond(session.session_id, "not_now");
      const updated = { ...session, ...res, status: "rest" as const };
      updateSessionState(updated);
      setCurrentScreen("rest");
    } catch (err) {
      console.error("Not now error:", err);
      setCurrentScreen("rest");
    }
  };

  // 7. Resume Same Step
  const handleResumeSame = async () => {
    if (!session) return;
    setLoadingMessage({
      title: "Resuming your step...",
      subtitle: "Picking up right where you left off.",
    });
    setCurrentScreen("loading");

    try {
      const res = await api.resume(session.session_id, "same");
      const updated = { ...session, ...res, status: "step" as const, variant: "normal" as const };
      updateSessionState(updated);
      setCurrentScreen("step");
    } catch (err) {
      console.error("Resume same error:", err);
      setCurrentScreen("step");
    }
  };

  // 8. Resume Smaller Step
  const handleResumeSmaller = async () => {
    if (!session) return;
    setLoadingMessage({
      title: "Making this step smaller...",
      subtitle: "Breaking it into tinier, gentler actions.",
    });
    setCurrentScreen("loading");

    try {
      const res = await api.resume(session.session_id, "smaller");
      const updated = { ...session, ...res, status: "step" as const, variant: "smaller" as const };
      updateSessionState(updated);
      setCurrentScreen("step");
    } catch (err) {
      console.error("Resume smaller error:", err);
      setCurrentScreen("step");
    }
  };

  // 9. Substitute App
  const handleCantUseAppConfirm = async () => {
    if (!session) return;
    setLoadingMessage({
      title: "Finding another way...",
      subtitle: "Picking a different tool to start with.",
    });
    setCurrentScreen("loading");

    try {
      const res = await api.respond(session.session_id, "cant_use_app");
      const updated = { ...session, ...res, variant: "normal" as const };
      updateSessionState(updated);
      setCurrentScreen("step");
    } catch (err) {
      console.error("Substitute app error:", err);
      setCurrentScreen("step");
    }
  };

  // 10. Clear Session
  const handleClearSession = async () => {
    if (session) {
      await api.deleteSession(session.session_id);
    }
    updateSessionState(null);
    setCurrentScreen("welcome");
    setActiveTab("decompose");
  };

  // 11. Navigation Tab Switching
  const handleTabChange = (tab: "focus" | "decompose" | "log" | "preferences") => {
    setActiveTab(tab);
    if (tab === "focus") {
      if (session && session.step && session.status !== "completed") {
        if (session.status === "rest") setCurrentScreen("rest");
        else setCurrentScreen("step");
      } else {
        setCurrentScreen("decompose");
      }
    } else if (tab === "decompose") {
      setCurrentScreen("decompose");
    } else if (tab === "log") {
      setCurrentScreen("decompose"); // will render log
    } else if (tab === "preferences") {
      setCurrentScreen("decompose"); // will render preferences
    }
  };

  // Determine which body content to show
  const renderContent = () => {
    if (activeTab === "log") {
      return (
        <GentleLogScreen
          onResumeTask={(item) => {
            const saved = storage.getSession();
            if (saved && saved.session_id === item.id) {
              setSession(saved);
              setCurrentScreen("step");
              setActiveTab("focus");
            } else {
              handleSubmitTask(item.task, null);
            }
          }}
        />
      );
    }

    if (activeTab === "preferences") {
      return (
        <PreferencesScreen
          onPreferencesChange={(updated) => setPreferences(updated)}
        />
      );
    }

    switch (currentScreen) {
      case "welcome":
        return (
          <WelcomeScreen
            onContinueAsGuest={handleContinueAsGuest}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />
        );

      case "decompose":
        return (
          <TaskEntryScreen
            onSubmitTask={handleSubmitTask}
            onResumeSavedTask={(saved) => {
              setSession(saved);
              setCurrentScreen(saved.status === "rest" ? "rest" : "step");
              setActiveTab("focus");
            }}
            onClearSavedTask={handleClearSession}
          />
        );

      case "loading":
        return (
          <LoadingScreen
            title={loadingMessage?.title}
            subtitle={loadingMessage?.subtitle}
          />
        );

      case "step":
        if (!session) return <LoadingScreen />;
        return (
          <StepScreen
            session={session}
            onDone={handleDone}
            onSimplerStep={handleSimplerStep}
            onConfused={handleConfused}
            onTooBig={handleTooBig}
            onNotNow={handleNotNow}
            onCantUseApp={() => setIsCantUseAppOpen(true)}
            showShortcuts={preferences.showShortcuts}
          />
        );

      case "rest":
        if (!session) return <LoadingScreen />;
        return (
          <RestScreen
            session={session}
            onResumeSame={handleResumeSame}
            onResumeSmaller={handleResumeSmaller}
            onLeaveApp={() => {
              setCurrentScreen("decompose");
              setActiveTab("decompose");
            }}
          />
        );

      case "complete":
        return (
          <CompleteScreen
            onStartNewTask={() => {
              updateSessionState(null);
              setCurrentScreen("decompose");
              setActiveTab("decompose");
            }}
          />
        );

      case "crisis":
        return (
          <CrisisScreen
            onBackToStartEase={() => {
              updateSessionState(null);
              setCurrentScreen("decompose");
              setActiveTab("decompose");
            }}
          />
        );

      case "no_match":
        return (
          <NoMatchScreen
            onTryAgain={() => {
              setCurrentScreen("decompose");
              setActiveTab("decompose");
            }}
          />
        );

      case "error":
        return (
          <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="startease-card p-8 max-w-md text-center space-y-4">
              <h2 className="font-serif-title text-2xl font-bold text-[#1A3323]">
                {errorMessage || "Something went wrong on my side. Your progress is safe."}
              </h2>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentScreen("decompose")}
                  className="py-2.5 px-4 rounded-xl btn-primary-dark text-xs font-semibold"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Preference classes
  const textSizeClass =
    preferences.textSize === "large"
      ? "text-size-large"
      : preferences.textSize === "xlarge"
      ? "text-size-xlarge"
      : "text-size-normal";

  const motionClass = preferences.calmMotion ? "calm-motion" : "";

  return (
    <div className={`min-h-screen flex flex-col ${textSizeClass} ${motionClass}`}>
      {currentScreen !== "welcome" && (
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onClearSession={handleClearSession}
          hasActiveTask={!!session && session.status !== "completed"}
        />
      )}

      <main className="flex-1 w-full">{renderContent()}</main>

      {currentScreen !== "welcome" && <Footer />}

      {/* Modals */}
      <CantUseAppModal
        currentApp={typeof session?.app === "object" ? (session.app as any)?.name : (session?.app || "this app")}
        isOpen={isCantUseAppOpen}
        onClose={() => setIsCantUseAppOpen(false)}
        onConfirm={handleCantUseAppConfirm}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onClearSession={handleClearSession}
      />
    </div>
  );
}
