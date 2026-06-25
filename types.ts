export interface Project {
  id: string;
  name: string;
  color: string;
  scope: "work" | "personal";
}

export type DifficultyKey = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  label: string;
  color: string;
  bg: string;
}

export type StatusKey = "upcoming" | "urgent" | "overdue" | "completed";

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  dueDate: string;
  reminder: number;
  projectId: string;
  difficulty: DifficultyKey;
  estH: number;
  estM: number;
  tags: string[];
  completed: boolean;
  notified: boolean;
  pomodoros?: number;
}

export interface NewTaskState {
  title: string;
  desc: string;
  date: string;
  time: string;
  reminder: number;
  difficulty: DifficultyKey;
  estH: number;
  estM: number;
  tags: string[];
  tagInput: string;
}

export const STORAGE_KEY = "taskmanager-v2";

export const REMINDER_OPTIONS = [
  { label: "За 10 минут", value: 10 },
  { label: "За 30 минут", value: 30 },
  { label: "За 1 час", value: 60 },
  { label: "За 2 часа", value: 120 },
];

export const PROJECT_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

export const DEFAULT_WORK_PROJECT: Project = {
  id: "default-work",
  name: "Общие рабочие задачи",
  color: "#3b82f6",
  scope: "work",
};

export const DEFAULT_PERSONAL_PROJECT: Project = {
  id: "default-personal",
  name: "Общие личные задачи",
  color: "#ec4899",
  scope: "personal",
};

export const DIFFICULTY: Record<DifficultyKey, DifficultyConfig> = {
  easy: { label: "Лёгкая", color: "#10b981", bg: "#f0fdf4" },
  medium: { label: "Средняя", color: "#f59e0b", bg: "#fffbeb" },
  hard: { label: "Сложная", color: "#ef4444", bg: "#fef2f2" },
};

export const STATUS_CONFIG: Record<StatusKey, StatusConfig> = {
  upcoming: { label: "Предстоящие", color: "#3b82f6", bg: "#eff6ff" },
  urgent: { label: "Срочные", color: "#f59e0b", bg: "#fffbeb" },
  overdue: { label: "Просроченные", color: "#ef4444", bg: "#fef2f2" },
  completed: { label: "Выполненные", color: "#10b981", bg: "#f0fdf4" },
};
