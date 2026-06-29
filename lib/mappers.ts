import { Project, Task } from "../types";

// ─── DB mappers ───────────────────────────────────────────────────────────────
// Чистые функции преобразования между строками БД (snake_case) и моделями
// приложения (camelCase). Без побочных эффектов — удобно тестировать.

export function dbToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    desc: row.description,
    dueDate: row.due_date,
    reminder: row.reminder,
    projectId: row.project_id,
    difficulty: row.difficulty,
    estH: row.est_h,
    estM: row.est_m,
    tags: row.tags || [],
    completed: row.completed,
    notified: row.notified,
    pomodoros: row.pomodoros || 0,
    parentId: row.parent_id ?? null,
    recurrence: row.recurrence ?? null,
    urgent: !!row.urgent,
    important: !!row.important,
    gtdStatus: row.gtd_status ?? "inbox",
  };
}

export function dbToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    scope: row.scope as "work" | "personal",
  };
}

export function taskToDb(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.desc,
    due_date: task.dueDate,
    reminder: task.reminder,
    project_id: task.projectId,
    difficulty: task.difficulty,
    est_h: task.estH,
    est_m: task.estM,
    tags: task.tags,
    completed: task.completed,
    notified: task.notified,
    pomodoros: task.pomodoros || 0,
    parent_id: task.parentId ?? null,
    recurrence: task.recurrence ?? null,
    urgent: !!task.urgent,
    important: !!task.important,
    gtd_status: task.gtdStatus ?? "inbox",
  };
}

export function projectToDb(project: Project, userId: string) {
  return {
    id: project.id,
    user_id: userId,
    name: project.name,
    color: project.color,
    scope: project.scope,
  };
}
