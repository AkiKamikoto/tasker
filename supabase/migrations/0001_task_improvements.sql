-- Миграция: повторяющиеся задачи, подзадачи, матрица Эйзенхауэра, GTD.
-- Применить к проекту Supabase (SQL Editor или Supabase CLI/MCP).
-- Колонки nullable / с дефолтами — существующие строки не ломаются.

alter table tasks add column if not exists parent_id  text references tasks(id) on delete cascade;
alter table tasks add column if not exists recurrence jsonb;
alter table tasks add column if not exists urgent     boolean default false;
alter table tasks add column if not exists important  boolean default false;
alter table tasks add column if not exists gtd_status text default 'inbox';

-- Индекс для быстрого поиска подзадач по родителю.
create index if not exists tasks_parent_id_idx on tasks (parent_id);
