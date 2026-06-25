import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Vercel serverless function: отвечает на вопросы пользователя о его задачах.
// Ключ Claude живёт ТОЛЬКО на сервере. Данные берутся от имени пользователя
// (через его access_token), поэтому RLS отдаёт только его задачи.

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Метод не поддерживается" });
    return;
  }

  const { question, accessToken } = req.body || {};
  if (!question || !accessToken) {
    res.status(400).json({ error: "Нужны поля question и accessToken" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !anthropicKey) {
    res.status(500).json({
      error:
        "Сервер не сконфигурирован: проверьте VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY и ANTHROPIC_API_KEY в Vercel.",
    });
    return;
  }

  // Клиент от имени пользователя — RLS вернёт только его данные
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
  if (userErr || !userData?.user) {
    res.status(401).json({ error: "Недействительная сессия. Войдите заново." });
    return;
  }
  const userId = userData.user.id;

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("projects").select("*").eq("user_id", userId),
  ]);

  const projectName = (id: string) =>
    projects?.find((p) => p.id === id)?.name ?? "—";

  const taskLines = (tasks ?? [])
    .map(
      (t) =>
        `- [${t.completed ? "выполнена" : "активна"}] "${t.title}"` +
        ` | проект: ${projectName(t.project_id)}` +
        ` | дедлайн: ${t.due_date || "не задан"}` +
        ` | сложность: ${t.difficulty}` +
        ` | оценка: ${t.est_h || 0}ч ${t.est_m || 0}м` +
        ` | теги: ${(t.tags || []).join(", ") || "нет"}`
    )
    .join("\n");

  const today = new Date().toISOString();

  const system = `Ты — встроенный ассистент в приложении-таск-менеджере. Отвечай кратко и по-русски, опираясь ТОЛЬКО на данные ниже. Считай и фильтруй задачи по датам аккуратно. Если данных недостаточно для ответа — честно скажи об этом.

Текущая дата и время (ISO 8601): ${today}

Всего задач: ${tasks?.length ?? 0}
${taskLines || "(у пользователя пока нет задач)"}`;

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: String(question) }],
    });

    const answer = message.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    res.status(200).json({ answer: answer || "Не удалось сформировать ответ." });
  } catch (e: any) {
    res.status(500).json({ error: "Ошибка ИИ: " + (e?.message || "неизвестно") });
  }
}
