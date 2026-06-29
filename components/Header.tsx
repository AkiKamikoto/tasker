

import PomodoroWidget from "./PomodoroWidget";
import { Task, ViewMode, GroupBy } from "../types";

const VIEW_MODES: { value: ViewMode; icon: string; label: string }[] = [
  { value: "list", icon: "☰", label: "Список" },
  { value: "calendar", icon: "📅", label: "Календарь" },
  { value: "matrix", icon: "▦", label: "Матрица" },
];

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "none", label: "Без группировки" },
  { value: "project", label: "По проекту" },
  { value: "date", label: "По дате" },
  { value: "difficulty", label: "По сложности" },
  { value: "gtdStatus", label: "По GTD-статусу" },
  { value: "context", label: "По контексту" },
];

interface HeaderProps {
  projName: string | undefined;
  projColor: string | undefined;
  isStats: boolean;
  isAllView: boolean;
  selProj: string;
  notifPerm: string;
  reqNotif: () => void;
  delProj: (id: string) => void;
  setShowTask: (show: boolean) => void;
  setSidebarOpen: (f: (prev: boolean) => boolean) => void;
  showViewControls: boolean;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  groupBy: GroupBy;
  setGroupBy: (g: GroupBy) => void;
  pomoTask: Task | null;
  pomoTimeLeft: number;
  pomoIsRunning: boolean;
  pomoMode: "focus" | "shortBreak";
  onPomoToggle: () => void;
  onPomoReset: () => void;
  onPomoSkip: () => void;
  onPomoSelectClick: () => void;
}

export default function Header({
  projName,
  projColor,
  isStats,
  isAllView,
  selProj,
  notifPerm,
  reqNotif,
  delProj,
  setShowTask,
  setSidebarOpen,
  showViewControls,
  viewMode,
  setViewMode,
  groupBy,
  setGroupBy,
  pomoTask,
  pomoTimeLeft,
  pomoIsRunning,
  pomoMode,
  onPomoToggle,
  onPomoReset,
  onPomoSkip,
  onPomoSelectClick,
}: HeaderProps) {
  return (
    <div
      style={{
        padding: "14px 20px",
        borderBottom: "1px solid #e2e8f0",
        background: "white",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
          color: "#64748b",
          padding: 4,
          borderRadius: 6,
        }}
      >
        ☰
      </button>

      {!isStats && !isAllView && projColor && (
        <div
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: projColor,
            flexShrink: 0,
          }}
        />
      )}

      <h1
        style={{
          margin: 0,
          fontSize: 17,
          fontWeight: 700,
          color: "#1e293b",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {projName}
      </h1>

      {showViewControls && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3 }}>
            {VIEW_MODES.map((m) => {
              const active = viewMode === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setViewMode(m.value)}
                  title={m.label}
                  style={{
                    border: "none",
                    background: active ? "white" : "transparent",
                    color: active ? "#1e293b" : "#64748b",
                    borderRadius: 6,
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                  }}
                >
                  {m.icon}
                </button>
              );
            })}
          </div>
          {viewMode === "list" && (
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "6px 8px",
                fontSize: 12.5,
                color: "#475569",
                background: "white",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {GROUP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <PomodoroWidget
        activeTask={pomoTask}
        timeLeft={pomoTimeLeft}
        isRunning={pomoIsRunning}
        mode={pomoMode}
        onToggle={onPomoToggle}
        onReset={onPomoReset}
        onSkip={onPomoSkip}
        onSelectTaskClick={onPomoSelectClick}
      />

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {notifPerm !== "granted" && (
          <button
            onClick={reqNotif}
            style={{
              padding: "6px 11px",
              background: "#fef3c7",
              border: "1px solid #fcd34d",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              color: "#92400e",
            }}
          >
            🔔 Уведомления
          </button>
        )}

        {!isStats && !isAllView && !selProj.startsWith("__") && selProj !== "default-work" && selProj !== "default-personal" && (
          <button
            onClick={() => delProj(selProj)}
            style={{
              padding: "6px 11px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              color: "#dc2626",
            }}
          >
            🗑
          </button>
        )}

        {!isStats && (
          <button
            onClick={() => setShowTask(true)}
            style={{
              padding: "8px 16px",
              background: projColor || "#6366f1",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            + Задача
          </button>
        )}
      </div>
    </div>
  );
}
