import { useState } from "react";
import { Task, Project } from "../types";
import { inp } from "../utils";
import { useModal } from "../lib/useModal";

interface TaskSelectModalProps {
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  onSelectTask: (task: Task | null) => void;
  currentTaskId: string | null;
}

export default function TaskSelectModal({
  onClose,
  tasks,
  projects,
  onSelectTask,
  currentTaskId,
}: TaskSelectModalProps) {
  const [search, setSearch] = useState("");
  const { firstFieldRef, backdropProps } = useModal<HTMLInputElement>(onClose);

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      {...backdropProps}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100, // higher than normal modal to overlap task creation
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: 24,
          width: 400,
          maxWidth: "100%",
          boxSizing: "border-box",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "var(--text)", flex: 1 }}>
            Выберите задачу для фокуса 🍅
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "var(--text-faint)",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Search Input */}
        <input
          {...inp({ style: { marginBottom: 14 } })}
          ref={firstFieldRef}
          placeholder="Поиск задачи..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Task List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* General Timer Option (No Task) */}
          <div
            onClick={() => onSelectTask(null)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--text-muted)",
              background: currentTaskId === null ? "var(--surface-3)" : "transparent",
              transition: "all 0.15s",
              textAlign: "center",
            }}
          >
            ⏱️ Просто запустить таймер (без привязки)
          </div>

          <div style={{ borderBottom: "1px solid #f1f5f9", margin: "6px 0" }} />

          {filteredTasks.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>
              Задачи не найдены
            </div>
          ) : (
            filteredTasks.map((task) => {
              const proj = projects.find((p) => p.id === task.projectId);
              const isActive = currentTaskId === task.id;

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: `1px solid ${isActive ? "#ef4444" : "var(--border)"}`,
                    background: isActive ? "var(--surface-2)" : "var(--surface)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "var(--text)",
                        flex: 1,
                      }}
                    >
                      {task.title}
                    </span>
                    {task.pomodoros && task.pomodoros > 0 ? (
                      <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
                        🍅 {task.pomodoros}
                      </span>
                    ) : null}
                  </div>

                  {proj && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: proj.color,
                        }}
                      />
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {proj.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
