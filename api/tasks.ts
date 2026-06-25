// REST API для внешнего ИИ: чтение и изменение задач.
// Доступ по личному ключу (заголовок Authorization: Bearer <API_ACCESS_KEY>
// или x-api-key). Работа с БД идёт через service-role ключ (только на сервере),
// данные жёстко ограничены пользователем API_USER_ID.
//
//   GET    /api/tasks            → { tasks, projects }
//   POST   /api/tasks            → создать задачу (тело: { title, ... }) → { task }
//   PATCH  /api/tasks?id=<id>    → изменить задачу (тело: поля для замены) → { task }
//   DELETE /api/tasks?id=<id>    → удалить задачу → { ok: true }

function isAuthorized(req: any): boolean {
  const key = process.env.API_ACCESS_KEY;
  if (!key) return false;
  const raw = String(req.headers["authorization"] || req.headers["x-api-key"] || "");
  const token = raw.replace(/^Bearer\s+/i, "").trim();
  return token === key;
}

// DB-строка → удобный для ИИ вид (camelCase)
function toApiTask(t: any) {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    dueDate: t.due_date ?? null,
    reminder: t.reminder,
    projectId: t.project_id,
    difficulty: t.difficulty,
    estH: t.est_h ?? 0,
    estM: t.est_m ?? 0,
    tags: t.tags ?? [],
    completed: !!t.completed,
    pomodoros: t.pomodoros ?? 0,
  };
}

export default async function handler(req: any, res: any) {
 try {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Неверный или отсутствующий API-ключ" });
    return;
  }

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userId = process.env.API_USER_ID;
  if (!url || !serviceKey || !userId) {
    res.status(500).json({
      error:
        "Сервер не сконфигурирован: нужны VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY и API_USER_ID.",
      missing: {
        VITE_SUPABASE_URL: !url,
        SUPABASE_SERVICE_ROLE_KEY: !serviceKey,
        API_USER_ID: !userId,
      },
    });
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const id = req.query?.id || body.id;

  try {
    if (req.method === "GET") {
      const [{ data: tasks, error: e1 }, { data: projects, error: e2 }] =
        await Promise.all([
          db.from("tasks").select("*").eq("user_id", userId),
          db.from("projects").select("*").eq("user_id", userId),
        ]);
      if (e1 || e2) throw e1 || e2;
      res.status(200).json({
        tasks: (tasks ?? []).map(toApiTask),
        projects: projects ?? [],
      });
      return;
    }

    if (req.method === "POST") {
      if (!body.title) {
        res.status(400).json({ error: "Поле title обязательно" });
        return;
      }
      const row = {
        id: (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}`,
        user_id: userId,
        title: body.title,
        description: body.description ?? body.desc ?? "",
        due_date: body.dueDate ?? body.due_date ?? null,
        reminder: body.reminder ?? 30,
        project_id: body.projectId ?? body.project_id ?? "default-work",
        difficulty: body.difficulty ?? "medium",
        est_h: body.estH ?? 0,
        est_m: body.estM ?? 0,
        tags: body.tags ?? [],
        completed: body.completed ?? false,
        notified: false,
        pomodoros: 0,
      };
      const { data, error } = await db.from("tasks").insert(row).select().single();
      if (error) throw error;
      res.status(201).json({ task: toApiTask(data) });
      return;
    }

    if (req.method === "PATCH") {
      if (!id) {
        res.status(400).json({ error: "Нужен параметр id" });
        return;
      }
      const patch: any = {};
      if (body.title !== undefined) patch.title = body.title;
      if (body.description !== undefined || body.desc !== undefined)
        patch.description = body.description ?? body.desc;
      if (body.dueDate !== undefined || body.due_date !== undefined)
        patch.due_date = body.dueDate ?? body.due_date;
      if (body.reminder !== undefined) patch.reminder = body.reminder;
      if (body.projectId !== undefined || body.project_id !== undefined)
        patch.project_id = body.projectId ?? body.project_id;
      if (body.difficulty !== undefined) patch.difficulty = body.difficulty;
      if (body.estH !== undefined) patch.est_h = body.estH;
      if (body.estM !== undefined) patch.est_m = body.estM;
      if (body.tags !== undefined) patch.tags = body.tags;
      if (body.completed !== undefined) patch.completed = body.completed;

      if (Object.keys(patch).length === 0) {
        res.status(400).json({ error: "Нет полей для изменения" });
        return;
      }

      const { data, error } = await db
        .from("tasks")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      res.status(200).json({ task: toApiTask(data) });
      return;
    }

    if (req.method === "DELETE") {
      if (!id) {
        res.status(400).json({ error: "Нужен параметр id" });
        return;
      }
      const { error } = await db
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Метод не поддерживается" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Ошибка сервера" });
  }
 } catch (fatal: any) {
   // Ловим всё, включая ошибки загрузки модуля/инициализации,
   // чтобы вернуть текст ошибки вместо FUNCTION_INVOCATION_FAILED.
   try {
     res.status(500).json({ error: "Фатальная ошибка: " + (fatal?.message || String(fatal)) });
   } catch {}
 }
}
