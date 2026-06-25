
import { Task, Project, STATUS_CONFIG, DIFFICULTY } from "../types";
import { getStatus, fmt, fmtTime } from "../utils";

interface TaskItemProps {
  task: Task;
  projects: Project[];
  isAllView: boolean;
  onToggleCompleted: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onStartPomodoro: (task: Task) => void;
  isFocusing: boolean;
}

export default function TaskItem({
  task,
  projects,
  isAllView,
  onToggleCompleted,
  onDelete,
  onEdit,
  onStartPomodoro,
  isFocusing,
}: TaskItemProps) {
  const st = getStatus(task);
  const cfg = STATUS_CONFIG[st];
  const diff = DIFFICULTY[task.difficulty] || DIFFICULTY.medium;
  const taskProj = projects.find((p) => p.id === task.projectId);

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: "14px 18px",
        boxShadow: isFocusing
          ? "0 0 0 2px #ef4444, 0 4px 12px rgba(239, 68, 68, 0.15)"
          : "0 1px 4px rgba(0,0,0,0.07)",
        borderLeft: `4px solid ${cfg.color}`,
        opacity: task.completed ? 0.7 : 1,
        transition: "all 0.3s ease-in-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleCompleted(task.id)}
          style={{
            marginTop: 3,
            width: 16,
            height: 16,
            cursor: "pointer",
            accentColor: taskProj?.color || "#6366f1",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 600,
                color: "#1e293b",
                textDecoration: task.completed ? "line-through" : "none",
              }}
            >
              {task.title}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 20,
                background: cfg.bg,
                color: cfg.color,
                fontWeight: 600,
              }}
            >
              {cfg.label}
            </span>
            {task.pomodoros && task.pomodoros > 0 ? (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: "#fef2f2",
                  color: "#ef4444",
                  fontWeight: 600,
                  border: "1px solid #ef444430",
                }}
                title={`Выполнено помидоров: ${task.pomodoros}`}
              >
                🍅 {task.pomodoros}
              </span>
            ) : null}
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 20,
                background: diff.bg,
                color: diff.color,
                fontWeight: 600,
              }}
            >
              {diff.label}
            </span>
            {isAllView && taskProj && (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: "#f8fafc",
                  color: taskProj.color,
                  fontWeight: 600,
                  border: `1px solid ${taskProj.color}30`,
                }}
              >
                {taskProj.name}
              </span>
            )}
          </div>
          {task.desc && (
            <p
              style={{
                margin: "5px 0 0",
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              {task.desc}
            </p>
          )}
          {task.tags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: "#f1f5f9",
                    color: "#475569",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div
            style={{
              marginTop: 8,
              display: "flex",
              gap: 14,
              fontSize: 12,
              color: "#94a3b8",
              flexWrap: "wrap",
            }}
          >
            <span>⏰ {fmt(task.dueDate)}</span>
            <span>
              🔔 за{" "}
              {task.reminder >= 60
                ? `${task.reminder / 60} ч`
                : `${task.reminder} мин`}
            </span>
            {(task.estH > 0 || task.estM > 0) && (
              <span>🕐 {fmtTime(task.estH, task.estM)}</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {!task.completed && (
            <button
              onClick={() => onStartPomodoro(task)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isFocusing ? "#ef4444" : "#cbd5e1",
                fontSize: 14,
                lineHeight: 1,
                padding: "4px",
                borderRadius: "4px",
                transition: "all 0.15s",
              }}
              title="Запустить фокусировку Помодоро"
            >
              🍅
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#cbd5e1",
              fontSize: 14,
              lineHeight: 1,
              padding: "4px",
              borderRadius: "4px",
              transition: "all 0.15s",
            }}
            title="Редактировать"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#cbd5e1",
              fontSize: 20,
              lineHeight: 1,
              padding: "0 2px",
            }}
            title="Удалить"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
