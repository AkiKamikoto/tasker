

import PomodoroWidget from "./PomodoroWidget";
import { Task } from "../types";

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

        {!isStats && selProj !== "default-work" && selProj !== "default-personal" && !isAllView && (
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
