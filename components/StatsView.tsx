import { useMemo } from "react";
import { Task, Project, DIFFICULTY, RECURRENCE_OPTIONS } from "../types";
import { getStatus, dateBucket } from "../utils";
import StatCard from "./StatCard";

interface StatsViewProps {
  tasks: Task[];
  projects: Project[];
}

const DUE_BUCKET_COLORS: Record<string, string> = {
  overdue: "#ef4444",
  today: "#f59e0b",
  tomorrow: "#3b82f6",
  week: "#6366f1",
  later: "#64748b",
  nodate: "#94a3b8",
};

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

    // Сроки: распределение незавершённых задач по тем же корзинам, что и группировка списка по дате.
    const activeTasks = tasks.filter((t) => !t.completed);
    const bucketMap = new Map<string, { key: string; label: string; order: number; count: number }>();
    activeTasks.forEach((t) => {
      const b = dateBucket(t.dueDate);
      const existing = bucketMap.get(b.key);
      if (existing) existing.count += 1;
      else bucketMap.set(b.key, { ...b, count: 1 });
    });
    const dueBuckets = Array.from(bucketMap.values()).sort((a, b) => a.order - b.order);

    const overdueList = activeTasks.filter((t) => getStatus(t) === "overdue" && t.dueDate);
    const avgOverdueDays = overdueList.length
      ? Math.round(
          overdueList.reduce(
            (s, t) => s + (Date.now() - new Date(t.dueDate).getTime()) / 86400000,
            0
          ) / overdueList.length
        )
      : 0;

    // Подзадачи: сколько задач выступают родителями и сколько подзадач в среднем у них.
    const parentIds = new Set(tasks.filter((t) => t.parentId).map((t) => t.parentId));
    const parentTasksCount = parentIds.size;
    const subtasksCount = tasks.filter((t) => t.parentId).length;
    const avgSubtasksPerParent = parentTasksCount
      ? Math.round((subtasksCount / parentTasksCount) * 10) / 10
      : 0;

    // Повторы: сколько задач повторяются и с какой частотой.
    const recurringTasks = tasks.filter((t) => t.recurrence);
    const recurrenceByFreq = RECURRENCE_OPTIONS.filter((o) => o.value !== "none").map((o) => ({
      key: o.value,
      label: o.label,
      count: recurringTasks.filter((t) => t.recurrence?.freq === o.value).length,
    }));

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
      dueBuckets,
      avgOverdueDays,
      parentTasksCount,
      avgSubtasksPerParent,
      recurringCount: recurringTasks.length,
      recurrenceByFreq,
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
    dueBuckets,
    avgOverdueDays,
    parentTasksCount,
    avgSubtasksPerParent,
    recurringCount,
    recurrenceByFreq,
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
        <StatCard
          label="Среднее опоздание"
          value={overdueTasks ? `${avgOverdueDays} дн.` : "—"}
          color="#ef4444"
          sub="по просроченным"
        />
        <StatCard
          label="Задачи с подзадачами"
          value={parentTasksCount}
          color="#8b5cf6"
          sub={parentTasksCount ? `в среднем ${avgSubtasksPerParent} подзадач` : undefined}
        />
        <StatCard label="Повторяющиеся" value={recurringCount} color="#14b8a6" />
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

      {/* Grid for due-date distribution and subtasks/recurrence */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Сроки */}
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
            Сроки
          </div>
          {dueBuckets.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text-faint)" }}>Нет незавершённых задач</div>
          )}
          {dueBuckets.map((b) => {
            const color = DUE_BUCKET_COLORS[b.key] || "#64748b";
            const max = Math.max(...dueBuckets.map((x) => x.count));
            return (
              <div key={b.key} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color, fontWeight: 600 }}>{b.label}</span>
                  <span style={{ color: "var(--text-muted)" }}>{b.count}</span>
                </div>
                <div style={{ background: "var(--surface-2)", borderRadius: 99, height: 7 }}>
                  <div
                    style={{
                      width: `${max ? Math.round((b.count / max) * 100) : 0}%`,
                      height: "100%",
                      background: color,
                      borderRadius: 99,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Подзадачи и повторы */}
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
            Подзадачи и повторы
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
            {parentTasksCount > 0
              ? `${parentTasksCount} задач с подзадачами, в среднем ${avgSubtasksPerParent} на задачу`
              : "Нет задач с подзадачами"}
          </div>
          {recurringCount === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-faint)" }}>Нет повторяющихся задач</div>
          ) : (
            recurrenceByFreq.map((r) => (
              <div key={r.key} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{r.label}</span>
                  <span style={{ color: "var(--text-muted)" }}>{r.count}</span>
                </div>
                <div style={{ background: "var(--surface-2)", borderRadius: 99, height: 7 }}>
                  <div
                    style={{
                      width: `${recurringCount ? Math.round((r.count / recurringCount) * 100) : 0}%`,
                      height: "100%",
                      background: "#14b8a6",
                      borderRadius: 99,
                    }}
                  />
                </div>
              </div>
            ))
          )}
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
