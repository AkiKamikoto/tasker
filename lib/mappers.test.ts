import { describe, it, expect } from "vitest";
import { dbToTask, dbToProject, taskToDb, projectToDb } from "./mappers";
import { Task, Project } from "../types";

describe("dbToTask", () => {
  it("маппит строку БД (snake_case) в Task (camelCase)", () => {
    const row = {
      id: "t1",
      title: "Задача",
      description: "Описание",
      due_date: "2026-06-25T12:00:00",
      reminder: 30,
      project_id: "p1",
      difficulty: "hard",
      est_h: 1,
      est_m: 15,
      tags: ["a", "b"],
      completed: false,
      notified: true,
      pomodoros: 3,
      parent_id: "t0",
      recurrence: { freq: "weekly", interval: 1 },
      urgent: true,
      important: false,
      gtd_status: "next",
    };
    expect(dbToTask(row)).toEqual({
      id: "t1",
      title: "Задача",
      desc: "Описание",
      dueDate: "2026-06-25T12:00:00",
      reminder: 30,
      projectId: "p1",
      difficulty: "hard",
      estH: 1,
      estM: 15,
      tags: ["a", "b"],
      completed: false,
      notified: true,
      pomodoros: 3,
      parentId: "t0",
      recurrence: { freq: "weekly", interval: 1 },
      urgent: true,
      important: false,
      gtdStatus: "next",
    });
  });

  it("подставляет значения по умолчанию для tags и pomodoros", () => {
    const row = {
      id: "t2",
      title: "X",
      description: null,
      due_date: null,
      reminder: 10,
      project_id: "p1",
      difficulty: "easy",
      est_h: 0,
      est_m: 0,
      tags: null,
      completed: false,
      notified: false,
      pomodoros: null,
    };
    const task = dbToTask(row);
    expect(task.tags).toEqual([]);
    expect(task.pomodoros).toBe(0);
    expect(task.parentId).toBeNull();
    expect(task.recurrence).toBeNull();
    expect(task.urgent).toBe(false);
    expect(task.important).toBe(false);
    expect(task.gtdStatus).toBe("inbox");
  });
});

describe("taskToDb", () => {
  it("маппит Task в строку БД и проставляет user_id", () => {
    const task: Task = {
      id: "t1",
      title: "Задача",
      desc: "Описание",
      dueDate: "2026-06-25T12:00:00",
      reminder: 30,
      projectId: "p1",
      difficulty: "medium",
      estH: 2,
      estM: 0,
      tags: ["x"],
      completed: true,
      notified: false,
      pomodoros: 1,
      parentId: "t0",
      recurrence: { freq: "monthly", interval: 2 },
      urgent: false,
      important: true,
      gtdStatus: "waiting",
    };
    expect(taskToDb(task, "user-42")).toEqual({
      id: "t1",
      user_id: "user-42",
      title: "Задача",
      description: "Описание",
      due_date: "2026-06-25T12:00:00",
      reminder: 30,
      project_id: "p1",
      difficulty: "medium",
      est_h: 2,
      est_m: 0,
      tags: ["x"],
      completed: true,
      notified: false,
      pomodoros: 1,
      parent_id: "t0",
      recurrence: { freq: "monthly", interval: 2 },
      urgent: false,
      important: true,
      gtd_status: "waiting",
    });
  });

  it("дефолтит pomodoros в 0 если поле отсутствует", () => {
    const task = { id: "t", title: "", desc: "", dueDate: "", reminder: 30, projectId: "p", difficulty: "easy", estH: 0, estM: 0, tags: [], completed: false, notified: false, parentId: null, recurrence: null, urgent: false, important: false, gtdStatus: "inbox" } as Task;
    expect(taskToDb(task, "u").pomodoros).toBe(0);
  });
});

describe("project mappers", () => {
  it("dbToProject маппит строку в Project", () => {
    expect(
      dbToProject({ id: "p1", name: "Работа", color: "#fff", scope: "work" })
    ).toEqual({ id: "p1", name: "Работа", color: "#fff", scope: "work" });
  });

  it("projectToDb маппит Project и проставляет user_id", () => {
    const p: Project = { id: "p1", name: "Личное", color: "#000", scope: "personal" };
    expect(projectToDb(p, "u1")).toEqual({
      id: "p1",
      user_id: "u1",
      name: "Личное",
      color: "#000",
      scope: "personal",
    });
  });

  it("dbToProject ↔ projectToDb — round-trip сохраняет данные", () => {
    const p: Project = { id: "p9", name: "X", color: "#abc", scope: "work" };
    const row = projectToDb(p, "u");
    expect(dbToProject(row)).toEqual(p);
  });
});
