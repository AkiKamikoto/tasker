import { useEffect, useState } from "react";

// ─── Настройки оформления ────────────────────────────────────────────────────
export type ThemeMode = "light" | "dark";
export type Density = "compact" | "normal" | "comfortable";

export interface Settings {
  theme: ThemeMode;
  accent: string;
  density: Density;
  fontScale: number; // масштаб интерфейса (zoom), 1 = 100%
}

export const ACCENT_PRESETS = [
  "#6366f1",
  "#3b82f6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
];

const DEFAULTS: Settings = {
  theme: "light",
  accent: "#6366f1",
  density: "normal",
  fontScale: 1,
};

const KEY = "tasker-settings-v1";

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function apply(s: Settings) {
  const root = document.documentElement;
  root.setAttribute("data-theme", s.theme);
  root.setAttribute("data-density", s.density);
  root.style.setProperty("--accent", s.accent);
  // Масштаб интерфейса через zoom (работает с инлайновыми px-размерами).
  (document.body.style as any).zoom = String(s.fontScale);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => load());

  useEffect(() => {
    apply(settings);
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const update = (patch: Partial<Settings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  return { settings, update };
}
