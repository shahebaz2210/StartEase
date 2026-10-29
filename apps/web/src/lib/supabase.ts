import { createClient } from "@supabase/supabase-js";
import { UserProfile, TaskLogItem } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function mapSupabaseUser(user: any): UserProfile {
  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || user.user_metadata?.full_name || null,
    created_at: user.created_at || new Date().toISOString(),
  };
}

export const supabaseAuth = {
  async signUp(email: string, password: string, name?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name?.trim() || undefined,
        },
      },
    });

    if (error) {
      throw error;
    }

    return {
      user: data.user ? mapSupabaseUser(data.user) : null,
      session: data.session,
    };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return {
      user: data.user ? mapSupabaseUser(data.user) : null,
      session: data.session,
    };
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn("Supabase sign out notice:", error.message);
    }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return mapSupabaseUser(data.user);
  },

  async getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  },
};

export const supabaseDb = {
  async fetchTaskLogs(userId: string): Promise<TaskLogItem[]> {
    if (!supabaseUrl || !supabaseAnonKey || !userId || userId === "guest") return [];
    try {
      const { data, error } = await supabase
        .from("task_logs")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false });

      if (error) {
        console.warn("Could not fetch task logs from Supabase:", error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        task: row.task,
        lastStep: row.last_step || "",
        status: row.status || "Finished",
        app: row.app_name || undefined,
        date: new Date(row.completed_at || row.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        completed_at: row.completed_at,
      }));
    } catch (e) {
      console.warn("Error fetching Supabase task logs:", e);
      return [];
    }
  },

  async upsertTaskLog(item: TaskLogItem, userId: string): Promise<void> {
    if (!supabaseUrl || !supabaseAnonKey || !userId || userId === "guest") return;
    try {
      const payload = {
        id: item.id,
        user_id: userId,
        task: item.task,
        last_step: item.lastStep || "",
        status: item.status || "Finished",
        app_name: typeof item.app === "object" ? (item.app as any)?.name : item.app || null,
        completed_at: item.completed_at || new Date().toISOString(),
      };
      const { error } = await supabase.from("task_logs").upsert(payload);
      if (error) {
        console.warn("Could not upsert task log to Supabase:", error.message);
      }
    } catch (e) {
      console.warn("Error upserting task log to Supabase:", e);
    }
  },

  async clearTaskLogs(userId: string): Promise<void> {
    if (!supabaseUrl || !supabaseAnonKey || !userId || userId === "guest") return;
    try {
      const { error } = await supabase.from("task_logs").delete().eq("user_id", userId);
      if (error) {
        console.warn("Could not clear task logs in Supabase:", error.message);
      }
    } catch (e) {
      console.warn("Error clearing task logs in Supabase:", e);
    }
  },
};
