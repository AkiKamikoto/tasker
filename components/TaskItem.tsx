import { useState } from "react";
import { Project, TIME_CONFIG, DIFFICULTY, GTD_CONFIG } from "../types";
import { TaskNode, getTimeBucket, fmt, fmtTime } from "../utils";

interface TaskItemProps {
  node: TaskNode;
  projects: Project[];
  isAllView: boolean;
  depth: number;
  pomoTaskId: string | null;
  onToggleCompleted: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (node: TaskNode) => void;
  onStartPomodoro: (node: TaskNode) => void;
  onAddSubtask: (node: TaskNode) => void;
  onMove: (id: string, projectId: string) => void;
}

export default function TaskItem({
  node,
  projects,
  isAllView,
  depth,
  pomoTaskId,
  onToggleCompleted,
  onDelete,
  onEdit,
  onStartPomodoro,
  onAddSubtask,
  onMove,
}: TaskItemProps) {
  const task = node;
  const [expanded, setExpanded] = useState(true);
  const [showMove, setShowMove] = useState(false);

  const cfg = TIME_CONFIG[getTimeBucket(task)];
  const diff = DIFFICULTY[task.difficulty] || DIFFICULTY.medium;
  const taskProj = projects.find((p) => p.id === task.projectId);
  const isFocusing = pomoTaskId === task.id;

  const children = node.children || [];
  const hasChildren = children.length > 0;
  const doneCount = children.filter((c) => c.completed).length;

  const iconBtn = (color: string): React.CSSProperties => ({
    background: "none",
    border: "none",
    cursor: "pointer",
    color,
    fontSize: 14,
    lineHeight: 1,
    padding: "4px",
    borderRadius: "4px",
    transition: "all 0.15s",
  });

  const badge = (bg: string, color: string, text: string, title?: string) => (
    <span
      title={title}
      style={{
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 20,
        background: bg,
        color,
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );

  return (
    <div>
      <div
        className="tm-card"
        style={{
          position: "relative",
          background: "var(--surface)",
          borderRadius: 12,
          padding: "var(--card-pad)",
          marginLeft: depth * 22,
          boxShadow: isFocusing
            ? "0 0 0 2px #ef4444, 0 4px 12px rgba(239, 68, 68, 0.15)"
            : "var(--shadow-sm)",
          borderLeft: `4px solid ${cfg.color}`,
          opacity: task.completed ? 0.7 : 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {hasChildren ? (
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{
                ...iconBtn("#94a3b8"),
                marginTop: 1,
                width: 18,
                flexShrink: 0,
                transform: expanded ? "rotate(90deg)" : "none",
              }}
              title={expanded ? "Свернуть подзадачи" : "Развернуть подзадачи"}
            >
              ▶
            </button>
          ) : (
            <span style={{ width: 18, flexShrink: 0 }} />
          )}
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
                  color: "var(--text)",
                  textDecoration: task.completed ? "line-through" : "none",
                }}
              >
                {task.title}
              </span>
              {badge(cfg.bg, cfg.color, cfg.label)}
              {task.important && badge("#eff6ff", "#3b82f6", "⭐ Важная")}
              {task.urgent && badge("#fef2f2", "#ef4444", "🔥 Срочная")}
              {task.recurrence &&
                badge("#f0fdf4", "#10b981", "🔁", "Повторяющаяся задача")}
              {task.gtdStatus && task.gtdStatus !== "inbox" &&
                badge(
                  GTD_CONFIG[task.gtdStatus].bg,
                  GTD_CONFIG[task.gtdStatus].color,
                  `${GTD_CONFIG[task.gtdStatus].icon} ${GTD_CONFIG[task.gtdStatus].label}`
                )}
              {task.pomodoros && task.pomodoros > 0
                ? badge("#fef2f2", "#ef4444", `🍅 ${task.pomodoros}`, `Помидоров: ${task.pomodoros}`)
                : null}
              {badge(diff.bg, diff.color, diff.label)}
              {hasChildren &&
                badge("var(--surface-2)", "var(--text-muted)", `✓ ${doneCount}/${children.length}`, "Прогресс подзадач")}
              {isAllView && taskProj && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: "var(--surface-2)",
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
              <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {task.desc}
              </p>
            )}
            {task.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                {task.tags.map((tag) => {
                  const isCtx = tag.startsWith("@");
                  return (
                    <span
                      key={tag}
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: "var(--surface-2)",
                        color: isCtx ? "var(--accent)" : "var(--text-muted)",
                        fontWeight: isCtx ? 600 : 400,
                      }}
                    >
                      {isCtx ? tag : `#${tag}`}
                    </span>
                  );
                })}
              </div>
            )}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 14,
                fontSize: 12,
                color: "var(--text-faint)",
                flexWrap: "wrap",
              }}
            >
              <span>⏰ {fmt(task.dueDate)}</span>
              <span>
                🔔 за {task.reminder >= 60 ? `${task.reminder / 60} ч` : `${task.reminder} мин`}
              </span>
              {(task.estH > 0 || task.estM > 0) && <span>🕐 {fmtTime(task.estH, task.estM)}</span>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button onClick={() => onAddSubtask(node)} style={iconBtn("var(--text-faint)")} title="Добавить подзадачу">
              ＋
            </button>
            <button onClick={() => setShowMove((s) => !s)} style={iconBtn("var(--text-faint)")} title="Переместить в проект">
              ⇄
            </button>
            {!task.completed && (
              <button
                onClick={() => onStartPomodoro(node)}
                style={iconBtn(isFocusing ? "#ef4444" : "var(--text-faint)")}
                title="Запустить фокусировку Помодоро"
              >
                🍅
              </button>
            )}
            <button onClick={() => onEdit(node)} style={iconBtn("var(--text-faint)")} title="Редактировать">
              ✏️
            </button>
            <button
              onClick={() => onDelete(task.id)}
              style={{ ...iconBtn("var(--text-faint)"), fontSize: 20, padding: "0 2px" }}
              title="Удалить"
            >
              ×
            </button>
          </div>
        </div>

        {showMove && (
          <div
            style={{
              position: "absolute",
              right: 14,
              top: 46,
              zIndex: 20,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              boxShadow: "var(--shadow-lg)",
              padding: 6,
              maxHeight: 260,
              overflowY: "auto",
              minWidth: 200,
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-faint)", padding: "4px 8px" }}>
              Переместить в проект
            </div>
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  if (p.id !== task.projectId) onMove(task.id, p.id);
                  setShowMove(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: p.id === task.projectId ? "var(--surface-2)" : "transparent",
                  fontSize: 13,
                  color: "var(--text)",
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
                  {p.scope === "work" ? "💼" : "🏡"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          {children.map((child) => (
            <TaskItem
              key={child.id}
              node={child}
              projects={projects}
              isAllView={isAllView}
              depth={depth + 1}
              pomoTaskId={pomoTaskId}
              onToggleCompleted={onToggleCompleted}
              onDelete={onDelete}
              onEdit={onEdit}
              onStartPomodoro={onStartPomodoro}
              onAddSubtask={onAddSubtask}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
