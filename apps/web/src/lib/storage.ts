import { SessionData, TaskLogItem, UserPreferences, UserProfile } from "./types";

const SESSION_KEY = "active_session";
const PREFS_KEY = "user_preferences";
const LOG_KEY = "gentle_log";
const DRAFT_KEY = "task_draft";
const AUTH_TOKEN_KEY = "startease_auth_token";
const AUTH_USER_KEY = "startease_auth_user";

const DEFAULT_PREFERENCES: UserPreferences = {
  textSize: "normal",
  calmMotion: false,
  readAloud: false,
  showShortcuts: true,
  windowOpacity: 100,
};

function getActiveUserId(explicitId?: string): string {
  if (explicitId && explicitId.trim()) return explicitId.trim();
  if (typeof window === "undefined") return "guest";
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return parsed.id;
    }
  } catch {}
  return "guest";
}

function resolveKey(baseKey: string, explicitUserId?: string): string {
  const uid = getActiveUserId(explicitUserId);
  return `startease_${uid}_${baseKey}`;
}

export const storage = {
  // Session (User-Scoped)
  getSession(userId?: string): SessionData | null {
    if (typeof window === "undefined") return null;
    try {
      const key = resolveKey(SESSION_KEY, userId);
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);

      // Backwards compatibility fallback for guest sessions
      if (getActiveUserId(userId) === "guest") {
        const legacy = localStorage.getItem("startease_active_session");
        return legacy ? JSON.parse(legacy) : null;
      }
      return null;
    } catch {
      return null;
    }
  },

  saveSession(session: SessionData, userId?: string): void {
    if (typeof window === "undefined") return;
    try {
      const key = resolveKey(SESSION_KEY, userId);
      localStorage.setItem(key, JSON.stringify(session));
    } catch (e) {
      console.warn("Storage error saving session:", e);
    }
  },

  clearSession(userId?: string): void {
    if (typeof window === "undefined") return;
    try {
      const key = resolveKey(SESSION_KEY, userId);
      localStorage.removeItem(key);
      if (getActiveUserId(userId) === "guest") {
        localStorage.removeItem("startease_active_session");
      }
    } catch {}
  },

  // Preferences (User-Scoped)
  getPreferences(userId?: string): UserPreferences {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;
    try {
      const key = resolveKey(PREFS_KEY, userId);
      const raw = localStorage.getItem(key);
      if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };

      if (getActiveUserId(userId) === "guest") {
        const legacy = localStorage.getItem("startease_user_preferences");
        return legacy ? { ...DEFAULT_PREFERENCES, ...JSON.parse(legacy) } : DEFAULT_PREFERENCES;
      }
      return DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  savePreferences(prefs: UserPreferences, userId?: string): void {
    if (typeof window === "undefined") return;
    try {
      const key = resolveKey(PREFS_KEY, userId);
      localStorage.setItem(key, JSON.stringify(prefs));
    } catch (e) {
      console.warn("Storage error saving preferences:", e);
    }
  },

  // Gentle Log (User-Scoped)
  getLog(userId?: string): TaskLogItem[] {
    if (typeof window === "undefined") return [];
    try {
      const key = resolveKey(LOG_KEY, userId);
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);

      if (getActiveUserId(userId) === "guest") {
        const legacy = localStorage.getItem("startease_gentle_log");
        return legacy ? JSON.parse(legacy) : [];
      }
      return [];
    } catch {
      return [];
    }
  },

  setLog(items: TaskLogItem[], userId?: string): void {
    if (typeof window === "undefined") return;
    try {
      const key = resolveKey(LOG_KEY, userId);
      localStorage.setItem(key, JSON.stringify(items.slice(0, 50)));
    } catch (e) {
      console.warn("Storage error setting log:", e);
    }
  },

  addLogItem(item: TaskLogItem, userId?: string): void {
    this.addOrUpdateLog(item, userId);
  },

  addOrUpdateLog(item: TaskLogItem, userId?: string): void {
    if (typeof window === "undefined") return;
    try {
      const key = resolveKey(LOG_KEY, userId);
      const current = this.getLog(userId);
      const existingIndex = current.findIndex((i) => i.id === item.id);
      let updated: TaskLogItem[];
      if (existingIndex >= 0) {
        updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], ...item };
      } else {
        updated = [item, ...current];
      }
      localStorage.setItem(key, JSON.stringify(updated.slice(0, 50)));
    } catch (e) {
      console.warn("Storage error adding log item:", e);
    }
  },

  clearLog(userId?: string): void {
    if (typeof window === "undefined") return;
    try {
      const key = resolveKey(LOG_KEY, userId);
      localStorage.removeItem(key);
      if (getActiveUserId(userId) === "guest") {
        localStorage.removeItem("startease_gentle_log");
      }
    } catch {}
  },

  // Drafts (User-Scoped)
  getDraft(userId?: string): string {
    if (typeof window === "undefined") return "";
    try {
      const key = resolveKey(DRAFT_KEY, userId);
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  },

  saveDraft(draft: string, userId?: string): void {
    if (typeof window === "undefined") return;
    try {
      const key = resolveKey(DRAFT_KEY, userId);
      localStorage.setItem(key, draft);
    } catch {}
  },

  clearDraft(userId?: string): void {
    if (typeof window === "undefined") return;
    try {
      const key = resolveKey(DRAFT_KEY, userId);
      localStorage.removeItem(key);
    } catch {}
  },

  // Authentication Storage (Global tokens for current session)
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
