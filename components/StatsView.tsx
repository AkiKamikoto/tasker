import { useMemo } from "react";
import { Task, Project, DIFFICULTY } from "../types";
import { getStatus } from "../utils";
import StatCard from "./StatCard";

interface StatsViewProps {
  tasks: Task[];
  projects: Project[];
}

export default function StatsView({ tasks, projects }: StatsViewProps) {
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.completed).length;
    const overdueTasks = tasks.filter((t) => getStatus(t) === "overdue").length;
    const urgentTasks = tasks.filter((t) => getStatus(t) === "urgent").length;
    const doneRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const byDiff = Object.entries(DIFFICULTY).map(([key, cfg]) => ({
      key,
      ...cfg,
      count: tasks.filter((t) => t.difficulty === key).length,
      done: tasks.filter((t) => t.difficulty === key && t.completed).length,
    }));

    const byProj = projects
      .map((p) => ({
        ...p,
        total: tasks.filter((t) => t.projectId === p.id).length,
        done: tasks.filter((t) => t.projectId === p.id && t.completed).length,
      }))
      .filter((p) => p.total > 0);

    const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags || [])));
    const tagCounts = allTags
      .map((tag) => ({
        tag,
        count: tasks.filter((t) => t.tags?.includes(tag)).length,
      }))
      .sort((a, b) => b.count - a.count);

    const totalEstMin = tasks
      .filter((t) => !t.completed)
      .reduce((s, t) => s + (t.estH || 0) * 60 + (t.estM || 0), 0);

    return {
      totalTasks,
      doneTasks,
      overdueTasks,
      urgentTasks,
      doneRate,
      byDiff,
      byProj,
      tagCounts,
      totalEstMin,
    };
  }, [tasks, projects]);

  const {
    totalTasks,
    doneTasks,
    overdueTasks,
    urgentTasks,
    doneRate,
    byDiff,
    byProj,
    tagCounts,
    totalEstMin,
  } = stats;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
      {/* Cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard label="Всего задач" value={totalTasks} color="#6366f1" />
        <StatCard
          label="Выполнено"
          value={doneTasks}
          color="#10b981"
          sub={`${doneRate}% завершено`}
        />
        <StatCard
          label="Просроченные"
          value={overdueTasks}
          color="#ef4444"
        />
        <StatCard label="Срочные" value={urgentTasks} color="#f59e0b" />
        <StatCard
          label="Ост. времени"
          value={`${Math.floor(totalEstMin / 60)}ч ${totalEstMin % 60}м`}
          color="#3b82f6"
          sub="на незавершённые"
        />
      </div>

      {/* Progress bar */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 12,
          padding: "18px 20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 10,
          }}
        >
          Общий прогресс
        </div>
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: 99,
            height: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${doneRate}%`,
              height: "100%",
              background: "linear-gradient(90deg,#6366f1,#10b981)",
              borderRadius: 99,
              transition: "width .4s",
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
          {doneTasks} из {totalTasks} задач выполнено
        </div>
      </div>

      {/* Grid for projects and difficulty stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* By difficulty */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            padding: "18px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 14,
            }}
          >
            По сложности
          </div>
          {byDiff.map((d) => (
            <div key={d.key} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: d.color, fontWeight: 600 }}>
                  {d.label}
                </span>
                <span style={{ color: "var(--text-muted)" }}>
                  {d.done}/{d.count}
                </span>
              </div>
              <div style={{ background: "var(--surface-2)", borderRadius: 99, height: 7 }}>
                <div
                  style={{
                    width: `${d.count ? Math.round((d.done / d.count) * 100) : 0}%`,
                    height: "100%",
                    background: d.color,
                    borderRadius: 99,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* By project */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            padding: "18px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 14,
            }}
          >
            По проектам
          </div>
          {byProj.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text-faint)" }}>Нет данных</div>
          )}
          {byProj.map((p) => (
            <div key={p.id} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: p.color, fontWeight: 600 }}>
                  {p.name}
                </span>
                <span style={{ color: "var(--text-muted)" }}>
                  {p.done}/{p.total}
                </span>
              </div>
              <div style={{ background: "var(--surface-2)", borderRadius: 99, height: 7 }}>
                <div
                  style={{
                    width: `${Math.round((p.done / p.total) * 100)}%`,
                    height: "100%",
                    background: p.color,
                    borderRadius: 99,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags cloud */}
      {tagCounts.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            padding: "18px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 12,
            }}
          >
            Теги
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tagCounts.map(({ tag, count }) => (
              <span
                key={tag}
                style={{
                  padding: "4px 12px",
                  background: "var(--surface-2)",
                  borderRadius: 99,
                  fontSize: 12.5,
                  color: "var(--text)",
                  fontWeight: 500,
                }}
              >
                #{tag} <span style={{ color: "var(--text-faint)" }}>({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
