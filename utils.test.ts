import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getStatus,
  fmt,
  fmtTime,
  nextDueDate,
  buildTaskTree,
  getDescendantIds,
  getContexts,
} from "./utils";
import { Task } from "./types";

const baseTask: Task = {
  id: "1",
  title: "Test",
  desc: "",
  dueDate: "",
  reminder: 30,
  projectId: "default-work",
  difficulty: "medium",
  estH: 0,
  estM: 30,
  tags: [],
  completed: false,
  notified: false,
  parentId: null,
  recurrence: null,
  urgent: false,
  important: false,
  gtdStatus: "inbox",
};

describe("getStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:00:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("возвращает 'completed' для выполненной задачи", () => {
    expect(getStatus({ ...baseTask, completed: true })).toBe("completed");
  });

  it("возвращает 'upcoming' для задачи без дедлайна", () => {
    expect(getStatus({ ...baseTask, dueDate: "" })).toBe("upcoming");
  });

  it("возвращает 'overdue' для просроченной задачи", () => {
    expect(getStatus({ ...baseTask, dueDate: "2026-06-25T11:00:00" })).toBe("overdue");
  });

  it("возвращает 'urgent' для задачи в пределах часа", () => {
    expect(getStatus({ ...baseTask, dueDate: "2026-06-25T12:30:00" })).toBe("urgent");
  });

  it("возвращает 'upcoming' для задачи более чем через час", () => {
    expect(getStatus({ ...baseTask, dueDate: "2026-06-25T14:00:00" })).toBe("upcoming");
  });

  it("'completed' имеет приоритет над просрочкой", () => {
    expect(
      getStatus({ ...baseTask, completed: true, dueDate: "2026-06-25T11:00:00" })
    ).toBe("completed");
  });
});

describe("fmt", () => {
  it("возвращает заглушку для пустой даты", () => {
    expect(fmt("")).toBe("Без дедлайна");
  });

  it("форматирует дату в ru-RU", () => {
    const result = fmt("2026-06-25T14:30:00");
    expect(result).toContain("25");
    expect(result).toContain("06");
    expect(result).toContain("2026");
  });
});

describe("fmtTime", () => {
  it("форматирует часы и минуты", () => {
    expect(fmtTime(2, 30)).toBe("2 ч 30 мин");
  });

  it("только часы", () => {
    expect(fmtTime(1, 0)).toBe("1 ч");
  });

  it("только минуты", () => {
    expect(fmtTime(0, 45)).toBe("45 мин");
  });

  it("возвращает '—' при нулевых значениях", () => {
    expect(fmtTime(0, 0)).toBe("—");
  });
});

describe("nextDueDate", () => {
  it("ежедневно сдвигает на N дней", () => {
    expect(nextDueDate("2026-06-25T12:00", { freq: "daily", interval: 1 })).toBe(
      "2026-06-26T12:00"
    );
    expect(nextDueDate("2026-06-25T12:00", { freq: "daily", interval: 3 })).toBe(
      "2026-06-28T12:00"
    );
  });

  it("еженедельно сдвигает на 7*N дней", () => {
    expect(nextDueDate("2026-06-25T09:30", { freq: "weekly", interval: 1 })).toBe(
      "2026-07-02T09:30"
    );
  });

  it("ежемесячно сдвигает на N месяцев", () => {
    expect(nextDueDate("2026-01-15T08:00", { freq: "monthly", interval: 2 })).toBe(
      "2026-03-15T08:00"
    );
  });

  it("пустую дату возвращает без изменений", () => {
    expect(nextDueDate("", { freq: "daily", interval: 1 })).toBe("");
  });
});

describe("buildTaskTree / getDescendantIds", () => {
  const make = (id: string, parentId: string | null): Task => ({
    ...baseTask,
    id,
    parentId,
  });
  const flat = [
    make("a", null),
    make("b", "a"),
    make("c", "b"),
    make("d", null),
  ];

  it("строит дерево из плоского списка", () => {
    const roots = buildTaskTree(flat);
    expect(roots.map((r) => r.id).sort()).toEqual(["a", "d"]);
    const a = roots.find((r) => r.id === "a")!;
    expect(a.children.map((c) => c.id)).toEqual(["b"]);
    expect(a.children[0].children.map((c) => c.id)).toEqual(["c"]);
  });

  it("находит всех потомков", () => {
    expect(getDescendantIds(flat, "a").sort()).toEqual(["b", "c"]);
    expect(getDescendantIds(flat, "d")).toEqual([]);
  });
});

describe("getContexts", () => {
  it("выбирает только теги, начинающиеся с @", () => {
    expect(getContexts({ ...baseTask, tags: ["@дом", "работа", "@звонки"] })).toEqual([
      "@дом",
      "@звонки",
    ]);
  });
});
