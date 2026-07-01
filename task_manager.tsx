import { useState, useEffect, useMemo, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import {
  Project,
  Task,
  DEFAULT_WORK_PROJECT,
  DEFAULT_PERSONAL_PROJECT,
  TIME_CONFIG,
  ViewMode,
  GroupBy,
  GtdStatus,
} from "./types";
import { getTimeBucket, buildTaskTree, groupTasks, getDescendantIds, nodeMatchesPredicate, nextDueDate, sortTaskTree, compareByOrder, TaskNode } from "./utils";
import { supabase } from "./lib/supabase";
import { dbToTask, dbToProject, taskToDb, projectToDb } from "./lib/mappers";
import { POMODORO, NOTIFICATION_CHECK_INTERVAL_MS, BEEP } from "./config";
import { useToast } from "./lib/useToast";
import { useMediaQuery } from "./lib/useMediaQuery";
import { useSettings } from "./lib/useSettings";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatsView from "./components/StatsView";
import TaskItem from "./components/TaskItem";
import TaskModal, { TaskFormData } from "./components/TaskModal";
import ProjectModal from "./components/ProjectModal";
import TaskSelectModal from "./components/TaskSelectModal";
import CalendarView from "./components/CalendarView";
import MatrixView from "./components/MatrixView";
import WeeklyReviewView from "./components/WeeklyReviewView";
import QuickAddBar from "./components/QuickAddBar";
import SettingsModal from "./components/SettingsModal";
import AuthModal from "./components/AuthModal";
import Toast from "./components/Toast";
import { TaskTemplate, BUILT_IN_TEMPLATES, loadUserTemplates, saveUserTemplate } from "./templates";

// ─── Шторка «Выполненные» ───────────────────────────────────────────────────────
// Прячет выполненные задачи верхнего уровня за сворачиваемой панелью (свёрнута по умолчанию).

interface CompletedShutterProps {
  nodes: TaskNode[];
  expanded: boolean;
  onToggle: () => void;
  projects: Project[];
  isAllView: boolean;
  pomoTaskId: string | null;
  onToggleCompleted: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (node: TaskNode) => void;
  onStartPomodoro: (node: TaskNode) => void;
  onAddSubtask: (node: TaskNode) => void;
  onMove: (id: string, projectId: string) => void;
  onMoveNode: (draggedId: string, targetId: string, position: "before" | "after" | "child") => void;
}

function CompletedShutter({ nodes, expanded, onToggle, ...taskItemProps }: CompletedShutterProps) {
  if (nodes.length === 0) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          padding: "8px 2px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-muted)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform 0.15s",
            fontSize: 11,
          }}
        >
          ▶
        </span>
        Выполненные ({nodes.length})
      </button>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          {nodes.map((node) => (
            <TaskItem key={node.id} node={node} depth={0} {...taskItemProps} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { toasts, showToast, dismiss } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { settings, update: updateSettings } = useSettings();
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [session, setSession] = useState<Session | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const [scope, setScope] = useState<"work" | "personal">("work");
  const [projects, setProjects] = useState<Project[]>([
    DEFAULT_WORK_PROJECT,
    DEFAULT_PERSONAL_PROJECT,
  ]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selProj, setSelProj] = useState<string>("__today__");
  const [showTask, setShowTask] = useState<boolean>(false);
  const [showProj, setShowProj] = useState<boolean>(false);
  const [notifPerm, setNotifPerm] = useState<string>("default");
  const [loaded, setLoaded] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingSubtaskParent, setAddingSubtaskParent] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [inboxTitle, setInboxTitle] = useState<string>("");
  // Фильтр-приоритет (ручные флаги Эйзенхауэра) — комбинируется с временной вкладкой.
  const [prioUrgent, setPrioUrgent] = useState<boolean>(false);
  const [prioImportant, setPrioImportant] = useState<boolean>(false);
  const [templateForNew, setTemplateForNew] = useState<TaskTemplate | null>(null);
  const [userTemplates, setUserTemplates] = useState<TaskTemplate[]>([]);
  const quickAddRef = useRef<HTMLInputElement>(null);
  // Шторка «Выполненные»: свёрнута по умолчанию, не показывается на вкладке «Выполненные» (там и так только они).
  const [showCompletedList, setShowCompletedList] = useState<boolean>(false);
  const [showCompletedInbox, setShowCompletedInbox] = useState<boolean>(false);

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

  // Загрузка пользовательских шаблонов из localStorage.
  useEffect(() => {
    setUserTemplates(loadUserTemplates());
  }, []);

  // Горячая клавиша N: фокус на строке быстрого ввода или открытие формы задачи.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showTask || editingTask || addingSubtaskParent || showProj || showPomoSelect) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      )
        return;
      // 'n'/'N' (англ.) и 'т'/'Т' (та же клавиша в русской раскладке)
      if (e.key === "n" || e.key === "N" || e.key === "т" || e.key === "Т") {
        e.preventDefault();
        if (quickAddRef.current) quickAddRef.current.focus();
        else {
          setTemplateForNew(null);
          setShowTask(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showTask, editingTask, addingSubtaskParent, showProj, showPomoSelect]);

  // Авто-сворачивание сайдбара на мобильных, разворачивание на десктопе
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

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

  const handleAddTask = async (taskData: TaskFormData, parentId: string | null = null) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskData.title,
      desc: taskData.desc,
      dueDate: taskData.date ? `${taskData.date}T${taskData.time || "00:00"}` : "",
      reminder: taskData.reminder,
      projectId: taskData.projectId,
      difficulty: taskData.difficulty,
      estH: taskData.estH,
      estM: taskData.estM,
      tags: taskData.tags,
      completed: false,
      notified: false,
      pomodoros: 0,
      parentId,
      recurrence: taskData.recurrence,
      urgent: taskData.urgent,
      important: taskData.important,
      gtdStatus: taskData.gtdStatus,
      order: Date.now(),
    };
    setTasks((prev) => [...prev, newTask]);
    setShowTask(false);
    setAddingSubtaskParent(null);
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

  // Быстрый захват во «Входящие» (GTD inbox): только название.
  const handleQuickAddInbox = (title: string) => {
    const t = title.trim();
    if (!t) return;
    setInboxTitle("");
    handleAddTask({
      title: t,
      desc: "",
      date: "",
      time: "",
      reminder: 30,
      difficulty: "medium",
      estH: 0,
      estM: 30,
      tags: [],
      projectId: scope === "work" ? "default-work" : "default-personal",
      recurrence: null,
      urgent: false,
      important: false,
      gtdStatus: "inbox",
    });
  };

  // Быстрое добавление в обычном списке (проект/«Все задачи»): статус GTD «Следующее».
  const handleQuickAdd = (title: string) => {
    const t = title.trim();
    if (!t) return;
    const projectId = selProj.startsWith("__")
      ? scope === "work"
        ? "default-work"
        : "default-personal"
      : selProj;
    handleAddTask({
      title: t,
      desc: "",
      date: "",
      time: "",
      reminder: 30,
      difficulty: "medium",
      estH: 0,
      estM: 30,
      tags: [],
      projectId,
      recurrence: null,
      urgent: false,
      important: false,
      gtdStatus: "next",
    });
  };

  // Шаблоны: сохранение пользовательского шаблона и создание задачи из шаблона.
  const handleSaveTemplate = (tpl: TaskTemplate) => {
    setUserTemplates(saveUserTemplate(tpl));
    showToast("Шаблон сохранён.");
  };

  const openFromTemplate = (tpl: TaskTemplate) => {
    setTemplateForNew(tpl);
    setShowTask(true);
  };

  const handleUpdateTask = async (id: string, taskData: TaskFormData) => {
    const prevTask = tasks.find((t) => t.id === id);
    const prevTasks = tasks;
    const projectChanged = !!prevTask && prevTask.projectId !== taskData.projectId;
    // При смене проекта подзадачи переезжают вместе с родителем.
    const descIds = projectChanged ? getDescendantIds(tasks, id) : [];
    const patch = {
      title: taskData.title,
      desc: taskData.desc,
      dueDate: taskData.date ? `${taskData.date}T${taskData.time || "00:00"}` : "",
      reminder: taskData.reminder,
      projectId: taskData.projectId,
      difficulty: taskData.difficulty,
      estH: taskData.estH,
      estM: taskData.estM,
      tags: taskData.tags,
      recurrence: taskData.recurrence,
      urgent: taskData.urgent,
      important: taskData.important,
      gtdStatus: taskData.gtdStatus,
      notified: false,
    };
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) return { ...t, ...patch };
        if (descIds.includes(t.id)) return { ...t, projectId: taskData.projectId };
        return t;
      })
    );
    setEditingTask(null);
    if (session) {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: patch.title,
          description: patch.desc,
          due_date: patch.dueDate,
          reminder: patch.reminder,
          project_id: patch.projectId,
          difficulty: patch.difficulty,
          est_h: patch.estH,
          est_m: patch.estM,
          tags: patch.tags,
          recurrence: patch.recurrence,
          urgent: patch.urgent,
          important: patch.important,
          gtd_status: patch.gtdStatus,
          notified: false,
        })
        .eq("id", id)
        .eq("user_id", session.user.id);
      let descError = null;
      if (!error && descIds.length > 0) {
        const res = await supabase
          .from("tasks")
          .update({ project_id: taskData.projectId })
          .in("id", descIds)
          .eq("user_id", session.user.id);
        descError = res.error;
      }
      if ((error || descError) && prevTask) {
        // Откат к предыдущему состоянию
        setTasks(prevTasks);
        showToast("Не удалось сохранить изменения. Проверьте соединение.");
      }
    }
  };

  // Перемещение задачи (и её подзадач) в другой проект — быстрое действие.
  const handleMoveTask = async (id: string, projectId: string) => {
    const prevTasks = tasks;
    const ids = [id, ...getDescendantIds(tasks, id)];
    setTasks((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, projectId } : t)));
    if (session) {
      const { error } = await supabase
        .from("tasks")
        .update({ project_id: projectId })
        .in("id", ids)
        .eq("user_id", session.user.id);
      if (error) {
        setTasks(prevTasks);
        showToast("Не удалось переместить задачу.");
      }
    }
  };

  // Перетаскивание: изменить порядок среди соседей или вложить как подзадачу.
  const handleMoveNode = async (
    draggedId: string,
    targetId: string,
    position: "before" | "after" | "child"
  ) => {
    if (draggedId === targetId) return;
    const dragged = tasks.find((t) => t.id === draggedId);
    const target = tasks.find((t) => t.id === targetId);
    if (!dragged || !target) return;
    // Нельзя бросить задачу внутрь самой себя или своего потомка.
    if (getDescendantIds(tasks, draggedId).includes(targetId)) return;

    const newParentId = position === "child" ? targetId : target.parentId;
    let newProjectId = dragged.projectId;
    if (position === "child") newProjectId = target.projectId;
    else if (newParentId)
      newProjectId = tasks.find((t) => t.id === newParentId)?.projectId ?? dragged.projectId;

    // Новый порядок среди будущих соседей.
    const siblings = tasks
      .filter((t) => t.parentId === newParentId && t.id !== draggedId)
      .sort(compareByOrder);
    let insertIdx: number;
    if (position === "child") insertIdx = siblings.length;
    else {
      const ti = siblings.findIndex((s) => s.id === targetId);
      insertIdx = position === "before" ? ti : ti + 1;
    }
    const newSibIds = siblings.map((s) => s.id);
    newSibIds.splice(insertIdx < 0 ? newSibIds.length : insertIdx, 0, draggedId);
    const orderMap = new Map<string, number>();
    newSibIds.forEach((id, i) => orderMap.set(id, i));

    const projectChanged = newProjectId !== dragged.projectId;
    const descIds = projectChanged ? getDescendantIds(tasks, draggedId) : [];
    const prevTasks = tasks;
    setTasks((prev) =>
      prev.map((t) => {
        let nt = t;
        if (orderMap.has(t.id)) nt = { ...nt, order: orderMap.get(t.id)! };
        if (t.id === draggedId) nt = { ...nt, parentId: newParentId, projectId: newProjectId };
        else if (descIds.includes(t.id)) nt = { ...nt, projectId: newProjectId };
        return nt;
      })
    );

    if (session) {
      const uid = session.user.id;
      const ops: any[] = [];
      ops.push(
        supabase
          .from("tasks")
          .update({ parent_id: newParentId, project_id: newProjectId, sort_order: orderMap.get(draggedId) })
          .eq("id", draggedId)
          .eq("user_id", uid)
      );
      newSibIds
        .filter((id) => id !== draggedId)
        .forEach((id) =>
          ops.push(
            supabase.from("tasks").update({ sort_order: orderMap.get(id) }).eq("id", id).eq("user_id", uid)
          )
        );
      if (descIds.length)
        ops.push(
          supabase.from("tasks").update({ project_id: newProjectId }).in("id", descIds).eq("user_id", uid)
        );
      const results = await Promise.all(ops);
      if (results.some((r) => r && r.error)) {
        setTasks(prevTasks);
        showToast("Не удалось переместить задачу.");
      }
    }
  };

  // Смена GTD-статуса (используется в обзоре).
  const handleSetGtd = async (id: string, status: GtdStatus) => {
    const prevTasks = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, gtdStatus: status } : t)));
    if (session) {
      const { error } = await supabase
        .from("tasks")
        .update({ gtd_status: status })
        .eq("id", id)
        .eq("user_id", session.user.id);
      if (error) {
        setTasks(prevTasks);
        showToast("Не удалось обновить статус.");
      }
    }
  };

  const handleToggleTaskCompleted = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newVal = !task.completed;
    // Повтор: при завершении повторяющейся задачи создаём следующий экземпляр.
    const spawned: Task | null =
      newVal && task.recurrence && task.dueDate
        ? {
            ...task,
            id: crypto.randomUUID(),
            completed: false,
            notified: false,
            pomodoros: 0,
            dueDate: nextDueDate(task.dueDate, task.recurrence),
          }
        : null;
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, completed: newVal } : t));
      return spawned ? [...next, spawned] : next;
    });
    if (session) {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: newVal })
        .eq("id", id)
        .eq("user_id", session.user.id);
      if (error) {
        // Откат переключения и созданного повтора
        setTasks((prev) =>
          prev
            .filter((t) => !spawned || t.id !== spawned.id)
            .map((t) => (t.id === id ? { ...t, completed: !newVal } : t))
        );
        showToast("Не удалось обновить статус задачи.");
      } else if (spawned) {
        const { error: e2 } = await supabase
          .from("tasks")
          .insert(taskToDb(spawned, session.user.id));
        if (e2) {
          setTasks((prev) => prev.filter((t) => t.id !== spawned.id));
          showToast("Не удалось создать повтор задачи.");
        }
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    const prevTasks = tasks;
    // Удаляем задачу вместе со всеми подзадачами (в БД — каскад по FK).
    const ids = [id, ...getDescendantIds(tasks, id)];
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    if (session) {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);
      if (error) {
        // Возврат удалённых задач
        setTasks(prevTasks);
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
  const isInbox = selProj === "__inbox__";
  const isReview = selProj === "__review__";
  const isToday = selProj === "__today__";
  // Контролы вида (список/календарь/матрица + группировка) — только для обычных списков задач.
  const showViewControls = !isStats && !isInbox && !isReview && !isToday;
  // «Сегодня» — всегда список (это сфокусированное временное представление).
  const effectiveViewMode = isToday ? "list" : viewMode;

  const defaultProjectId = isStats || isAllView || isInbox || isReview || isToday
    ? scope === "work" ? "default-work" : "default-personal"
    : selProj;

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
    if (isToday) return { id: "__today__", name: "Сегодня", color: "#f59e0b" };
    if (isAllView) return { id: "__all__", name: "Все задачи", color: "#64748b" };
    if (isInbox) return { id: "__inbox__", name: "Входящие", color: "#6366f1" };
    if (isReview) return { id: "__review__", name: "Еженедельный обзор", color: "#0ea5e9" };
    return projects.find((p) => p.id === selProj);
  }, [projects, selProj, isStats, isToday, isAllView, isInbox, isReview, scope]);

  const viewTasks = useMemo(() => {
    if (isAllView || isStats || isReview) return scopeTasks;
    if (isInbox) return scopeTasks.filter((t) => t.gtdStatus === "inbox");
    // «Сегодня»: просрочено + сегодня (актуальное на сейчас).
    if (isToday)
      return scopeTasks.filter((t) => {
        const b = getTimeBucket(t);
        return b === "overdue" || b === "today";
      });
    return scopeTasks.filter((t) => t.projectId === selProj);
  }, [scopeTasks, selProj, isAllView, isStats, isInbox, isReview, isToday]);

  // Счётчики по временным корзинам + по приоритетным флагам.
  const counts = useMemo(() => ({
    all: viewTasks.length,
    overdue: viewTasks.filter((t) => getTimeBucket(t) === "overdue").length,
    today: viewTasks.filter((t) => getTimeBucket(t) === "today").length,
    upcoming: viewTasks.filter((t) => getTimeBucket(t) === "upcoming").length,
    completed: viewTasks.filter((t) => getTimeBucket(t) === "completed").length,
    urgent: viewTasks.filter((t) => t.urgent && !t.completed).length,
    important: viewTasks.filter((t) => t.important && !t.completed).length,
  }), [viewTasks]);

  // Предикат: время (вкладка) И приоритет (чипы) — комбинируются.
  const matchesTask = useMemo(() => {
    return (t: Task) =>
      (filter === "all" || getTimeBucket(t) === filter) &&
      (!prioUrgent || t.urgent) &&
      (!prioImportant || t.important);
  }, [filter, prioUrgent, prioImportant]);

  // Дерево задач верхнего уровня с учётом фильтров, отсортированное по дедлайну.
  const rootNodes = useMemo(() => {
    const tree = buildTaskTree(viewTasks);
    const noFilter = filter === "all" && !prioUrgent && !prioImportant;
    const filtered = noFilter
      ? tree
      : tree.filter((n) => nodeMatchesPredicate(n, matchesTask));
    return sortTaskTree([...filtered]);
  }, [viewTasks, filter, prioUrgent, prioImportant, matchesTask]);

  // Корневые задачи верхнего уровня без выполненных — для списка/инбокса они уводятся под шторку.
  // На вкладке «Выполненные» шторка не нужна — там и так показаны только выполненные.
  const { activeRootNodes, completedRootNodes } = useMemo(() => {
    if (!isInbox && filter === "completed") {
      return { activeRootNodes: rootNodes, completedRootNodes: [] as typeof rootNodes };
    }
    return {
      activeRootNodes: rootNodes.filter((n) => !n.completed),
      completedRootNodes: rootNodes.filter((n) => n.completed),
    };
  }, [rootNodes, filter, isInbox]);

  const groups = useMemo(
    () => groupTasks(activeRootNodes, groupBy, projects),
    [activeRootNodes, groupBy, projects]
  );

  const templates = useMemo(
    () => [...BUILT_IN_TEMPLATES, ...userTemplates],
    [userTemplates]
  );

  // Закрытие модала задачи/подзадачи и сброс контекста подзадачи/шаблона.
  const closeTaskModal = () => {
    setShowTask(false);
    setEditingTask(null);
    setAddingSubtaskParent(null);
    setTemplateForNew(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!authLoaded) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--canvas)",
          fontFamily: "Inter,sans-serif",
        }}
      >
        <div style={{ color: "var(--text-faint)", fontSize: 14 }}>Загрузка...</div>
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
        background: "var(--canvas)",
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
        isMobile={isMobile}
        closeSidebar={() => setSidebarOpen(false)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1100,
          }}
        />
      )}

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
          showViewControls={showViewControls}
          isMobile={isMobile}
          viewMode={viewMode}
          setViewMode={setViewMode}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
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
        ) : isReview ? (
          <WeeklyReviewView
            tasks={scopeTasks}
            projects={projects}
            onEdit={setEditingTask}
            onToggleCompleted={handleToggleTaskCompleted}
            onSetGtd={handleSetGtd}
          />
        ) : isInbox ? (
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                  placeholder="Быстрый захват: введите задачу и нажмите Enter"
                  value={inboxTitle}
                  onChange={(e) => setInboxTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleQuickAddInbox(inboxTitle);
                  }}
                  style={{
                    flex: 1,
                    padding: "11px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    background: "var(--surface)",
                    color: "var(--text)",
                  }}
                />
                <button
                  onClick={() => handleQuickAddInbox(inboxTitle)}
                  style={{
                    padding: "0 18px",
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Добавить
                </button>
              </div>
              {activeRootNodes.length === 0 && completedRootNodes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-faint)" }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>📥</div>
                  <p style={{ fontSize: 15, margin: "0 0 6px", fontWeight: 500 }}>Входящие пусты</p>
                  <p style={{ fontSize: 13, margin: 0 }}>Запишите всё, что нужно сделать, и разберите позже.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {activeRootNodes.map((node) => (
                      <TaskItem
                        key={node.id}
                        node={node}
                        projects={projects}
                        isAllView={true}
                        depth={0}
                        pomoTaskId={pomoTaskId}
                        onToggleCompleted={handleToggleTaskCompleted}
                        onDelete={handleDeleteTask}
                        onEdit={(n) => setEditingTask(n)}
                        onStartPomodoro={handleStartPomoForTask}
                        onAddSubtask={(n) => setAddingSubtaskParent(n)}
                        onMove={handleMoveTask}
                        onMoveNode={handleMoveNode}
                      />
                    ))}
                  </div>
                  <CompletedShutter
                    nodes={completedRootNodes}
                    expanded={showCompletedInbox}
                    onToggle={() => setShowCompletedInbox((v) => !v)}
                    projects={projects}
                    isAllView={true}
                    pomoTaskId={pomoTaskId}
                    onToggleCompleted={handleToggleTaskCompleted}
                    onDelete={handleDeleteTask}
                    onEdit={(n) => setEditingTask(n)}
                    onStartPomodoro={handleStartPomoForTask}
                    onAddSubtask={(n) => setAddingSubtaskParent(n)}
                    onMove={handleMoveTask}
                    onMoveNode={handleMoveNode}
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {effectiveViewMode === "list" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  background: "var(--surface)",
                  borderBottom: "1px solid var(--border)",
                  overflowX: "auto",
                  flexShrink: 0,
                }}
              >
                {!isToday && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {[
                      ["all", "Все"],
                      ["overdue", "Просроченные"],
                      ["today", "Сегодня"],
                      ["upcoming", "Предстоящие"],
                      ["completed", "Выполненные"],
                    ].map(([key, label]) => {
                      const isActive = filter === key;
                      const countVal = counts[key as keyof typeof counts];
                      const activeColor =
                        key === "all"
                          ? proj?.color || "var(--accent)"
                          : TIME_CONFIG[key as keyof typeof TIME_CONFIG]?.color || "var(--accent)";
                      return (
                        <button
                          key={key}
                          onClick={() => setFilter(key)}
                          style={{
                            padding: "5px 12px",
                            border: "none",
                            borderRadius: 99,
                            cursor: "pointer",
                            fontSize: 12.5,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            background: isActive ? activeColor : "transparent",
                            color: isActive ? "white" : "var(--text-muted)",
                          }}
                        >
                          {label}
                          {countVal > 0 ? ` (${countVal})` : ""}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginLeft: isToday ? 0 : "auto" }}>
                  {[
                    { key: "urgent", label: "🔥", title: "Срочные", color: "#ef4444", active: prioUrgent, toggle: () => setPrioUrgent((v) => !v), count: counts.urgent },
                    { key: "important", label: "⭐", title: "Важные", color: "#3b82f6", active: prioImportant, toggle: () => setPrioImportant((v) => !v), count: counts.important },
                  ].map((c) => (
                    <button
                      key={c.key}
                      onClick={c.toggle}
                      title={c.title}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 99,
                        border: `1px solid ${c.active ? c.color : "var(--border)"}`,
                        background: c.active ? `${c.color}1a` : "transparent",
                        color: c.active ? c.color : "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: 12.5,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.label}
                      {c.count > 0 ? ` ${c.count}` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {effectiveViewMode === "calendar" ? (
              <CalendarView tasks={viewTasks} projects={projects} onEdit={setEditingTask} />
            ) : effectiveViewMode === "matrix" ? (
              <MatrixView
                tasks={viewTasks}
                projects={projects}
                onEdit={setEditingTask}
                onToggleCompleted={handleToggleTaskCompleted}
              />
            ) : (
              <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <QuickAddBar
                    placeholder="Быстро добавить задачу… (Enter, клавиша N)"
                    accentColor={proj?.color || "#6366f1"}
                    onAdd={handleQuickAdd}
                    inputRef={quickAddRef}
                    templates={templates}
                    onPickTemplate={openFromTemplate}
                  />
                </div>
                {!loaded ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-faint)" }}>
                    <div style={{ fontSize: 14 }}>Загрузка задач...</div>
                  </div>
                ) : activeRootNodes.length === 0 && completedRootNodes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-faint)" }}>
                    <div style={{ fontSize: 52, marginBottom: 12 }}>📝</div>
                    <p style={{ fontSize: 15, margin: "0 0 6px", fontWeight: 500 }}>Нет задач</p>
                    <p style={{ fontSize: 13, margin: 0 }}>Нажмите «+ Задача» чтобы добавить</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {groups.map((group) => (
                      <div key={group.key}>
                        {group.label && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              margin: "0 0 10px 2px",
                            }}
                          >
                            {group.color && (
                              <span
                                style={{
                                  width: 9,
                                  height: 9,
                                  borderRadius: "50%",
                                  background: group.color,
                                }}
                              />
                            )}
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                              {group.label}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                              {group.nodes.length}
                            </span>
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {group.nodes.map((node) => (
                            <TaskItem
                              key={`${group.key}:${node.id}`}
                              node={node}
                              projects={projects}
                              isAllView={isAllView}
                              depth={0}
                              pomoTaskId={pomoTaskId}
                              onToggleCompleted={handleToggleTaskCompleted}
                              onDelete={handleDeleteTask}
                              onEdit={(n) => setEditingTask(n)}
                              onStartPomodoro={handleStartPomoForTask}
                              onAddSubtask={(n) => setAddingSubtaskParent(n)}
                              onMove={handleMoveTask}
                              onMoveNode={handleMoveNode}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    <CompletedShutter
                      nodes={completedRootNodes}
                      expanded={showCompletedList}
                      onToggle={() => setShowCompletedList((v) => !v)}
                      projects={projects}
                      isAllView={isAllView}
                      pomoTaskId={pomoTaskId}
                      onToggleCompleted={handleToggleTaskCompleted}
                      onDelete={handleDeleteTask}
                      onEdit={(n) => setEditingTask(n)}
                      onStartPomodoro={handleStartPomoForTask}
                      onAddSubtask={(n) => setAddingSubtaskParent(n)}
                      onMove={handleMoveTask}
                      onMoveNode={handleMoveNode}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {(showTask || editingTask || addingSubtaskParent) && (
        <TaskModal
          onClose={closeTaskModal}
          onAddTask={(taskData) => {
            if (editingTask) handleUpdateTask(editingTask.id, taskData);
            else handleAddTask(taskData, addingSubtaskParent?.id ?? null);
          }}
          projColor={proj?.color}
          taskToEdit={editingTask || undefined}
          projects={projects}
          defaultProjectId={defaultProjectId}
          parentTask={addingSubtaskParent || undefined}
          templates={templates}
          onSaveTemplate={handleSaveTemplate}
          initialTemplate={templateForNew || undefined}
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

      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
