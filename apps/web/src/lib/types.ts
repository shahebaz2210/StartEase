export type StepVariant = "normal" | "simpler" | "smaller" | "explanation";

export interface SessionApp {
  name: string;
  reason?: string;
}

export interface SessionData {
  session_id: string;
  task: string;
  status: "step" | "completed" | "complete" | "rest" | "crisis" | "no_match" | "error";
  current_step?: string;
  step?: string;
  explanation?: string;
  app?: SessionApp;
  variant?: StepVariant;
  deadline?: string | null;
  has_more_tasks?: boolean;
  next_task_title?: string | null;
  timestamp?: number;
}

export interface TaskLogItem {
  id: string;
  task: string;
  date: string;
  status: "Finished" | "Paused" | string;
  lastStep: string;
  app?: SessionApp | string;
  completed_at?: string;
}

export interface UserPreferences {
  textSize: "normal" | "large" | "xlarge";
  calmMotion: boolean;
  readAloud: boolean;
  showShortcuts: boolean;
  windowOpacity: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface CachedTaskSteps {
  session_id?: string;
  task: string;
  step?: string;
  explanation?: string;
  app?: SessionApp;
  variant?: StepVariant;
  stepsHistory?: string[];
  timestamp: number;
}
