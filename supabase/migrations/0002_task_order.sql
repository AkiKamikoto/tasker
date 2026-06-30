-- Миграция: ручной порядок задач (перетаскивание вверх/вниз).
-- Применить к проекту Supabase (SQL Editor или Supabase CLI/MCP).

alter table tasks add column if not exists sort_order double precision default 0;
