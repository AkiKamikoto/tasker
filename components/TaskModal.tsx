import { useState } from "react";
import { DifficultyKey, DIFFICULTY, REMINDER_OPTIONS, NewTaskState, Task } from "../types";
import { inp } from "../utils";
import { useModal } from "../lib/useModal";

interface TaskModalProps {
  onClose: () => void;
  onAddTask: (taskData: {
    title: string;
    desc: string;
    date: string;
    time: string;
    reminder: number;
    difficulty: DifficultyKey;
    estH: number;
    estM: number;
    tags: string[];
  }) => void;
  projColor: string | undefined;
  taskToEdit?: Task;
}

const EMPTY_TASK: NewTaskState = {
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
};

export default function TaskModal({
  onClose,
  onAddTask,
  projColor,
  taskToEdit,
}: TaskModalProps) {
  const [form, setForm] = useState<NewTaskState>(() => {
    if (taskToEdit) {
      const [date, time] = taskToEdit.dueDate.split("T");
      return {
        title: taskToEdit.title,
        desc: taskToEdit.desc || "",
        date: date || "",
        time: time || "",
        reminder: taskToEdit.reminder ?? 30,
        difficulty: taskToEdit.difficulty || "medium",
        estH: taskToEdit.estH || 0,
        estM: taskToEdit.estM || 0,
        tags: taskToEdit.tags || [],
        tagInput: "",
      };
    }
    return EMPTY_TASK;
  });
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
    });
    setForm(EMPTY_TASK);
  };

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
            {taskToEdit ? "Редактирование задачи" : "Новая задача"}
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

          {/* Difficulty */}
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
              Сложность
            </div>
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
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
                  Часы
                </div>
                <input
                  {...inp()}
                  type="number"
                  min="0"
                  max="99"
                  placeholder="0"
                  value={form.estH || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      estH: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
                  Минуты
                </div>
                <input
                  {...inp()}
                  type="number"
                  min="0"
                  max="59"
                  placeholder="30"
                  value={form.estM || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      estM: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
              Теги
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
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 10px",
                      background: "#eff6ff",
                      borderRadius: 99,
                      fontSize: 12,
                      color: "#3b82f6",
                      fontWeight: 500,
                    }}
                  >
                    #{tag}
                    <span
                      onClick={() => removeTag(tag)}
                      style={{ cursor: "pointer", color: "#93c5fd", fontSize: 14, lineHeight: 1 }}
                    >
                      ×
                    </span>
                  </span>
                ))}
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
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>
              Напомнить
            </div>
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

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
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
