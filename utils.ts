import {
  Task,
  StatusKey,
  TimeBucket,
  RecurrenceRule,
  GroupBy,
  Project,
  DIFFICULTY,
  GTD_CONFIG,
} from "./types";

export function getStatus(task: Task): StatusKey {
  if (task.completed) return "completed";
  if (!task.dueDate) return "upcoming";
  const diff = (new Date(task.dueDate).getTime() - new Date().getTime()) / 60000;
  if (diff < 0) return "overdue";
  if (diff <= 60) return "urgent";
  return "upcoming";
}

// Временная корзина задачи (ось «когда»): просрочено / сегодня / предстоит / выполнено.
// Без даты — «предстоит».
export function getTimeBucket(task: Task): TimeBucket {
  if (task.completed) return "completed";
  if (!task.dueDate) return "upcoming";
  const due = new Date(task.dueDate);
  if (isNaN(due.getTime())) return "upcoming";
  const now = new Date();
  if (due.getTime() < now.getTime()) return "overdue";
  const startTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (due.getTime() < startTomorrow.getTime()) return "today";
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

// ─── Дата/время в формате input "YYYY-MM-DDTHH:mm" (локальное время) ──────────
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateTimeInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Дата в формате input[type=date] "YYYY-MM-DD".
export function dateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Быстрые даты для чипов в форме задачи.
export type QuickDateKind = "today" | "tomorrow" | "weekend" | "week";
export function quickDate(kind: QuickDateKind): string {
  const d = new Date();
  if (kind === "tomorrow") d.setDate(d.getDate() + 1);
  else if (kind === "week") d.setDate(d.getDate() + 7);
  else if (kind === "weekend") {
    // Ближайшая суббота (если сегодня суббота — сегодня).
    const daysUntilSat = (6 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + daysUntilSat);
  }
  return dateInput(d);
}

// ─── Повтор: дата следующего экземпляра ───────────────────────────────────────
export function nextDueDate(dueDate: string, rule: RecurrenceRule): string {
  if (!dueDate) return dueDate;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return dueDate;
  const n = Math.max(1, rule.interval || 1);
  if (rule.freq === "daily") d.setDate(d.getDate() + n);
  else if (rule.freq === "weekly") d.setDate(d.getDate() + 7 * n);
  else if (rule.freq === "monthly") d.setMonth(d.getMonth() + n);
  return toDateTimeInput(d);
}

// ─── Дерево подзадач ──────────────────────────────────────────────────────────
export interface TaskNode extends Task {
  children: TaskNode[];
}

// Преобразует плоский список в лес узлов. Задача, чей parentId не найден в
// переданном наборе, считается корневой (например, родитель отфильтрован).
export function buildTaskTree(tasks: Task[]): TaskNode[] {
  const byId = new Map<string, TaskNode>();
  tasks.forEach((t) => byId.set(t.id, { ...t, children: [] }));
  const roots: TaskNode[] = [];
  byId.forEach((node) => {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  return roots;
}

// Сортировка соседей: сначала ручной порядок (order), затем дедлайн.
export function compareByOrder(a: Task, b: Task): number {
  if (a.order !== b.order) return a.order - b.order;
  if (!a.dueDate && !b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
}

// Рекурсивно сортирует дерево узлов по compareByOrder (на месте, возвращает его же).
export function sortTaskTree(nodes: TaskNode[]): TaskNode[] {
  nodes.sort(compareByOrder);
  nodes.forEach((n) => sortTaskTree(n.children));
  return nodes;
}

// Все потомки задачи (id) во всём плоском наборе — для каскадного удаления/переноса.
export function getDescendantIds(tasks: Task[], rootId: string): string[] {
  const childrenMap = new Map<string, string[]>();
  tasks.forEach((t) => {
    if (t.parentId) {
      const arr = childrenMap.get(t.parentId) || [];
      arr.push(t.id);
      childrenMap.set(t.parentId, arr);
    }
  });
  const result: string[] = [];
  const stack = [...(childrenMap.get(rootId) || [])];
  while (stack.length) {
    const id = stack.pop()!;
    result.push(id);
    stack.push(...(childrenMap.get(id) || []));
  }
  return result;
}

// Узел подходит, если сам удовлетворяет предикату ИЛИ любой его потомок.
export function nodeMatchesPredicate(
  node: TaskNode,
  predicate: (t: Task) => boolean
): boolean {
  if (predicate(node)) return true;
  return node.children.some((c) => nodeMatchesPredicate(c, predicate));
}

// ─── Контексты GTD (теги, начинающиеся с @) ──────────────────────────────────
export function isContext(tag: string): boolean {
  return tag.startsWith("@");
}

export function getContexts(task: Task): string[] {
  return (task.tags || []).filter(isContext);
}

// ─── Группировка верхнего уровня списка ──────────────────────────────────────
export interface TaskGroup {
  key: string;
  label: string;
  color?: string;
  nodes: TaskNode[];
}

export function dateBucket(dueDate: string): { key: string; label: string; order: number } {
  if (!dueDate) return { key: "nodate", label: "Без даты", order: 5 };
  const now = new Date();
  const due = new Date(dueDate);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - startOfToday.getTime()) / 86400000);
  if (diffDays < 0) return { key: "overdue", label: "Просрочено", order: 0 };
  if (diffDays === 0) return { key: "today", label: "Сегодня", order: 1 };
  if (diffDays === 1) return { key: "tomorrow", label: "Завтра", order: 2 };
  if (diffDays <= 7) return { key: "week", label: "На этой неделе", order: 3 };
  return { key: "later", label: "Позже", order: 4 };
}

export function groupTasks(
  nodes: TaskNode[],
  groupBy: GroupBy,
  projects: Project[]
): TaskGroup[] {
  if (groupBy === "none") return [{ key: "all", label: "", nodes }];

  const groups = new Map<string, TaskGroup & { order: number }>();
  const push = (key: string, label: string, order: number, node: TaskNode, color?: string) => {
    const g = groups.get(key);
    if (g) g.nodes.push(node);
    else groups.set(key, { key, label, color, nodes: [node], order });
  };

  nodes.forEach((node) => {
    if (groupBy === "project") {
      const p = projects.find((x) => x.id === node.projectId);
      push(node.projectId, p?.name || "Без проекта", 0, node, p?.color);
    } else if (groupBy === "difficulty") {
      const order = { hard: 0, medium: 1, easy: 2 }[node.difficulty] ?? 3;
      const cfg = DIFFICULTY[node.difficulty];
      push(node.difficulty, cfg?.label || node.difficulty, order, node, cfg?.color);
    } else if (groupBy === "gtdStatus") {
      const cfg = GTD_CONFIG[node.gtdStatus];
      const order = { inbox: 0, next: 1, waiting: 2, someday: 3 }[node.gtdStatus] ?? 4;
      push(node.gtdStatus, cfg?.label || node.gtdStatus, order, node, cfg?.color);
    } else if (groupBy === "date") {
      const b = dateBucket(node.dueDate);
      push(b.key, b.label, b.order, node);
    } else if (groupBy === "context") {
      const ctxs = getContexts(node);
      if (ctxs.length === 0) push("__nocontext__", "Без контекста", 99, node);
      else ctxs.forEach((c) => push(c, c, 1, node, "#6366f1"));
    }
  });

  return Array.from(groups.values()).sort(
    (a, b) => a.order - b.order || a.label.localeCompare(b.label, "ru")
  );
}

export const inp = (extra: any = {}) => ({
  style: {
    padding: "10px 14px",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    background: "var(--surface)",
    color: "var(--text)",
    ...extra.style,
  },
  ...extra,
});


