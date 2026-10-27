import { storage } from "./storage";
import { AuthTokens, UserProfile } from "./types";

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

  // Authentication Endpoints
  async register(email: string, password: string, name?: string): Promise<AuthTokens> {
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

  async getMe(): Promise<UserProfile> {
    const user = await request<UserProfile>("/v1/auth/me", {
      method: "GET",
    });
    if (user) {
      storage.saveAuthUser(user);
    }
    return user;
  },

  async logout(): Promise<void> {
    try {
      await request("/v1/auth/logout", {
        method: "POST",
      });
    } catch {}
    storage.clearAuthToken();
    storage.clearAuthUser();
  },
};
