import { useState, useEffect, useMemo } from "react";
import {
  Project,
  Task,
  DEFAULT_WORK_PROJECT,
  DEFAULT_PERSONAL_PROJECT,
  STORAGE_KEY,
  STATUS_CONFIG,
  DifficultyKey,
} from "./types";
import { getStatus, storage } from "./utils";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatsView from "./components/StatsView";
import TaskItem from "./components/TaskItem";
import TaskModal from "./components/TaskModal";
import ProjectModal from "./components/ProjectModal";
import TaskSelectModal from "./components/TaskSelectModal";

// Extend window interface for custom storage
declare global {
  interface Window {
    storage: {
      get: (key: string) => Promise<{ value: string } | null>;
      set: (key: string, value: string) => Promise<void>;
    };
  }
}

export default function App() {
  const [scope, setScope] = useState<"work" | "personal">("work");
  const [projects, setProjects] = useState<Project[]>([
    DEFAULT_WORK_PROJECT,
    DEFAULT_PERSONAL_PROJECT,
  ]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selProj, setSelProj] = useState<string>("default-work");
  const [showTask, setShowTask] = useState<boolean>(false);
  const [showProj, setShowProj] = useState<boolean>(false);
  const [notifPerm, setNotifPerm] = useState<string>("default");
  const [loaded, setLoaded] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Pomodoro states
  const [pomoTaskId, setPomoTaskId] = useState<string | null>(null);
  const [pomoTimeLeft, setPomoTimeLeft] = useState<number>(1500);
  const [pomoIsRunning, setPomoIsRunning] = useState<boolean>(false);
  const [pomoMode, setPomoMode] = useState<"focus" | "shortBreak">("focus");
  const [showPomoSelect, setShowPomoSelect] = useState<boolean>(false);

  // Load state from custom storage
  useEffect(() => {
    (async () => {
      try {
        const r = await storage.get(STORAGE_KEY);
        if (r) {
          const d = JSON.parse(r);
          const loadedProjects: Project[] = d.projects || [];
          // Ensure defaults exist
          if (!loadedProjects.some((p) => p.id === "default-work")) {
            loadedProjects.push(DEFAULT_WORK_PROJECT);
          }
          if (!loadedProjects.some((p) => p.id === "default-personal")) {
            loadedProjects.push(DEFAULT_PERSONAL_PROJECT);
          }
          setProjects(loadedProjects);
          setTasks(d.tasks || []);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  // Save state to custom storage
  useEffect(() => {
    if (!loaded) return;
    storage
      .set(STORAGE_KEY, JSON.stringify({ projects, tasks }))
      .catch(() => {});
  }, [projects, tasks, loaded]);

  // Request notifications permission if available
  useEffect(() => {
    if ("Notification" in window) {
      setNotifPerm(Notification.permission);
    }
  }, []);

  // Set up timer for checking reminders
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTasks((prev) =>
        prev.map((t) => {
          if (t.completed || t.notified) return t;
          const diff = (new Date(t.dueDate).getTime() - now.getTime()) / 60000;
          if (
            diff <= t.reminder &&
            diff > 0 &&
            Notification.permission === "granted"
          ) {
            new Notification(`⏰ ${t.title}`, {
              body: `Начать через ${Math.round(diff)} мин.`,
            });
            return { ...t, notified: true };
          }
          return t;
        })
      );
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const reqNotif = async () => {
    if ("Notification" in window) {
      const p = await Notification.requestPermission();
      setNotifPerm(p);
    }
  };

  // Play a beautiful beep sound using browser Web Audio API
  const playBeep = (type: "focusEnd" | "breakEnd") => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "focusEnd") {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);

        setTimeout(() => {
          try {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
            gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.15);
          } catch {}
        }, 200);
      } else {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch {}
  };

  // Pomodoro timer tick interval effect
  useEffect(() => {
    let interval: any = null;
    if (pomoIsRunning && pomoTimeLeft > 0) {
      interval = setInterval(() => {
        setPomoTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (pomoIsRunning && pomoTimeLeft === 0) {
      if (pomoMode === "focus") {
        if (pomoTaskId) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === pomoTaskId ? { ...t, pomodoros: (t.pomodoros || 0) + 1 } : t
            )
          );
        }
        playBeep("focusEnd");
        if (Notification.permission === "granted") {
          new Notification("🍅 Фокус-сессия завершена!", {
            body: "Отличная работа! Время сделать перерыв.",
          });
        }
        setPomoMode("shortBreak");
        setPomoTimeLeft(300); // 5 mins
        setPomoIsRunning(false);
      } else {
        playBeep("breakEnd");
        if (Notification.permission === "granted") {
          new Notification("☕️ Перерыв завершен!", {
            body: "Пора возвращаться к задачам.",
          });
        }
        setPomoMode("focus");
        setPomoTimeLeft(1500); // 25 mins
        setPomoIsRunning(false);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomoIsRunning, pomoTimeLeft, pomoMode, pomoTaskId]);

  const handlePomoToggle = () => {
    setPomoIsRunning((prev) => !prev);
  };

  const handlePomoReset = () => {
    setPomoIsRunning(false);
    setPomoTimeLeft(pomoMode === "focus" ? 1500 : 300);
  };

  const handlePomoSkip = () => {
    setPomoIsRunning(false);
    if (pomoMode === "focus") {
      if (pomoTaskId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === pomoTaskId ? { ...t, pomodoros: (t.pomodoros || 0) + 1 } : t
          )
        );
      }
      playBeep("focusEnd");
      setPomoMode("shortBreak");
      setPomoTimeLeft(300);
    } else {
      playBeep("breakEnd");
      setPomoMode("focus");
      setPomoTimeLeft(1500);
    }
  };

  const handleStartPomoForTask = (task: Task) => {
    setPomoTaskId(task.id);
    setPomoMode("focus");
    setPomoTimeLeft(1500);
    setPomoIsRunning(true);
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const handleScopeChange = (newScope: "work" | "personal") => {
    setScope(newScope);
    setFilter("all");
    setSelProj(newScope === "work" ? "default-work" : "default-personal");
  };

  const handleAddTask = (taskData: {
    title: string;
    desc: string;
    date: string;
    time: string;
    reminder: number;
    difficulty: DifficultyKey;
    estH: number;
    estM: number;
    tags: string[];
  }) => {
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now() + "",
        title: taskData.title,
        desc: taskData.desc,
        dueDate: taskData.date ? `${taskData.date}T${taskData.time || "00:00"}` : "",
        reminder: taskData.reminder,
        projectId:
          selProj === "__all__"
            ? scope === "work"
              ? "default-work"
              : "default-personal"
            : selProj,
        difficulty: taskData.difficulty,
        estH: taskData.estH,
        estM: taskData.estM,
        tags: taskData.tags,
        completed: false,
        notified: false,
      },
    ]);
    setShowTask(false);
  };

  const handleUpdateTask = (
    id: string,
    taskData: {
      title: string;
      desc: string;
      date: string;
      time: string;
      reminder: number;
      difficulty: DifficultyKey;
      estH: number;
      estM: number;
      tags: string[];
    }
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: taskData.title,
              desc: taskData.desc,
              dueDate: taskData.date ? `${taskData.date}T${taskData.time || "00:00"}` : "",
              reminder: taskData.reminder,
              difficulty: taskData.difficulty,
              estH: taskData.estH,
              estM: taskData.estM,
              tags: taskData.tags,
              notified: false,
            }
          : t
      )
    );
    setEditingTask(null);
  };

  const handleAddProj = (name: string, color: string, scopeVal: "work" | "personal") => {
    const p = { id: Date.now() + "", name, color, scope: scopeVal };
    setProjects((prev) => [...prev, p]);
    setShowProj(false);
    setSelProj(p.id);
  };

  const delProj = (id: string) => {
    if (id === "default-work" || id === "default-personal") return;
    setProjects((p) => p.filter((x) => x.id !== id));
    setTasks((t) => t.filter((x) => x.projectId !== id));
    setSelProj(scope === "work" ? "default-work" : "default-personal");
  };

  const isStats = selProj === "__stats__";
  const isAllView = selProj === "__all__";

  const activeProjectIds = useMemo(() => {
    return projects.filter((p) => p.scope === scope).map((p) => p.id);
  }, [projects, scope]);

  const scopeTasks = useMemo(() => {
    return tasks.filter((t) => activeProjectIds.includes(t.projectId));
  }, [tasks, activeProjectIds]);

  const proj = useMemo(() => {
    if (isStats) return { id: "__stats__", name: "Статистика", color: scope === "work" ? "#3b82f6" : "#ec4899" };
    if (isAllView) return { id: "__all__", name: "Все задачи", color: "#64748b" };
    return projects.find((p) => p.id === selProj);
  }, [projects, selProj, isStats, isAllView, scope]);

  // Memoize counts and tasks calculations
  const viewTasks = useMemo(() => {
    if (isAllView || isStats) return scopeTasks;
    return scopeTasks.filter((t) => t.projectId === selProj);
  }, [scopeTasks, selProj, isAllView, isStats]);

  const allFiltered = useMemo(() => {
    return isStats ? scopeTasks : viewTasks;
  }, [scopeTasks, viewTasks, isStats]);

  const counts = useMemo(() => {
    return {
      all: allFiltered.length,
      upcoming: allFiltered.filter((t) => getStatus(t) === "upcoming").length,
      urgent: allFiltered.filter((t) => getStatus(t) === "urgent").length,
      overdue: allFiltered.filter((t) => getStatus(t) === "overdue").length,
      completed: allFiltered.filter((t) => getStatus(t) === "completed").length,
    };
  }, [allFiltered]);

  const filteredTasks = useMemo(() => {
    if (filter === "all") return allFiltered;
    return allFiltered.filter((t) => getStatus(t) === filter);
  }, [allFiltered, filter]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [filteredTasks]);

  const handleToggleTaskCompleted = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Inter,sans-serif",
        background: "#f8fafc",
        overflow: "hidden",
      }}
    >
      {/* SIDEBAR */}
      <Sidebar
        projects={projects}
        tasks={tasks}
        selProj={selProj}
        setSelProj={setSelProj}
        setFilter={setFilter}
        sidebarOpen={sidebarOpen}
        setShowProj={setShowProj}
        scope={scope}
        setScope={handleScopeChange}
      />

      {/* MAIN CONTENT AREA */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* HEADER */}
        <Header
          projName={proj?.name}
          projColor={proj?.color}
          isStats={isStats}
          isAllView={isAllView}
          selProj={selProj}
          notifPerm={notifPerm}
          reqNotif={reqNotif}
          delProj={delProj}
          setShowTask={setShowTask}
          setSidebarOpen={setSidebarOpen}
          pomoTask={tasks.find((t) => t.id === pomoTaskId) || null}
          pomoTimeLeft={pomoTimeLeft}
          pomoIsRunning={pomoIsRunning}
          pomoMode={pomoMode}
          onPomoToggle={handlePomoToggle}
          onPomoReset={handlePomoReset}
          onPomoSkip={handlePomoSkip}
          onPomoSelectClick={() => setShowPomoSelect(true)}
        />

        {/* VIEW CONDITIONAL RENDERING */}
        {isStats ? (
          <StatsView tasks={scopeTasks} projects={projects.filter((p) => p.scope === scope)} />
        ) : (
          <>
            {/* FILTER TABS */}
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: "12px 20px 0",
                background: "white",
                borderBottom: "1px solid #e2e8f0",
                overflowX: "auto",
                flexShrink: 0,
              }}
            >
              {[
                ["all", "Все"],
                ["upcoming", "Предстоящие"],
                ["urgent", "Срочные"],
                ["overdue", "Просроченные"],
                ["completed", "Выполненные"],
              ].map(([key, label]) => {
                const isActive = filter === key;
                const countVal = counts[key as keyof typeof counts];
                const activeColor =
                  key === "all"
                    ? proj?.color || "#6366f1"
                    : STATUS_CONFIG[key as keyof typeof STATUS_CONFIG]?.color ||
                      "#6366f1";

                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    style={{
                      padding: "7px 14px",
                      border: "none",
                      borderRadius: "8px 8px 0 0",
                      cursor: "pointer",
                      fontSize: 12.5,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      background: isActive ? activeColor : "transparent",
                      color: isActive ? "white" : "#64748b",
                    }}
                  >
                    {label}
                    {countVal > 0 ? ` (${countVal})` : ""}
                  </button>
                );
              })}
            </div>

            {/* TASK LIST */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {sortedTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>📝</div>
                  <p style={{ fontSize: 15, margin: "0 0 6px", fontWeight: 500 }}>
                    Нет задач
                  </p>
                  <p style={{ fontSize: 13, margin: 0 }}>
                    Нажмите «+ Задача» чтобы добавить
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sortedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      projects={projects}
                      isAllView={isAllView}
                      onToggleCompleted={handleToggleTaskCompleted}
                      onDelete={handleDeleteTask}
                      onEdit={setEditingTask}
                      onStartPomodoro={handleStartPomoForTask}
                      isFocusing={pomoTaskId === task.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      {(showTask || editingTask) && (
        <TaskModal
          onClose={() => {
            setShowTask(false);
            setEditingTask(null);
          }}
          onAddTask={(taskData) => {
            if (editingTask) {
              handleUpdateTask(editingTask.id, taskData);
            } else {
              handleAddTask(taskData);
            }
          }}
          projColor={proj?.color}
          taskToEdit={editingTask || undefined}
        />
      )}

      {showProj && (
        <ProjectModal
          onClose={() => setShowProj(false)}
          onAddProj={handleAddProj}
          scope={scope}
        />
      )}

      {showPomoSelect && (
        <TaskSelectModal
          onClose={() => setShowPomoSelect(false)}
          tasks={scopeTasks.filter((t) => !t.completed)}
          projects={projects}
          onSelectTask={(task) => {
            if (task) {
              handleStartPomoForTask(task);
            } else {
              setPomoTaskId(null);
              setPomoMode("focus");
              setPomoTimeLeft(1500);
              setPomoIsRunning(true);
            }
            setShowPomoSelect(false);
          }}
          currentTaskId={pomoTaskId}
        />
      )}
    </div>
  );
}
