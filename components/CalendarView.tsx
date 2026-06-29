import { useMemo, useState } from "react";
import { Task, Project } from "../types";

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  onEdit: (task: Task) => void;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function CalendarView({ tasks, projects, onEdit }: CalendarViewProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Карта "YYYY-MM-DD" → задачи с дедлайном в этот день.
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      if (isNaN(d.getTime())) return;
      const key = dayKey(d);
      const arr = map.get(key) || [];
      arr.push(t);
      map.set(key, arr);
    });
    return map;
  }, [tasks]);

  // Сетка месяца, неделя начинается с понедельника.
  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Пн = 0
    const start = new Date(year, month, 1 - startOffset);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    return days;
  }, [cursor]);

  const todayKey = dayKey(new Date());
  const month = cursor.getMonth();

  const navBtn: React.CSSProperties = {
    border: "1px solid #e2e8f0",
    background: "white",
    borderRadius: 8,
    padding: "5px 12px",
    cursor: "pointer",
    fontSize: 13,
    color: "#475569",
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16, color: "#1e293b", flex: 1 }}>
          {MONTHS[month]} {cursor.getFullYear()}
        </h2>
        <button style={navBtn} onClick={() => setCursor(new Date(cursor.getFullYear(), month - 1, 1))}>
          ←
        </button>
        <button
          style={navBtn}
          onClick={() => {
            const n = new Date();
            setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
          }}
        >
          Сегодня
        </button>
        <button style={navBtn} onClick={() => setCursor(new Date(cursor.getFullYear(), month + 1, 1))}>
          →
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textAlign: "center", padding: 4 }}
          >
            {w}
          </div>
        ))}
        {cells.map((d) => {
          const key = dayKey(d);
          const items = byDay.get(key) || [];
          const inMonth = d.getMonth() === month;
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              style={{
                minHeight: 92,
                background: inMonth ? "white" : "#f8fafc",
                border: isToday ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 6,
                opacity: inMonth ? 1 : 0.55,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? "#3b82f6" : "#64748b" }}>
                {d.getDate()}
              </div>
              {items.slice(0, 4).map((t) => {
                const proj = projects.find((p) => p.id === t.projectId);
                return (
                  <div
                    key={t.id}
                    onClick={() => onEdit(t)}
                    title={t.title}
                    style={{
                      fontSize: 10.5,
                      padding: "2px 5px",
                      borderRadius: 5,
                      background: `${proj?.color || "#6366f1"}1a`,
                      color: proj?.color || "#6366f1",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textDecoration: t.completed ? "line-through" : "none",
                    }}
                  >
                    {t.title}
                  </div>
                );
              })}
              {items.length > 4 && (
                <div style={{ fontSize: 10, color: "#94a3b8" }}>+{items.length - 4}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
