// Диагностический эндпоинт без зависимостей: проверяет, что serverless-функции
// вообще запускаются на этом проекте. GET /api/ping → { ok: true }
export default function handler(_req: any, res: any) {
  res.status(200).json({ ok: true, runtime: "node", time: new Date().toISOString() });
}
