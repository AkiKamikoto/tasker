import { DifficultyKey, GtdStatus, RecurrenceFreq, NewTaskState } from "./types";

// ─── Шаблоны задач ──────────────────────────────────────────────────────────────
// Шаблон предзаполняет поля формы (кроме названия/даты), чтобы создавать типовые
// задачи в один клик. Встроенные шаблоны + пользовательские (localStorage).

export interface TaskTemplate {
  id: string;
  name: string; // отображаемое имя шаблона
  icon?: string;
  titlePrefix?: string; // подставляется в название, если оно пустое
  difficulty: DifficultyKey;
  estH: number;
  estM: number;
  tags: string[];
  reminder: number;
  urgent: boolean;
  important: boolean;
  gtdStatus: GtdStatus;
  recurrenceFreq: RecurrenceFreq | "none";
  recurrenceInterval: number;
}

export const BUILT_IN_TEMPLATES: TaskTemplate[] = [
  {
    id: "tpl-quick",
    name: "Быстрая задача",
    icon: "⚡",
    difficulty: "easy",
    estH: 0,
    estM: 15,
    tags: [],
    reminder: 30,
    urgent: false,
    important: false,
    gtdStatus: "next",
    recurrenceFreq: "none",
    recurrenceInterval: 1,
  },
  {
    id: "tpl-call",
    name: "Звонок",
    icon: "📞",
    difficulty: "easy",
    estH: 0,
    estM: 15,
    tags: ["@звонки"],
    reminder: 10,
    urgent: true,
    important: false,
    gtdStatus: "next",
    recurrenceFreq: "none",
    recurrenceInterval: 1,
  },
  {
    id: "tpl-meeting",
    name: "Встреча",
    icon: "👥",
    difficulty: "medium",
    estH: 1,
    estM: 0,
    tags: ["@встречи"],
    reminder: 30,
    urgent: false,
    important: true,
    gtdStatus: "next",
    recurrenceFreq: "none",
    recurrenceInterval: 1,
  },
  {
    id: "tpl-deep",
    name: "Глубокая работа",
    icon: "🧠",
    difficulty: "hard",
    estH: 2,
    estM: 0,
    tags: [],
    reminder: 30,
    urgent: false,
    important: true,
    gtdStatus: "next",
    recurrenceFreq: "none",
    recurrenceInterval: 1,
  },
];

const LS_KEY = "tasker-templates-v1";

export function loadUserTemplates(): TaskTemplate[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(list: TaskTemplate[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
}

export function saveUserTemplate(tpl: TaskTemplate): TaskTemplate[] {
  const list = loadUserTemplates();
  const idx = list.findIndex((t) => t.id === tpl.id);
  if (idx >= 0) list[idx] = tpl;
  else list.push(tpl);
  persist(list);
  return list;
}

export function deleteUserTemplate(id: string): TaskTemplate[] {
  const list = loadUserTemplates().filter((t) => t.id !== id);
  persist(list);
  return list;
}

// Накладывает поля шаблона на состояние формы (название/дата/время не трогаем,
// если только в названии не пусто и у шаблона есть titlePrefix).
export function applyTemplate(form: NewTaskState, tpl: TaskTemplate): NewTaskState {
  return {
    ...form,
    title: form.title || tpl.titlePrefix || form.title,
    difficulty: tpl.difficulty,
    estH: tpl.estH,
    estM: tpl.estM,
    tags: [...tpl.tags],
    reminder: tpl.reminder,
    urgent: tpl.urgent,
    important: tpl.important,
    gtdStatus: tpl.gtdStatus,
    recurrenceFreq: tpl.recurrenceFreq,
    recurrenceInterval: tpl.recurrenceInterval,
  };
}
