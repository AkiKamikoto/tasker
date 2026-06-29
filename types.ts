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

// ─── Повторение ────────────────────────────────────────────────────────────────
export type RecurrenceFreq = "daily" | "weekly" | "monthly";

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval: number; // «каждые N» (1 = каждый день/неделю/месяц)
}

// ─── GTD ────────────────────────────────────────────────────────────────────────
export type GtdStatus = "inbox" | "next" | "waiting" | "someday";

// Режимы отображения и группировки
export type ViewMode = "list" | "calendar" | "matrix";
export type GroupBy = "none" | "project" | "date" | "difficulty" | "gtdStatus" | "context";

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
  parentId: string | null;
  recurrence: RecurrenceRule | null;
  urgent: boolean;
  important: boolean;
  gtdStatus: GtdStatus;
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
  projectId: string;
  recurrenceFreq: RecurrenceFreq | "none";
  recurrenceInterval: number;
  urgent: boolean;
  important: boolean;
  gtdStatus: GtdStatus;
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

// Варианты повтора для селекта в форме задачи.
export const RECURRENCE_OPTIONS: { label: string; value: RecurrenceFreq | "none" }[] = [
  { label: "Без повтора", value: "none" },
  { label: "Ежедневно", value: "daily" },
  { label: "Еженедельно", value: "weekly" },
  { label: "Ежемесячно", value: "monthly" },
];

// GTD-статусы: метки и оформление бейджей.
export const GTD_OPTIONS: { label: string; value: GtdStatus }[] = [
  { label: "Входящие", value: "inbox" },
  { label: "Следующее действие", value: "next" },
  { label: "Ожидание", value: "waiting" },
  { label: "Когда-нибудь", value: "someday" },
];

export const GTD_CONFIG: Record<GtdStatus, { label: string; icon: string; color: string; bg: string }> = {
  inbox: { label: "Входящие", icon: "📥", color: "#6366f1", bg: "#eef2ff" },
  next: { label: "Следующее", icon: "➡️", color: "#3b82f6", bg: "#eff6ff" },
  waiting: { label: "Ожидание", icon: "⏳", color: "#f59e0b", bg: "#fffbeb" },
  someday: { label: "Когда-нибудь", icon: "💭", color: "#64748b", bg: "#f1f5f9" },
};

// Квадранты матрицы Эйзенхауэра.
export interface QuadrantConfig {
  key: string;
  title: string;
  subtitle: string;
  urgent: boolean;
  important: boolean;
  color: string;
  bg: string;
}

export const EISENHOWER_QUADRANTS: QuadrantConfig[] = [
  { key: "do", title: "Сделать", subtitle: "Важно и срочно", urgent: true, important: true, color: "#ef4444", bg: "#fef2f2" },
  { key: "plan", title: "Запланировать", subtitle: "Важно, не срочно", urgent: false, important: true, color: "#3b82f6", bg: "#eff6ff" },
  { key: "delegate", title: "Делегировать", subtitle: "Срочно, не важно", urgent: true, important: false, color: "#f59e0b", bg: "#fffbeb" },
  { key: "drop", title: "Удалить / потом", subtitle: "Не важно, не срочно", urgent: false, important: false, color: "#64748b", bg: "#f1f5f9" },
];
