import { SessionData, TaskLogItem, UserPreferences, UserProfile } from "./types";

const SESSION_KEY = "startease_active_session";
const PREFS_KEY = "startease_user_preferences";
const LOG_KEY = "startease_gentle_log";
const DRAFT_KEY = "startease_task_draft";
const AUTH_TOKEN_KEY = "startease_auth_token";
const AUTH_USER_KEY = "startease_auth_user";

const DEFAULT_PREFERENCES: UserPreferences = {
  textSize: "normal",
  calmMotion: false,
  readAloud: false,
  showShortcuts: true,
  windowOpacity: 100,
};

export const storage = {
  // Session
  getSession(): SessionData | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveSession(session: SessionData): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn("Storage error saving session:", e);
    }
  },

  clearSession(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  },

  // Preferences
  getPreferences(): UserPreferences {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  savePreferences(prefs: UserPreferences): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn("Storage error saving preferences:", e);
    }
  },

  // Gentle Log
  getLog(): TaskLogItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addLogItem(item: TaskLogItem): void {
    this.addOrUpdateLog(item);
  },

  addOrUpdateLog(item: TaskLogItem): void {
    if (typeof window === "undefined") return;
    try {
      const current = this.getLog();
      const existingIndex = current.findIndex((i) => i.id === item.id);
      let updated: TaskLogItem[];
      if (existingIndex >= 0) {
        updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], ...item };
      } else {
        updated = [item, ...current];
      }
      localStorage.setItem(LOG_KEY, JSON.stringify(updated.slice(0, 50)));
    } catch (e) {
      console.warn("Storage error adding log item:", e);
    }
  },

  clearLog(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(LOG_KEY);
    } catch {}
  },

  // Drafts
  getDraft(): string {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(DRAFT_KEY) || "";
    } catch {
      return "";
    }
  },

  saveDraft(draft: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(DRAFT_KEY, draft);
    } catch {}
  },

  clearDraft(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  },

  // Authentication Storage
  getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  saveAuthToken(token: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch {}
  },

  clearAuthToken(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {}
  },

  getAuthUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveAuthUser(user: UserProfile): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch {}
  },

  clearAuthUser(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {}
  },
};
