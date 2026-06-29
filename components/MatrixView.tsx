import { Task, Project, EISENHOWER_QUADRANTS } from "../types";
import { fmt } from "../utils";

interface MatrixViewProps {
  tasks: Task[];
  projects: Project[];
  onEdit: (task: Task) => void;
  onToggleCompleted: (id: string) => void;
}

export default function MatrixView({
  tasks,
  projects,
  onEdit,
  onToggleCompleted,
}: MatrixViewProps) {
  // Матрица строится по задачам верхнего уровня, ещё не выполненным.
  const active = tasks.filter((t) => !t.parentId && !t.completed);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          minHeight: "100%",
        }}
      >
        {EISENHOWER_QUADRANTS.map((q) => {
          const items = active.filter(
            (t) => t.urgent === q.urgent && t.important === q.important
          );
          return (
            <div
              key={q.key}
              style={{
                background: q.bg,
                border: `1px solid ${q.color}30`,
                borderRadius: 12,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                minHeight: 180,
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: q.color }}>{q.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  {q.subtitle} · {items.length}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-faint)", padding: "8px 0" }}>—</div>
                ) : (
                  items.map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    return (
                      <div
                        key={t.id}
                        style={{
                          background: "var(--surface)",
                          borderRadius: 8,
                          padding: "8px 10px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => onToggleCompleted(t.id)}
                          style={{
                            marginTop: 2,
                            cursor: "pointer",
                            accentColor: proj?.color || "#6366f1",
                            flexShrink: 0,
                          }}
                        />
                        <div
                          onClick={() => onEdit(t)}
                          style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                            {t.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-faint)",
                              display: "flex",
                              gap: 8,
                              marginTop: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            {proj && (
                              <span style={{ color: proj.color }}>● {proj.name}</span>
                            )}
                            {t.dueDate && <span>⏰ {fmt(t.dueDate)}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
