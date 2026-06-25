
import { Project, Task } from "../types";

interface SidebarProps {
  projects: Project[];
  tasks: Task[];
  selProj: string;
  setSelProj: (id: string) => void;
  setFilter: (filter: string) => void;
  sidebarOpen: boolean;
  setShowProj: (show: boolean) => void;
  scope: "work" | "personal";
  setScope: (scope: "work" | "personal") => void;
}

export default function Sidebar({
  projects,
  tasks,
  selProj,
  setSelProj,
  setFilter,
  sidebarOpen,
  setShowProj,
  scope,
  setScope,
}: SidebarProps) {
  const handleSelectView = (id: string) => {
    setSelProj(id);
    setFilter("all");
  };

  const activeProjectIds = projects.filter((p) => p.scope === scope).map((p) => p.id);
  const allBadgeCount = tasks.filter(
    (t) => !t.completed && activeProjectIds.includes(t.projectId)
  ).length;

  return (
    <div
      style={{
        width: sidebarOpen ? 240 : 0,
        minWidth: sidebarOpen ? 240 : 0,
        background: "#1e293b",
        color: "white",
        display: "flex",
        flexDirection: "column",
        transition: "all .2s",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "20px 20px 14px", borderBottom: "none" }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>
          📋 Задачи
        </h2>
      </div>

      {/* SPACE SWITCHER */}
      <div
        style={{
          display: "flex",
          background: "#0f172a",
          borderRadius: 8,
          padding: 4,
          margin: "0 16px 16px",
          flexShrink: 0,
        }}
      >
        {(["work", "personal"] as const).map((s) => {
          const isActive = scope === s;
          const activeBg = s === "work" ? "#3b82f6" : "#ec4899";
          return (
            <button
              key={s}
              onClick={() => setScope(s)}
              style={{
                flex: 1,
                padding: "6px 0",
                background: isActive ? activeBg : "transparent",
                color: isActive ? "white" : "#94a3b8",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s === "work" ? "💼 Работа" : "🏡 Личное"}
            </button>
          );
        })}
      </div>

      <div style={{ borderBottom: "1px solid #334155" }} />

      {/* Special views */}
      {[
        { id: "__all__", icon: "🗂", label: "Все задачи", badge: allBadgeCount },
        { id: "__stats__", icon: "📊", label: "Статистика", badge: null },
      ].map((v) => (
        <div
          key={v.id}
          onClick={() => handleSelectView(v.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            cursor: "pointer",
            background: selProj === v.id ? "#334155" : "transparent",
            borderLeft: `3px solid ${
              selProj === v.id
                ? scope === "work"
                  ? "#3b82f6"
                  : "#ec4899"
                : "transparent"
            }`,
            transition: "all .15s",
          }}
        >
          <span style={{ fontSize: 14 }}>{v.icon}</span>
          <span style={{ fontSize: 13.5, flex: 1, color: "#e2e8f0" }}>{v.label}</span>
          {v.badge != null && v.badge > 0 && (
            <span
              style={{
                fontSize: 11,
                color: "#94a3b8",
                background: "#0f172a",
                borderRadius: 10,
                padding: "1px 7px",
              }}
            >
              {v.badge}
            </span>
          )}
        </div>
      ))}

      <div
        style={{
          padding: "14px 20px 6px",
          fontSize: 10,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: 1.2,
          fontWeight: 600,
        }}
      >
        Проекты
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {projects
          .filter((p) => p.scope === scope)
          .map((p) => {
            const cnt = tasks.filter((t) => t.projectId === p.id && !t.completed).length;
          return (
            <div
              key={p.id}
              onClick={() => handleSelectView(p.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                cursor: "pointer",
                background: selProj === p.id ? "#334155" : "transparent",
                borderLeft: `3px solid ${selProj === p.id ? p.color : "transparent"}`,
                transition: "all .15s",
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: p.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 13.5,
                  flex: 1,
                  color: "#e2e8f0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.name}
              </span>
              {cnt > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    background: "#0f172a",
                    borderRadius: 10,
                    padding: "1px 7px",
                    flexShrink: 0,
                  }}
                >
                  {cnt}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "14px 20px", borderTop: "1px solid #334155" }}>
        <button
          onClick={() => setShowProj(true)}
          style={{
            width: "100%",
            padding: "9px",
            background: "#334155",
            border: "none",
            borderRadius: 8,
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 16 }}>+</span> Новый проект
        </button>
      </div>
    </div>
  );
}
