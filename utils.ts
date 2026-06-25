import { Task, StatusKey } from "./types";

export function getStatus(task: Task): StatusKey {
  if (task.completed) return "completed";
  if (!task.dueDate) return "upcoming";
  const diff = (new Date(task.dueDate).getTime() - new Date().getTime()) / 60000;
  if (diff < 0) return "overdue";
  if (diff <= 60) return "urgent";
  return "upcoming";
}

export function fmt(dateStr: string): string {
  if (!dateStr) return "Без дедлайна";
  return new Date(dateStr).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtTime(h: number, m: number): string {
  const parts = [];
  if (h > 0) parts.push(`${h} ч`);
  if (m > 0) parts.push(`${m} мин`);
  return parts.join(" ") || "—";
}

export const inp = (extra: any = {}) => ({
  style: {
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    ...extra.style,
  },
  ...extra,
});


