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
import { AuthModal } from "@/components/modals/AuthModal";
import { api, ApiError } from "@/lib/api";
import { storage } from "@/lib/storage";
import { supabase, supabaseDb, mapSupabaseUser } from "@/lib/supabase";
import { SessionData, SessionApp, TaskLogItem, UserPreferences, UserProfile } from "@/lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"focus" | "decompose" | "log" | "preferences">("decompose");
  const [currentScreen, setCurrentScreen] = useState<
    "welcome" | "decompose" | "loading" | "step" | "rest" | "complete" | "crisis" | "no_match" | "error"
  >("welcome");

  const [session, setSession] = useState<SessionData | null>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCantUseAppOpen, setIsCantUseAppOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(storage.getPreferences());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<{ title: string; subtitle: string } | null>(null);

  // Synchronize user preferences to document root and Electron window
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("text-size-normal", "text-size-large", "text-size-xlarge");
    root.classList.add(`text-size-${preferences.textSize}`);
    root.style.fontSize =
      preferences.textSize === "xlarge" ? "20px" : preferences.textSize === "large" ? "18px" : "16px";

    if (preferences.calmMotion) {
      root.classList.add("calm-motion");
    } else {
      root.classList.remove("calm-motion");
    }

    if (preferences.dyslexiaFriendly) {
      root.classList.add("dyslexia-friendly");
    } else {
      root.classList.remove("dyslexia-friendly");
    }

    if (typeof window !== "undefined" && (window as any).electronApi?.setOpacity) {
      (window as any).electronApi.setOpacity((preferences.windowOpacity || 100) / 100);
    }
  }, [preferences]);

  // Restore authenticated user profile on mount & handle Supabase auth state changes (e.g. Google OAuth)
  useEffect(() => {
    const cachedUser = storage.getAuthUser();
    if (cachedUser) {
      setUser(cachedUser);
      if (cachedUser.id && cachedUser.id !== "guest") {
        supabaseDb.fetchUserPreferences(cachedUser.id).then((cloud) => {
          if (cloud) {
            const local = storage.getPreferences(cachedUser.id);
            const merged = { ...local, ...cloud };
            storage.savePreferences(merged, cachedUser.id);
            setPreferences(merged);
          }
        }).catch(() => {});
      }
    }
    if (storage.getAuthToken()) {
      api
        .getMe()
        .then((profile) => setUser(profile))
        .catch(() => {
          // Token expired or invalid
          storage.clearAuthToken();
          storage.clearAuthUser();
          setUser(null);
        });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, supaSession) => {
      if (supaSession?.user) {
        const profile = mapSupabaseUser(supaSession.user);
        storage.saveAuthToken(supaSession.access_token);
        storage.saveAuthUser(profile);
        setUser(profile);
        supabaseDb.fetchUserPreferences(profile.id).then((cloud) => {
          if (cloud) {
            const local = storage.getPreferences(profile.id);
            const merged = { ...local, ...cloud };
            storage.savePreferences(merged, profile.id);
            setPreferences(merged);
          }
        }).catch(() => {});
        setCurrentScreen("decompose");
        setActiveTab("decompose");
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    // Switch session and preferences to the newly authenticated user
    const userSession = storage.getSession(authenticatedUser.id);
    const localPrefs = storage.getPreferences(authenticatedUser.id);
    setPreferences(localPrefs);

    // Sync preferences with Supabase cloud
    if (authenticatedUser.id && authenticatedUser.id !== "guest") {
      supabaseDb.fetchUserPreferences(authenticatedUser.id).then((cloud) => {
        if (cloud) {
          const merged = { ...localPrefs, ...cloud };
          storage.savePreferences(merged, authenticatedUser.id);
          setPreferences(merged);
        } else {
          supabaseDb.upsertUserPreferences(localPrefs, authenticatedUser.id).catch(() => {});
        }
      }).catch(() => {});
    }
    const userIsDone = userSession && (userSession.status === "completed" || userSession.status === "complete");
    if (userSession && userSession.step && !userIsDone && userSession.status !== "no_match" && userSession.status !== "crisis") {
      setSession(userSession);
      if (userSession.status === "rest") {
        setCurrentScreen("rest");
        setActiveTab("focus");
      } else {
        setCurrentScreen("step");
        setActiveTab("focus");
      }
    } else {
      setSession(null);
      setCurrentScreen("decompose");
      setActiveTab("decompose");
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    // Switch back to clean guest space
    const guestSession = storage.getSession("guest");
    const guestPrefs = storage.getPreferences("guest");
    setPreferences(guestPrefs);
    const guestIsDone = guestSession && (guestSession.status === "completed" || guestSession.status === "complete");
    if (guestSession && guestSession.step && !guestIsDone && guestSession.status !== "no_match" && guestSession.status !== "crisis") {
      setSession(guestSession);
    } else {
      setSession(null);
    }
    setCurrentScreen("welcome");
    setActiveTab("decompose");
  };

  // Restore session from localStorage on initial load and keep synchronized across windows
  useEffect(() => {
    let isCancelled = false;

    const restoreSession = (saved: SessionData | null) => {
      if (isCancelled) return;
      if (saved && saved.status !== "no_match" && saved.status !== "crisis") {
        setSession(saved);
        const isDone = saved.status === "completed" || saved.status === "complete";
        if (isDone) {
          setCurrentScreen("complete");
          setActiveTab("focus");
        } else if (saved.status === "rest") {
          setCurrentScreen("rest");
          setActiveTab("focus");
        } else if (saved.step) {
          setCurrentScreen("step");
          setActiveTab("focus");
        }
      } else {
        setSession(null);
      }
    };

    const syncFromStorage = async () => {
      const activeUid = user?.id || storage.getAuthUser()?.id;
      let saved = storage.getSession(activeUid);
      const prefs = storage.getPreferences(activeUid);
      setPreferences(prefs);

      if (!saved && activeUid && activeUid !== "guest") {
        try {
          const cloud = await supabaseDb.fetchActiveSession(activeUid);
          if (cloud && !isCancelled) {
            saved = cloud;
            storage.saveSession(cloud, activeUid);
          }
        } catch {}
      }

      restoreSession(saved);
    };

    // Initial check on mount
    const loadInitial = async () => {
      const activeUid = user?.id || storage.getAuthUser()?.id;
      let initialSaved = storage.getSession(activeUid);
      const initialPrefs = storage.getPreferences(activeUid);
      setPreferences(initialPrefs);

      if (!initialSaved && activeUid && activeUid !== "guest") {
        try {
          const cloud = await supabaseDb.fetchActiveSession(activeUid);
          if (cloud && !isCancelled) {
            initialSaved = cloud;
            storage.saveSession(cloud, activeUid);
          }
        } catch {}
      }

      if (isCancelled) return;

      const initialIsDone = initialSaved && (initialSaved.status === "completed" || initialSaved.status === "complete");
      if (initialSaved && initialSaved.step && !initialIsDone && initialSaved.status !== "no_match" && initialSaved.status !== "crisis") {
        setSession(initialSaved);
        if (initialSaved.status === "rest") {
          setCurrentScreen("rest");
          setActiveTab("focus");
        } else {
          setCurrentScreen("step");
          setActiveTab("focus");
        }
      } else if (activeUid && activeUid !== "guest") {
        // User is authenticated: proceed straight to task entry rather than welcome
        setCurrentScreen("decompose");
        setActiveTab("decompose");
      } else {
        setCurrentScreen("welcome");
      }
    };

    loadInitial();

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("focus", syncFromStorage);

    if (typeof window !== "undefined" && (window as any).electronApi?.onSyncSession) {
      (window as any).electronApi.onSyncSession(syncFromStorage);
    }

    return () => {
      isCancelled = true;
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("focus", syncFromStorage);
    };
  }, [user?.id]);

  // Update session in storage whenever it changes
  const updateSessionState = (newSession: SessionData | null) => {
    setSession(newSession);
    const uid = user?.id;
    if (newSession && newSession.status !== "no_match" && newSession.status !== "crisis") {
      storage.saveSession(newSession, uid);
      // Update Gentle Log
      const isComplete = newSession.status === "completed" || newSession.status === "complete";
      const existingLogs = storage.getLog(uid);
      const normCurrentTask = (newSession.task || "").trim().toLowerCase();
      const existingLog = existingLogs.find(
        (l) => l.task && l.task.trim().toLowerCase() === normCurrentTask
      );
      const finalStatus = isComplete
        ? "Finished"
        : (newSession.status === "rest" && existingLog?.status === "Finished")
        ? "Finished"
        : "Paused";

      const logItem: TaskLogItem = {
        id: `${newSession.session_id}_${encodeURIComponent(normCurrentTask)}`,
        task: newSession.task,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        status: finalStatus,
        lastStep: newSession.step || existingLog?.lastStep || "",
        app: newSession.app || existingLog?.app,
        completed_at: new Date().toISOString(),
      };
      storage.addOrUpdateLog(logItem, uid);

      // Register all sibling tasks from brain-dump as Queued in logs so they appear immediately
      if (newSession.task_queue && Array.isArray(newSession.task_queue)) {
        for (const queuedTask of newSession.task_queue) {
          if (!queuedTask || !queuedTask.trim()) continue;
          const normQueued = queuedTask.trim().toLowerCase();
          if (normQueued === normCurrentTask) continue;
          const existingQueued = existingLogs.find(
            (l) => l.task && l.task.trim().toLowerCase() === normQueued
          );
          if (!existingQueued) {
            const queuedItem: TaskLogItem = {
              id: `${newSession.session_id}_${encodeURIComponent(normQueued)}`,
              task: queuedTask.trim(),
              date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              status: "Queued",
              lastStep: "Queued from brain-dump",
              completed_at: new Date().toISOString(),
            };
            storage.addOrUpdateLog(queuedItem, uid);
            if (uid && uid !== "guest") {
              supabaseDb.upsertTaskLog(queuedItem, uid).catch(() => {});
            }
          }
        }
      }

      if (uid && uid !== "guest") {
        supabaseDb.upsertTaskLog(logItem, uid).catch(() => {});
        supabaseDb.upsertActiveSession(newSession, uid).catch(() => {});
      }
    } else {
      storage.clearSession(uid);
      if (uid && uid !== "guest") {
        supabaseDb.clearActiveSession(uid).catch(() => {});
      }
    }
  };

  // Helper to ensure we have a valid backend session ID before dispatching responses
  const ensureSessionReady = async (sess: SessionData): Promise<SessionData> => {
    if (sess.session_id && sess.session_id !== "null") {
      return sess;
    }
    const taskText = sess.task || sess.step || "Current task";
    const fresh = await api.createSession(taskText);
    const updated: SessionData = {
      ...sess,
      session_id: fresh.session_id,
      task: taskText,
      step: fresh.step || sess.step,
      app: fresh.app || sess.app,
      status: (fresh.status || "step") as any,
    };
    updateSessionState(updated);
    return updated;
  };

  // 1. Welcome -> Guest
  const handleContinueAsGuest = () => {
    setCurrentScreen("decompose");
    setActiveTab("decompose");
  };

  // 1b. Welcome -> Google Sign-in
  const handleSignInWithGoogle = async () => {
    try {
      await api.signInWithGoogle();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setErrorMessage("Could not connect to Google sign in. Please try email sign in.");
    }
  };

  // 2. Submit Task
  const handleSubmitTask = async (task: string, deadline: string | null) => {
    const activeUid = user?.id || storage.getAuthUser()?.id;
    const cached = storage.getCachedSteps(task, activeUid);

    // Instant Local Cache hit (Optimization 4): render in 0ms if task is cached
    if (cached && cached.step) {
      const instantSession: SessionData = {
        session_id: cached.session_id || "cached_" + Date.now(),
        task: cached.task || task,
        status: "step",
        step: cached.step,
        explanation: cached.explanation,
        app: cached.app,
        variant: cached.variant || "normal",
        deadline: deadline,
        timestamp: Date.now(),
      };
      updateSessionState(instantSession);
      setCurrentScreen("step");
      setActiveTab("focus");

      // Silently sync session in the background
      ensureSessionReady(instantSession).catch(() => {});
      return;
    }

    setLoadingMessage({
      title: "Finding a small first step...",
      subtitle: "Looking through tools to find the gentlest start for you.",
    });
    setCurrentScreen("loading");
    setErrorMessage(null);

    try {
      const data = await api.createSession(task);
      const enriched: SessionData = {
        session_id: data.session_id,
        task: data.task || task,
        status: data.status,
        step: data.step,
        explanation: data.explanation,
        app: data.app,
        variant: data.variant,
        deadline: deadline,
        has_more_tasks: data.has_more_tasks,
        next_task_title: data.next_task_title,
        task_queue: data.task_queue,
        timestamp: Date.now(),
      };

      if (enriched.status === "crisis") {
        updateSessionState(null);
        setSession(enriched);
        setCurrentScreen("crisis");
      } else if (enriched.status === "no_match") {
        updateSessionState(null);
        setSession(enriched);
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

  // 3. Step Action: Done (Optimistic UI - Zero screen flicker)
  const handleDone = async () => {
    if (!session) return;

    // Fallback timer: only show loading screen if network takes longer than 350ms
    const fallbackTimer = setTimeout(() => {
      setLoadingMessage({
        title: "Moving forward...",
        subtitle: "Getting your next gentle step ready.",
      });
      setCurrentScreen("loading");
    }, 350);

    try {
      const active = await ensureSessionReady(session);
      const res = await api.respond(active.session_id, "done");
      clearTimeout(fallbackTimer);

      if (res.status === "completed" || res.status === "complete") {
        const completedSession: SessionData = {
          ...active,
          ...res,
          task: res.task || active.task,
          step: res.step || active.step,
          app: res.app || active.app,
          status: "completed",
          has_more_tasks: res.has_more_tasks,
          next_task_title: res.next_task_title,
          task_queue: res.task_queue || active.task_queue,
        };
        updateSessionState(completedSession);
        setCurrentScreen("complete");
      } else {
        const updatedSession: SessionData = {
          ...active,
          ...res,
          task: res.task || active.task,
          status: "step",
          variant: "normal",
          has_more_tasks: res.has_more_tasks,
          next_task_title: res.next_task_title,
          task_queue: res.task_queue || active.task_queue,
        };
        updateSessionState(updatedSession);
        setCurrentScreen("step");
      }
    } catch (err: any) {
      clearTimeout(fallbackTimer);
      console.error("Done step error:", err);
      const taskText = session.task || session.step;
      if (err?.status === 404 && taskText) {
        try {
          const fresh = await api.createSession(taskText);
          const recovered: SessionData = {
            ...session,
            session_id: fresh.session_id,
            task: taskText,
            step: fresh.step,
            app: fresh.app,
            deadline: session.deadline,
          };
          updateSessionState(recovered);
          setCurrentScreen("step");
          return;
        } catch {}
      }
      setErrorMessage("Something went wrong on my side. Your progress is safe.");
      setCurrentScreen("error");
    }
  };

  // 4. Step Action: Simpler Step (Optimistic UI)
  const handleSimplerStep = async () => {
    if (!session) return;

    const fallbackTimer = setTimeout(() => {
      setLoadingMessage({
        title: "Making this step simpler...",
        subtitle: "Putting this in clearer words and tinier actions.",
      });
      setCurrentScreen("loading");
    }, 350);

    try {
      const active = await ensureSessionReady(session);
      const res = await api.respond(active.session_id, "simpler_step");
      clearTimeout(fallbackTimer);
      const updated = { ...active, ...res, variant: "smaller" as const };
      updateSessionState(updated);
      setCurrentScreen("step");
    } catch (err: any) {
      clearTimeout(fallbackTimer);
      console.error("Simpler step error:", err);
      const taskText = session.task || session.step;
      if (err?.status === 404 && taskText) {
        try {
          const fresh = await api.createSession(taskText);
          const recovered: SessionData = {
            ...session,
            session_id: fresh.session_id,
            task: taskText,
            step: fresh.step,
            app: fresh.app,
            deadline: session.deadline,
          };
          updateSessionState(recovered);
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
      const active = await ensureSessionReady(session);
      const res = await api.respond(active.session_id, "confused");
      const updated = { ...active, ...res, variant: "simpler" as const };
      updateSessionState(updated);
      setCurrentScreen("step");
    } catch (err: any) {
      console.error("Confused error:", err);
      const taskText = session.task || session.step;
      if (err?.status === 404 && taskText) {
        try {
          const fresh = await api.createSession(taskText);
          const recovered: SessionData = {
            ...session,
            session_id: fresh.session_id,
            task: taskText,
            step: fresh.step,
            app: fresh.app,
            deadline: session.deadline,
          };
          updateSessionState(recovered);
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
      const active = await ensureSessionReady(session);
      const res = await api.respond(active.session_id, "too_big");
      const updated = { ...active, ...res, variant: "smaller" as const };
      updateSessionState(updated);
      setCurrentScreen("step");
    } catch (err: any) {
      console.error("Too big error:", err);
      const taskText = session.task || session.step;
      if (err?.status === 404 && taskText) {
        try {
          const fresh = await api.createSession(taskText);
          const recovered: SessionData = {
            ...session,
            session_id: fresh.session_id,
            task: taskText,
            step: fresh.step,
            app: fresh.app,
            deadline: session.deadline,
          };
          updateSessionState(recovered);
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
      const active = await ensureSessionReady(session);
      const res = await api.respond(active.session_id, "not_now");
      const updated = { ...active, ...res, status: "rest" as const };
      updateSessionState(updated);
      setCurrentScreen("rest");
    } catch (err) {
      console.error("Not now error:", err);
      setCurrentScreen("rest");
    }
  };

  // 6b. Start Next Queued Task (from Multi-task brain dump)
  const handleStartNextTask = async () => {
    if (!session) return;
    setLoadingMessage({
      title: "Loading next task...",
      subtitle: "Preparing your first calm micro-action.",
    });
    setCurrentScreen("loading");

    try {
      const nextTitle = session.next_task_title;
      const res = await api.nextTask(session.session_id);
      if (res.status === "completed" || res.status === "complete") {
        const allCompleted: SessionData = {
          ...session,
          ...res,
          status: "completed",
        };
        updateSessionState(allCompleted);
        setCurrentScreen("complete");
        return;
      }
      const updated: SessionData = {
        ...session,
        ...res,
        task: res.task || nextTitle || session.task,
        status: "step" as const,
        variant: "normal" as const,
        has_more_tasks: res.has_more_tasks,
        next_task_title: res.next_task_title,
        task_queue: res.task_queue || [],
      };
      updateSessionState(updated);
      setCurrentScreen("step");
    } catch (err: any) {
      console.error("Start next task error:", err);
      setErrorMessage("Something went wrong loading the next task. Your progress is safe.");
      setCurrentScreen("error");
    }
  };

  // 7. Resume Same Step (Instant Local Resume via Cache)
  const handleResumeSame = async () => {
    if (!session) return;
    const activeUid = user?.id || storage.getAuthUser()?.id;
    const cached = storage.getCachedSteps(session.task, activeUid);
    const resumedSession: SessionData = {
      ...session,
      step: cached?.step || session.step,
      explanation: cached?.explanation || session.explanation,
      app: cached?.app || session.app,
      status: "step",
      variant: "normal",
    };
    updateSessionState(resumedSession);
    setCurrentScreen("step");
    setActiveTab("focus");

    // Silently notify backend in background
    try {
      const active = await ensureSessionReady(resumedSession);
      api.resume(active.session_id, "same").catch(() => {});
    } catch (err) {
      console.error("Resume same background sync:", err);
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
      const active = await ensureSessionReady(session);
      const res = await api.resume(active.session_id, "smaller");
      const updated = { ...active, ...res, status: "step" as const, variant: "smaller" as const };
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
      const active = await ensureSessionReady(session);
      const res = await api.respond(active.session_id, "cant_use_app");
      const updated = { ...active, ...res, variant: "normal" as const };
      updateSessionState(updated);
      setIsCantUseAppOpen(false);
      setCurrentScreen("step");
    } catch (err) {
      console.error("Substitute app error:", err);
      setIsCantUseAppOpen(false);
      setCurrentScreen("step");
    }
  };

  // 10. Clear Session (Complete wipe: active task, drafts, and all task logs)
  const handleClearSession = async () => {
    const activeUid = user?.id || storage.getAuthUser()?.id;
    const currentSession = session || storage.getSession(activeUid);

    // 1. Delete active session on backend server
    if (currentSession?.session_id) {
      await api.deleteSession(currentSession.session_id);
    }

    // 2. Clear all local storage (active task, draft, and all task logs)
    storage.clearSession(activeUid);
    storage.clearDraft(activeUid);
    storage.clearLog(activeUid);

    // 3. Clear from Supabase (both active session and all task logs)
    if (activeUid && activeUid !== "guest") {
      try {
        await supabaseDb.clearActiveSession(activeUid);
        await supabaseDb.clearTaskLogs(activeUid);
      } catch (e) {
        console.warn("Error clearing Supabase session & logs:", e);
      }
    }

    // 4. Reset React state
    setSession(null);

    // 5. Navigate to appropriate screen
    if (activeUid && activeUid !== "guest") {
      setCurrentScreen("decompose");
      setActiveTab("decompose");
    } else {
      setCurrentScreen("welcome");
      setActiveTab("decompose");
    }
  };

  // 11. Navigation Tab Switching
  const handleTabChange = (tab: "focus" | "decompose" | "log" | "preferences") => {
    setActiveTab(tab);
    if (tab === "focus") {
      const isComplete = session && (session.status === "completed" || session.status === "complete");
      if (session && !isComplete) {
        if (session.status === "rest") setCurrentScreen("rest");
        else if (session.step) setCurrentScreen("step");
        else setCurrentScreen("decompose");
      } else if (isComplete) {
        setCurrentScreen("complete");
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
          userId={user?.id}
          onResumeTask={(item) => {
            const activeUid = user?.id || storage.getAuthUser()?.id;
            const toSessionApp = (a?: SessionApp | string): SessionApp | undefined => {
              if (!a) return undefined;
              return typeof a === "string" ? { name: a } : a;
            };
            let targetSession: SessionData | null = null;
            const saved = storage.getSession(activeUid);
            if (
              saved &&
              (saved.session_id === item.id ||
                (saved.task && saved.task.trim().toLowerCase() === item.task.trim().toLowerCase()))
            ) {
              targetSession = {
                ...saved,
                step: saved.step || item.lastStep,
                app: saved.app || toSessionApp(item.app),
                status: "step",
                variant: saved.variant || "normal",
              };
            } else {
              const cached = storage.getCachedSteps(item.task, activeUid);
              if (cached && cached.step) {
                targetSession = {
                  session_id: cached.session_id || item.id,
                  task: cached.task || item.task,
                  step: cached.step,
                  app: cached.app || toSessionApp(item.app),
                  status: "step",
                  variant: cached.variant || "normal",
                  timestamp: Date.now(),
                };
              } else if (item.lastStep) {
                targetSession = {
                  session_id: item.id || "resumed_" + Date.now(),
                  task: item.task,
                  step: item.lastStep,
                  app: toSessionApp(item.app),
                  status: "step",
                  variant: "normal",
                  timestamp: Date.now(),
                };
              }
            }

            if (targetSession && targetSession.step && item.status !== "Queued") {
              updateSessionState(targetSession);
              setCurrentScreen("step");
              setActiveTab("focus");

              if (
                targetSession.session_id &&
                !targetSession.session_id.startsWith("resumed_") &&
                !targetSession.session_id.startsWith("cached_")
              ) {
                api.resume(targetSession.session_id, "same").catch(() => {});
              }
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
          userId={user?.id}
          onPreferencesChange={(updated) => {
            setPreferences(updated);
            if (user?.id && user.id !== "guest") {
              supabaseDb.upsertUserPreferences(updated, user.id).catch(() => {});
            }
          }}
        />
      );
    }

    switch (currentScreen) {
      case "welcome":
        return (
          <WelcomeScreen
            onContinueAsGuest={handleContinueAsGuest}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            onOpenAuth={(mode) => {
              setAuthModalMode(mode || "login");
              setIsAuthModalOpen(true);
            }}
            onSignInWithGoogle={handleSignInWithGoogle}
          />
        );

      case "decompose":
        return (
          <TaskEntryScreen
            userId={user?.id}
            activeSession={session}
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
            autoReadAloud={preferences.readAloud}
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
            hasMoreTasks={session?.has_more_tasks}
            nextTaskTitle={session?.next_task_title}
            onStartNextQueuedTask={handleStartNextTask}
            onNotNow={() => {
              if (session) {
                const restSession: SessionData = {
                  ...session,
                  status: "rest" as const,
                  step: session.next_task_title || "You completed your task. Take a calm rest.",
                };
                updateSessionState(restSession);
                setCurrentScreen("rest");
              } else {
                setCurrentScreen("decompose");
                setActiveTab("decompose");
              }
            }}
            onRestOrLater={() => {
              if (session) {
                const restSession: SessionData = {
                  ...session,
                  status: "rest" as const,
                  step: session.next_task_title || "You completed your task. Take a calm rest.",
                };
                updateSessionState(restSession);
                setCurrentScreen("rest");
              } else {
                setCurrentScreen("decompose");
                setActiveTab("decompose");
              }
            }}
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
          hasActiveTask={!!session && session.status !== "completed" && session.status !== "complete"}
          user={user}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || "login");
            setIsAuthModalOpen(true);
          }}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1 w-full">{renderContent()}</main>

      {currentScreen !== "welcome" && <Footer />}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

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
