import { useState } from "react";
import {
  DifficultyKey,
  DIFFICULTY,
  REMINDER_OPTIONS,
  RECURRENCE_OPTIONS,
  GTD_OPTIONS,
  NewTaskState,
  Task,
  Project,
  RecurrenceRule,
  GtdStatus,
} from "../types";
import { inp } from "../utils";
import { useModal } from "../lib/useModal";
import { TaskTemplate, applyTemplate } from "../templates";

export interface TaskFormData {
  title: string;
  desc: string;
  date: string;
  time: string;
  reminder: number;
  difficulty: DifficultyKey;
  estH: number;
  estM: number;
  tags: string[];
  projectId: string;
  recurrence: RecurrenceRule | null;
  urgent: boolean;
  important: boolean;
  gtdStatus: GtdStatus;
}

interface TaskModalProps {
  onClose: () => void;
  onAddTask: (taskData: TaskFormData) => void;
  projColor: string | undefined;
  taskToEdit?: Task;
  projects: Project[];
  defaultProjectId: string;
  parentTask?: Task;
  templates: TaskTemplate[];
  onSaveTemplate: (tpl: TaskTemplate) => void;
  initialTemplate?: TaskTemplate;
}

export default function TaskModal({
  onClose,
  onAddTask,
  projColor,
  taskToEdit,
  projects,
  defaultProjectId,
  parentTask,
  templates,
  onSaveTemplate,
  initialTemplate,
}: TaskModalProps) {
  const [form, setForm] = useState<NewTaskState>(() => {
    const base: NewTaskState = {
      title: "",
      desc: "",
      date: "",
      time: "",
      reminder: 30,
      difficulty: "medium",
      estH: 0,
      estM: 30,
      tags: [],
      tagInput: "",
      projectId: parentTask ? parentTask.projectId : defaultProjectId,
      recurrenceFreq: "none",
      recurrenceInterval: 1,
      urgent: false,
      important: false,
      gtdStatus: parentTask ? "next" : "inbox",
    };
    if (taskToEdit) {
      const [date, time] = taskToEdit.dueDate.split("T");
      return {
        ...base,
        title: taskToEdit.title,
        desc: taskToEdit.desc || "",
        date: date || "",
        time: time || "",
        reminder: taskToEdit.reminder ?? 30,
        difficulty: taskToEdit.difficulty || "medium",
        estH: taskToEdit.estH || 0,
        estM: taskToEdit.estM || 0,
        tags: taskToEdit.tags || [],
        projectId: taskToEdit.projectId || defaultProjectId,
        recurrenceFreq: taskToEdit.recurrence?.freq || "none",
        recurrenceInterval: taskToEdit.recurrence?.interval || 1,
        urgent: !!taskToEdit.urgent,
        important: !!taskToEdit.important,
        gtdStatus: taskToEdit.gtdStatus || "inbox",
      };
    }
    if (initialTemplate) return applyTemplate(base, initialTemplate);
    return base;
  });
  const [error, setError] = useState<string>("");
  const { firstFieldRef, backdropProps } = useModal<HTMLInputElement>(onClose);

  const addTaskTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && form.tagInput.trim()) {
      e.preventDefault();
      const tag = form.tagInput.trim().replace(/,/g, "");
      if (tag && !form.tags.includes(tag)) {
        setForm((p) => ({ ...p, tags: [...p.tags, tag], tagInput: "" }));
      } else {
        setForm((p) => ({ ...p, tagInput: "" }));
      }
    }
  };

  const removeTag = (tag: string) => {
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = () => {
    if (!form.title) return;
    if (form.recurrenceFreq !== "none" && !form.date) {
      setError("Для повтора нужно указать дату дедлайна.");
      return;
    }
    onAddTask({
      title: form.title,
      desc: form.desc,
      date: form.date,
      time: form.time,
      reminder: form.reminder,
      difficulty: form.difficulty,
      estH: form.estH,
      estM: form.estM,
      tags: form.tags,
      projectId: form.projectId,
      recurrence:
        form.recurrenceFreq === "none"
          ? null
          : { freq: form.recurrenceFreq, interval: Math.max(1, form.recurrenceInterval || 1) },
      urgent: form.urgent,
      important: form.important,
      gtdStatus: form.gtdStatus,
    });
  };

  const applyTpl = (tpl: TaskTemplate) => setForm((f) => applyTemplate(f, tpl));

  const saveAsTemplate = () => {
    const name = window.prompt("Название шаблона:");
    if (!name || !name.trim()) return;
    onSaveTemplate({
      id: `tpl-user-${Date.now()}`,
      name: name.trim(),
      icon: "⭐",
      difficulty: form.difficulty,
      estH: form.estH,
      estM: form.estM,
      tags: [...form.tags],
      reminder: form.reminder,
      urgent: form.urgent,
      important: form.important,
      gtdStatus: form.gtdStatus,
      recurrenceFreq: form.recurrenceFreq,
      recurrenceInterval: form.recurrenceInterval,
    });
  };

  const onKeyDownModal = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const workProjects = projects.filter((p) => p.scope === "work");
  const personalProjects = projects.filter((p) => p.scope === "personal");
  const parentProj = parentTask
    ? projects.find((p) => p.id === parentTask.projectId)
    : undefined;

  const flagBtn = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1,
    padding: "8px",
    border: `2px solid ${active ? color : "#e2e8f0"}`,
    borderRadius: 8,
    cursor: "pointer",
    background: active ? `${color}15` : "white",
    color: active ? color : "#64748b",
    fontWeight: 600,
    fontSize: 13,
    transition: "all .15s",
  });

  return (
    <div
      {...backdropProps}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onKeyDown={onKeyDownModal}
        style={{
          background: "white",
          borderRadius: 16,
          padding: 28,
          width: 500,
          maxWidth: "100%",
          boxSizing: "border-box",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: "#1e293b", flex: 1 }}>
            {taskToEdit
              ? "Редактирование задачи"
              : parentTask
              ? "Новая подзадача"
              : "Новая задача"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#94a3b8",
            }}
          >
            ×
          </button>
        </div>

        {parentTask && (
          <div
            style={{
              fontSize: 12.5,
              color: "#64748b",
              background: "#f8fafc",
              borderRadius: 8,
              padding: "8px 10px",
              marginBottom: 14,
            }}
          >
            Подзадача для: <b style={{ color: "#334155" }}>{parentTask.title}</b>
            {parentProj ? ` · ${parentProj.name}` : ""}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            {...inp()}
            ref={firstFieldRef}
            placeholder="Название задачи *"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <textarea
            {...inp({ style: { resize: "vertical" as const } })}
            placeholder="Описание (необязательно)"
            rows={2}
            value={form.desc}
            onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
          />

          {/* Шаблоны — предзаполняют поля формы */}
          {templates.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Шаблоны</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTpl(tpl)}
                    style={{
                      padding: "5px 10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 99,
                      background: "#f8fafc",
                      cursor: "pointer",
                      fontSize: 12.5,
                      color: "#475569",
                    }}
                  >
                    {tpl.icon || "📄"} {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Проект (перемещение между проектами/пространствами) */}
          {!parentTask && (
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>Проект</div>
              <select
                {...inp()}
                value={form.projectId}
                onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
              >
                <optgroup label="💼 Работа">
                  {workProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🏡 Личное">
                  {personalProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>
                Дата дедлайна (необязательно)
              </div>
              <input
                {...inp()}
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>
                Время (необязательно)
              </div>
              <input
                {...inp()}
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
              />
            </div>
          </div>

          {/* Повтор */}
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>Повтор</div>
            <div style={{ display: "flex", gap: 10 }}>
              <select
                {...inp({ style: { flex: 2 } })}
                value={form.recurrenceFreq}
                onChange={(e) =>
                  setForm((p) => ({ ...p, recurrenceFreq: e.target.value as any }))
                }
              >
                {RECURRENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {form.recurrenceFreq !== "none" && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>каждые</span>
                  <input
                    {...inp({ style: { width: 64 } })}
                    type="number"
                    min="1"
                    max="99"
                    value={form.recurrenceInterval}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        recurrenceInterval: Number(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Матрица Эйзенхауэра */}
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
              Приоритет (матрица Эйзенхауэра)
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setForm((p) => ({ ...p, urgent: !p.urgent }))}
                style={flagBtn(form.urgent, "#ef4444")}
              >
                🔥 Срочная
              </button>
              <button
                onClick={() => setForm((p) => ({ ...p, important: !p.important }))}
                style={flagBtn(form.important, "#3b82f6")}
              >
                ⭐ Важная
              </button>
            </div>
          </div>

          {/* GTD-статус */}
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>Статус GTD</div>
            <select
              {...inp()}
              value={form.gtdStatus}
              onChange={(e) =>
                setForm((p) => ({ ...p, gtdStatus: e.target.value as GtdStatus }))
              }
            >
              {GTD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Сложность</div>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(DIFFICULTY).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() =>
                    setForm((p) => ({ ...p, difficulty: key as DifficultyKey }))
                  }
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: `2px solid ${
                      form.difficulty === key ? cfg.color : "#e2e8f0"
                    }`,
                    borderRadius: 8,
                    cursor: "pointer",
                    background: form.difficulty === key ? cfg.bg : "white",
                    color: form.difficulty === key ? cfg.color : "#64748b",
                    fontWeight: 600,
                    fontSize: 13,
                    transition: "all .15s",
                  }}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time estimate */}
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
              Сколько времени потребуется
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Часы</div>
                <input
                  {...inp()}
                  type="number"
                  min="0"
                  max="99"
                  placeholder="0"
                  value={form.estH || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, estH: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Минуты</div>
                <input
                  {...inp()}
                  type="number"
                  min="0"
                  max="59"
                  placeholder="30"
                  value={form.estM || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, estM: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Tags / контексты (@) */}
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
              Теги и контексты (@дом, @звонки…)
            </div>
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "8px 10px",
                minHeight: 42,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: form.tags.length > 0 ? 8 : 0,
                }}
              >
                {form.tags.map((tag) => {
                  const isCtx = tag.startsWith("@");
                  return (
                    <span
                      key={tag}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 10px",
                        background: isCtx ? "#eef2ff" : "#eff6ff",
                        borderRadius: 99,
                        fontSize: 12,
                        color: isCtx ? "#6366f1" : "#3b82f6",
                        fontWeight: 500,
                      }}
                    >
                      {isCtx ? tag : `#${tag}`}
                      <span
                        onClick={() => removeTag(tag)}
                        style={{ cursor: "pointer", color: "#93c5fd", fontSize: 14, lineHeight: 1 }}
                      >
                        ×
                      </span>
                    </span>
                  );
                })}
              </div>
              <input
                placeholder="Введите тег и нажмите Enter"
                value={form.tagInput}
                onChange={(e) => setForm((p) => ({ ...p, tagInput: e.target.value }))}
                onKeyDown={addTaskTag}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  width: "100%",
                  background: "transparent",
                  color: "#334155",
                }}
              />
            </div>
          </div>

          {/* Reminder */}
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>Напомнить</div>
            <select
              {...inp()}
              value={form.reminder}
              onChange={(e) => setForm((p) => ({ ...p, reminder: Number(e.target.value) }))}
            >
              {REMINDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: "#ef4444" }}>{error}</div>
        )}

        <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
          <button
            onClick={saveAsTemplate}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12.5,
              color: "#6366f1",
              padding: 0,
            }}
          >
            ＋ Сохранить как шаблон
          </button>
          <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#cbd5e1" }}>
            ⌘/Ctrl + Enter — сохранить
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              background: "#f1f5f9",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 2,
              padding: "10px",
              background: projColor || "#6366f1",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {taskToEdit ? "Сохранить изменения" : "Создать задачу"}
          </button>
        </div>
      </div>
    </div>
  );
}
