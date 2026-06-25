import { useState, useEffect, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import {
  Project,
  Task,
  DEFAULT_WORK_PROJECT,
  DEFAULT_PERSONAL_PROJECT,
  STATUS_CONFIG,
  DifficultyKey,
} from "./types";
import { getStatus } from "./utils";
import { supabase } from "./lib/supabase";
import { dbToTask, dbToProject, taskToDb, projectToDb } from "./lib/mappers";
import { POMODORO, NOTIFICATION_CHECK_INTERVAL_MS, BEEP } from "./config";
import { useToast } from "./lib/useToast";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatsView from "./components/StatsView";
import TaskItem from "./components/TaskItem";
import TaskModal from "./components/TaskModal";
import ProjectModal from "./components/ProjectModal";
import TaskSelectModal from "./components/TaskSelectModal";
import AuthModal from "./components/AuthModal";
import Toast from "./components/Toast";

// ─── Component ────────────────────────────────────────────────────────────────

export default function App() {
  const { toasts, showToast, dismiss } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

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

  // Pomodoro
  const [pomoTaskId, setPomoTaskId] = useState<string | null>(null);
  const [pomoTimeLeft, setPomoTimeLeft] = useState<number>(POMODORO.focusSeconds);
  const [pomoIsRunning, setPomoIsRunning] = useState<boolean>(false);
  const [pomoMode, setPomoMode] = useState<"focus" | "shortBreak">("focus");
  const [showPomoSelect, setShowPomoSelect] = useState<boolean>(false);

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoaded(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load user data ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session) {
      setTasks([]);
      setProjects([DEFAULT_WORK_PROJECT, DEFAULT_PERSONAL_PROJECT]);
      setLoaded(false);
      return;
    }
    loadUserData(session.user.id);
  }, [session?.user.id]);

  const loadUserData = async (userId: string) => {
    setLoaded(false);

    const [{ data: projectsData }, { data: tasksData }] = await Promise.all([
      supabase.from("projects").select("*").eq("user_id", userId),
      supabase.from("tasks").select("*").eq("user_id", userId),
    ]);

    let loadedProjects: Project[] = (projectsData || []).map(dbToProject);

    // Create default projects for new users
    const defaultsToCreate: Project[] = [];
    if (!loadedProjects.some((p) => p.id === "default-work")) {
      defaultsToCreate.push(DEFAULT_WORK_PROJECT);
      loadedProjects = [DEFAULT_WORK_PROJECT, ...loadedProjects];
    }
    if (!loadedProjects.some((p) => p.id === "default-personal")) {
      defaultsToCreate.push(DEFAULT_PERSONAL_PROJECT);
      loadedProjects = [...loadedProjects, DEFAULT_PERSONAL_PROJECT];
    }
    if (defaultsToCreate.length > 0) {
      await supabase
        .from("projects")
        .insert(defaultsToCreate.map((p) => projectToDb(p, userId)));
    }

    setProjects(loadedProjects);
    setTasks((tasksData || []).map(dbToTask));
    setLoaded(true);
  };

  // ── Notifications ─────────────────────────────────────────────────────────

  useEffect(() => {
    if ("Notification" in window) setNotifPerm(Notification.permission);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTasks((prev) =>
        prev.map((t) => {
          if (t.completed || t.notified) return t;
          const diff = (new Date(t.dueDate).getTime() - now.getTime()) / 60000;
          if (diff <= t.reminder && diff > 0 && Notification.permission === "granted") {
            new Notification(`⏰ ${t.title}`, {
              body: `Начать через ${Math.round(diff)} мин.`,
            });
            if (session) {
              supabase
                .from("tasks")
                .update({ notified: true })
                .eq("id", t.id)
                .eq("user_id", session.user.id)
                .then(() => {});
            }
            return { ...t, notified: true };
          }
          return t;
        })
      );
    }, NOTIFICATION_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [session]);

  const reqNotif = async () => {
    if ("Notification" in window) {
      const p = await Notification.requestPermission();
      setNotifPerm(p);
    }
  };

  // ── Pomodoro ──────────────────────────────────────────────────────────────

  const playBeep = (type: "focusEnd" | "breakEnd") => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (type === "focusEnd") {
        osc.frequency.setValueAtTime(BEEP.focusEnd, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
        setTimeout(() => {
          try {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.setValueAtTime(BEEP.focusEnd, audioCtx.currentTime);
            gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.15);
          } catch {}
        }, 200);
      } else {
        osc.frequency.setValueAtTime(BEEP.breakEnd, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch {}
  };

  useEffect(() => {
    let interval: any = null;
    if (pomoIsRunning && pomoTimeLeft > 0) {
      interval = setInterval(() => setPomoTimeLeft((p) => p - 1), 1000);
    } else if (pomoIsRunning && pomoTimeLeft === 0) {
      if (pomoMode === "focus") {
        if (pomoTaskId) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === pomoTaskId ? { ...t, pomodoros: (t.pomodoros || 0) + 1 } : t
            )
          );
          if (session) {
            const task = tasks.find((t) => t.id === pomoTaskId);
            supabase
              .from("tasks")
              .update({ pomodoros: (task?.pomodoros || 0) + 1 })
              .eq("id", pomoTaskId)
              .eq("user_id", session.user.id)
              .then(() => {});
          }
        }
        playBeep("focusEnd");
        if (Notification.permission === "granted")
          new Notification("🍅 Фокус-сессия завершена!", {
            body: "Отличная работа! Время сделать перерыв.",
          });
        setPomoMode("shortBreak");
        setPomoTimeLeft(POMODORO.shortBreakSeconds);
        setPomoIsRunning(false);
      } else {
        playBeep("breakEnd");
        if (Notification.permission === "granted")
          new Notification("☕️ Перерыв завершен!", {
            body: "Пора возвращаться к задачам.",
          });
        setPomoMode("focus");
        setPomoTimeLeft(POMODORO.focusSeconds);
        setPomoIsRunning(false);
      }
    }
    return () => { if (interval) clearInterval(interval); };
  }, [pomoIsRunning, pomoTimeLeft, pomoMode, pomoTaskId]);

  const handlePomoToggle = () => setPomoIsRunning((p) => !p);
  const handlePomoReset = () => {
    setPomoIsRunning(false);
    setPomoTimeLeft(
      pomoMode === "focus" ? POMODORO.focusSeconds : POMODORO.shortBreakSeconds
    );
  };
  const handlePomoSkip = () => {
    setPomoIsRunning(false);
    if (pomoMode === "focus") {
      if (pomoTaskId)
        setTasks((prev) =>
          prev.map((t) =>
            t.id === pomoTaskId ? { ...t, pomodoros: (t.pomodoros || 0) + 1 } : t
          )
        );
      playBeep("focusEnd");
      setPomoMode("shortBreak");
      setPomoTimeLeft(POMODORO.shortBreakSeconds);
    } else {
      playBeep("breakEnd");
      setPomoMode("focus");
      setPomoTimeLeft(POMODORO.focusSeconds);
    }
  };
  const handleStartPomoForTask = (task: Task) => {
    setPomoTaskId(task.id);
    setPomoMode("focus");
    setPomoTimeLeft(POMODORO.focusSeconds);
    setPomoIsRunning(true);
    if (Notification.permission === "default") Notification.requestPermission();
  };

  // ── Scope ─────────────────────────────────────────────────────────────────

  const handleScopeChange = (newScope: "work" | "personal") => {
    setScope(newScope);
    setFilter("all");
    setSelProj(newScope === "work" ? "default-work" : "default-personal");
  };

  // ── Task CRUD ─────────────────────────────────────────────────────────────

  const handleAddTask = async (taskData: {
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
    const newTask: Task = {
      id: crypto.randomUUID(),
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
    };
    setTasks((prev) => [...prev, newTask]);
    setShowTask(false);
    if (session) {
      const { error } = await supabase
        .from("tasks")
        .insert(taskToDb(newTask, session.user.id));
      if (error) {
        // Откат оптимистичного добавления
        setTasks((prev) => prev.filter((t) => t.id !== newTask.id));
        showToast("Не удалось сохранить задачу. Проверьте соединение.");
      }
    }
  };

  const handleUpdateTask = async (
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
    const patch = {
      title: taskData.title,
      desc: taskData.desc,
      dueDate: taskData.date ? `${taskData.date}T${taskData.time || "00:00"}` : "",
      reminder: taskData.reminder,
      difficulty: taskData.difficulty,
      estH: taskData.estH,
      estM: taskData.estM,
      tags: taskData.tags,
      notified: false,
    };
    const prevTask = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setEditingTask(null);
    if (session) {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: patch.title,
          description: patch.desc,
          due_date: patch.dueDate,
          reminder: patch.reminder,
          difficulty: patch.difficulty,
          est_h: patch.estH,
          est_m: patch.estM,
          tags: patch.tags,
          notified: false,
        })
        .eq("id", id)
        .eq("user_id", session.user.id);
      if (error && prevTask) {
        // Откат к предыдущей версии задачи
        setTasks((prev) => prev.map((t) => (t.id === id ? prevTask : t)));
        showToast("Не удалось сохранить изменения. Проверьте соединение.");
      }
    }
  };

  const handleToggleTaskCompleted = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const newVal = !task?.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    if (session) {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: newVal })
        .eq("id", id)
        .eq("user_id", session.user.id);
      if (error) {
        // Откат переключения
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: !newVal } : t))
        );
        showToast("Не удалось обновить статус задачи.");
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    const prevTask = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (session) {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);
      if (error && prevTask) {
        // Возврат удалённой задачи
        setTasks((prev) => [...prev, prevTask]);
        showToast("Не удалось удалить задачу.");
      }
    }
  };

  // ── Project CRUD ──────────────────────────────────────────────────────────

  const handleAddProj = async (
    name: string,
    color: string,
    scopeVal: "work" | "personal"
  ) => {
    const p: Project = { id: crypto.randomUUID(), name, color, scope: scopeVal };
    setProjects((prev) => [...prev, p]);
    setShowProj(false);
    setSelProj(p.id);
    if (session) {
      const { error } = await supabase
        .from("projects")
        .insert(projectToDb(p, session.user.id));
      if (error) {
        // Откат добавления проекта
        setProjects((prev) => prev.filter((x) => x.id !== p.id));
        setSelProj(scope === "work" ? "default-work" : "default-personal");
        showToast("Не удалось создать проект. Проверьте соединение.");
      }
    }
  };

  const delProj = async (id: string) => {
    if (id === "default-work" || id === "default-personal") return;
    const prevProjects = projects;
    const prevTasks = tasks;
    setProjects((prev) => prev.filter((x) => x.id !== id));
    setTasks((prev) => prev.filter((x) => x.projectId !== id));
    setSelProj(scope === "work" ? "default-work" : "default-personal");
    if (session) {
      const [tasksRes, projRes] = await Promise.all([
        supabase.from("tasks").delete().eq("project_id", id).eq("user_id", session.user.id),
        supabase.from("projects").delete().eq("id", id).eq("user_id", session.user.id),
      ]);
      if (tasksRes.error || projRes.error) {
        // Возврат проекта и его задач
        setProjects(prevProjects);
        setTasks(prevTasks);
        showToast("Не удалось удалить проект.");
      }
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const isStats = selProj === "__stats__";
  const isAllView = selProj === "__all__";

  const activeProjectIds = useMemo(
    () => projects.filter((p) => p.scope === scope).map((p) => p.id),
    [projects, scope]
  );

  const scopeTasks = useMemo(
    () => tasks.filter((t) => activeProjectIds.includes(t.projectId)),
    [tasks, activeProjectIds]
  );

  const proj = useMemo(() => {
    if (isStats) return { id: "__stats__", name: "Статистика", color: scope === "work" ? "#3b82f6" : "#ec4899" };
    if (isAllView) return { id: "__all__", name: "Все задачи", color: "#64748b" };
    return projects.find((p) => p.id === selProj);
  }, [projects, selProj, isStats, isAllView, scope]);

  const viewTasks = useMemo(() => {
    if (isAllView || isStats) return scopeTasks;
    return scopeTasks.filter((t) => t.projectId === selProj);
  }, [scopeTasks, selProj, isAllView, isStats]);

  const allFiltered = useMemo(
    () => (isStats ? scopeTasks : viewTasks),
    [scopeTasks, viewTasks, isStats]
  );

  const counts = useMemo(() => ({
    all: allFiltered.length,
    upcoming: allFiltered.filter((t) => getStatus(t) === "upcoming").length,
    urgent: allFiltered.filter((t) => getStatus(t) === "urgent").length,
    overdue: allFiltered.filter((t) => getStatus(t) === "overdue").length,
    completed: allFiltered.filter((t) => getStatus(t) === "completed").length,
  }), [allFiltered]);

  const filteredTasks = useMemo(
    () => (filter === "all" ? allFiltered : allFiltered.filter((t) => getStatus(t) === filter)),
    [allFiltered, filter]
  );

  const sortedTasks = useMemo(
    () =>
      [...filteredTasks].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }),
    [filteredTasks]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (!authLoaded) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: "Inter,sans-serif",
        }}
      >
        <div style={{ color: "#94a3b8", fontSize: 14 }}>Загрузка...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthModal />;
  }

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
        userEmail={session.user.email || ""}
        onSignOut={() => supabase.auth.signOut()}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
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

        {isStats ? (
          <StatsView
            tasks={scopeTasks}
            projects={projects.filter((p) => p.scope === scope)}
          />
        ) : (
          <>
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
                    : STATUS_CONFIG[key as keyof typeof STATUS_CONFIG]?.color || "#6366f1";
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

            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {!loaded ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 14 }}>Загрузка задач...</div>
                </div>
              ) : sortedTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>📝</div>
                  <p style={{ fontSize: 15, margin: "0 0 6px", fontWeight: 500 }}>Нет задач</p>
                  <p style={{ fontSize: 13, margin: 0 }}>Нажмите «+ Задача» чтобы добавить</p>
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

      {(showTask || editingTask) && (
        <TaskModal
          onClose={() => { setShowTask(false); setEditingTask(null); }}
          onAddTask={(taskData) => {
            if (editingTask) handleUpdateTask(editingTask.id, taskData);
            else handleAddTask(taskData);
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
              setPomoTimeLeft(POMODORO.focusSeconds);
              setPomoIsRunning(true);
            }
            setShowPomoSelect(false);
          }}
          currentTaskId={pomoTaskId}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
