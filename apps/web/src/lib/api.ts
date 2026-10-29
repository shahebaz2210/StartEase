import { storage } from "./storage";
import { AuthTokens, UserProfile } from "./types";
import { supabaseAuth, supabaseDb, isSupabaseConfigured } from "./supabase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Attach JWT token if authenticated
  const token = storage.getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errData: any = null;
    try {
      errData = await res.json();
    } catch {
      errData = { message: res.statusText };
    }
    const message =
      errData?.message || errData?.detail || `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, errData);
  }

  // Handle empty bodies
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Session Endpoints
  async createSession(task: string): Promise<any> {
    return request("/v1/sessions", {
      method: "POST",
      body: JSON.stringify({ task }),
    });
  },

  async respond(sessionId: string, response: string): Promise<any> {
    return request(`/v1/sessions/${encodeURIComponent(sessionId)}/respond`, {
      method: "POST",
      body: JSON.stringify({ response }),
    });
  },

  async resume(sessionId: string, mode: "same" | "smaller"): Promise<any> {
    return request(`/v1/sessions/${encodeURIComponent(sessionId)}/resume`, {
      method: "POST",
      body: JSON.stringify({ mode }),
    });
  },

  async nextTask(sessionId: string): Promise<any> {
    return request(`/v1/sessions/${encodeURIComponent(sessionId)}/next-task`, {
      method: "POST",
    });
  },

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await request(`/v1/sessions/${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Could not delete session on server:", e);
    }
  },

  // Authentication Endpoints (Direct Supabase Auth Cloud First)
  async register(email: string, password: string, name?: string): Promise<AuthTokens> {
    if (isSupabaseConfigured) {
      try {
        const supaRes = await supabaseAuth.signUp(email, password, name);
        if (!supaRes.user) {
          throw new ApiError(400, "Registration did not return a user profile.");
        }

        const token = supaRes.session?.access_token || "";
        const user: UserProfile = supaRes.user;

        if (token) {
          storage.saveAuthToken(token);
        }
        storage.saveAuthUser(user);

        // Sync profile to Supabase database if session exists
        if (token) {
          supabaseDb.upsertProfile(user).catch(() => {});
        }

        return {
          access_token: token || "pending_confirmation",
          token_type: "bearer",
          user,
        };
      } catch (supaErr: any) {
        const msg = supaErr?.message || "Failed to register account with Supabase.";
        if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("over_email_send_rate_limit")) {
          throw new ApiError(
            429,
            "Supabase email rate limit reached. In your Supabase dashboard (Authentication -> Providers -> Email), toggle 'Confirm email' to OFF."
          );
        }
        throw new ApiError(400, msg);
      }
    }

    // Fallback only if Supabase is completely unconfigured (offline / local dev mode)
    const data = await request<AuthTokens>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    if (data?.access_token) {
      storage.saveAuthToken(data.access_token);
      if (data.user) storage.saveAuthUser(data.user);
    }
    return data;
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    if (isSupabaseConfigured) {
      try {
        const supaRes = await supabaseAuth.signIn(email, password);
        const token = supaRes.session?.access_token;
        if (!token) {
          throw new ApiError(401, "No active session returned. Please confirm your email in Supabase.");
        }
        const user: UserProfile = supaRes.user || {
          id: supaRes.session.user?.id || `usr_${Date.now()}`,
          email,
          name: supaRes.session.user?.user_metadata?.name || null,
          created_at: new Date().toISOString(),
        };
        storage.saveAuthToken(token);
        storage.saveAuthUser(user);

        return {
          access_token: token,
          token_type: "bearer",
          user,
        };
      } catch (supaErr: any) {
        const msg = supaErr?.message || "Incorrect email or password.";
        if (msg.toLowerCase().includes("email not confirmed")) {
          throw new ApiError(
            400,
            "Email not confirmed. Please click the link sent to your email, or toggle 'Confirm email' OFF in your Supabase dashboard."
          );
        }
        throw new ApiError(401, msg);
      }
    }

    // Fallback only if Supabase is completely unconfigured (offline / local dev mode)
    const data = await request<AuthTokens>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data?.access_token) {
      storage.saveAuthToken(data.access_token);
      if (data.user) storage.saveAuthUser(data.user);
    }
    return data;
  },

  async signInWithGoogle() {
    return supabaseAuth.signInWithGoogle();
  },

  async getMe(): Promise<UserProfile> {
    try {
      const user = await request<UserProfile>("/v1/auth/me", {
        method: "GET",
      });
      if (user) {
        storage.saveAuthUser(user);
      }
      return user;
    } catch {
      const supaUser = await supabaseAuth.getCurrentUser();
      if (supaUser) {
        storage.saveAuthUser(supaUser);
        return supaUser;
      }
      const cached = storage.getAuthUser();
      if (cached) return cached;
      throw new ApiError(401, "Not authenticated");
    }
  },

  async logout(): Promise<void> {
    try {
      await request("/v1/auth/logout", {
        method: "POST",
      });
    } catch {}
    try {
      await supabaseAuth.signOut();
    } catch {}
    storage.clearAuthToken();
    storage.clearAuthUser();
  },
};

