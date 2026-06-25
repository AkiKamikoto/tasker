import { Task } from "../types";

interface PomodoroWidgetProps {
  activeTask: Task | null;
  timeLeft: number;
  isRunning: boolean;
  mode: "focus" | "shortBreak";
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSelectTaskClick: () => void;
}

export default function PomodoroWidget({
  activeTask,
  timeLeft,
  isRunning,
  mode,
  onToggle,
  onReset,
  onSkip,
  onSelectTaskClick,
}: PomodoroWidgetProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const isFocus = mode === "focus";
  const themeColor = isFocus ? "#ef4444" : "#10b981";
  const bgColor = isFocus ? "#fef2f2" : "#f0fdf4";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: bgColor,
        border: `1px solid ${themeColor}30`,
        borderRadius: 99,
        padding: "6px 14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        maxWidth: 320,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 16 }}>{isFocus ? "🍅" : "☕️"}</span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 16,
            fontWeight: 700,
            color: themeColor,
            minWidth: 46,
            textAlign: "center",
          }}
        >
          {formatTime(timeLeft)}
        </span>
      </div>

      <div style={{ borderLeft: `1px solid ${themeColor}20`, height: 16 }} />

      <div
        onClick={onSelectTaskClick}
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: isFocus ? "#451a03" : "#022c22",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 100,
          cursor: "pointer",
          borderBottom: "1px dashed currentColor",
          paddingBottom: 1,
        }}
        title={
          activeTask
            ? `Задача: ${activeTask.title}. Кликните для изменения`
            : "Кликните для выбора задачи"
        }
      >
        {activeTask ? activeTask.title : "Выбрать задачу ▾"}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          onClick={onToggle}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            padding: 4,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={isRunning ? "Пауза" : "Старт"}
        >
          {isRunning ? "⏸️" : "▶️"}
        </button>
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            padding: 4,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Сбросить"
        >
          ⏹️
        </button>
        <button
          onClick={onSkip}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            padding: 4,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Пропустить"
        >
          ⏭️
        </button>
      </div>
    </div>
  );
}
