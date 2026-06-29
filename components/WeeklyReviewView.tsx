import { Task, Project, GtdStatus, GTD_OPTIONS } from "../types";
import { getStatus, fmt } from "../utils";

interface WeeklyReviewViewProps {
  tasks: Task[];
  projects: Project[];
  onEdit: (task: Task) => void;
  onToggleCompleted: (id: string) => void;
  onSetGtd: (id: string, status: GtdStatus) => void;
}

export default function WeeklyReviewView({
  tasks,
  projects,
  onEdit,
  onToggleCompleted,
  onSetGtd,
}: WeeklyReviewViewProps) {
  const active = tasks.filter((t) => !t.completed);

  const sections: {
    key: string;
    title: string;
    hint: string;
    items: Task[];
    showGtd?: boolean;
  }[] = [
    {
      key: "inbox",
      title: "📥 Разобрать входящие",
      hint: "Назначьте статус, проект и срок каждой задаче.",
      items: active.filter((t) => t.gtdStatus === "inbox"),
      showGtd: true,
    },
    {
      key: "overdue",
      title: "🔴 Просроченные",
      hint: "Перенесите срок или закройте.",
      items: active.filter((t) => getStatus(t) === "overdue"),
    },
    {
      key: "waiting",
      title: "⏳ Ожидание",
      hint: "Проверьте, не пора ли действовать.",
      items: active.filter((t) => t.gtdStatus === "waiting"),
    },
    {
      key: "someday",
      title: "💭 Когда-нибудь",
      hint: "Что-то стоит вернуть в работу?",
      items: active.filter((t) => t.gtdStatus === "someday"),
    },
    {
      key: "nodate",
      title: "📆 Без срока",
      hint: "Задачи без дедлайна — назначьте дату при необходимости.",
      items: active.filter((t) => !t.dueDate && t.gtdStatus !== "someday" && t.gtdStatus !== "inbox"),
    },
    {
      key: "done",
      title: "✅ Выполненные",
      hint: "Что уже сделано.",
      items: tasks.filter((t) => t.completed),
    },
  ];

  const row = (t: Task, showGtd: boolean) => {
    const proj = projects.find((p) => p.id === t.projectId);
    return (
      <div
        key={t.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "white",
          borderRadius: 8,
          padding: "8px 12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <input
          type="checkbox"
          checked={t.completed}
          onChange={() => onToggleCompleted(t.id)}
          style={{ cursor: "pointer", accentColor: proj?.color || "#6366f1", flexShrink: 0 }}
        />
        <div onClick={() => onEdit(t)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#1e293b",
              textDecoration: t.completed ? "line-through" : "none",
            }}
          >
            {t.title}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {proj && <span style={{ color: proj.color }}>● {proj.name}</span>}
            {t.dueDate && <span>⏰ {fmt(t.dueDate)}</span>}
          </div>
        </div>
        {showGtd && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {GTD_OPTIONS.filter((o) => o.value !== "inbox").map((o) => (
              <button
                key={o.value}
                onClick={() => onSetGtd(t.id, o.value)}
                title={`В «${o.label}»`}
                style={{
                  border: "1px solid #e2e8f0",
                  background: "white",
                  borderRadius: 6,
                  padding: "3px 7px",
                  fontSize: 11,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Еженедельный обзор по GTD: пройдите по разделам сверху вниз и приведите задачи в порядок.
        </p>
        {sections.map((s) => (
          <div key={s.key}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 14.5, color: "#1e293b" }}>{s.title}</h3>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{s.items.length}</span>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>{s.hint}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {s.items.length === 0 ? (
                <div style={{ fontSize: 12.5, color: "#cbd5e1" }}>Пусто 🎉</div>
              ) : (
                s.items.map((t) => row(t, !!s.showGtd))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
