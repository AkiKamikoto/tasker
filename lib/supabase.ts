/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  const message =
    "Не заданы переменные окружения VITE_SUPABASE_URL и/или VITE_SUPABASE_ANON_KEY. " +
    "Добавь их в Vercel → Settings → Environment Variables (для Production) и сделай Redeploy.";

  // Показываем ошибку прямо на странице, чтобы не было пустого белого экрана.
  if (typeof document !== "undefined") {
    document.body.innerHTML =
      '<div style="font-family:Inter,sans-serif;max-width:640px;margin:80px auto;padding:24px;' +
      'border:1px solid #f1c0c0;border-radius:12px;background:#fff5f5;color:#9b1c1c;line-height:1.5">' +
      "<h2 style=\"margin:0 0 12px\">Ошибка конфигурации</h2><p>" +
      message +
      "</p></div>";
  }

  throw new Error(message);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
