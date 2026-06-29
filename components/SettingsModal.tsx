import { Settings, Density, ThemeMode, ACCENT_PRESETS } from "../lib/useSettings";
import { useModal } from "../lib/useModal";

interface SettingsModalProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}

const DENSITIES: { value: Density; label: string }[] = [
  { value: "compact", label: "Компактно" },
  { value: "normal", label: "Обычно" },
  { value: "comfortable", label: "Просторно" },
];

const FONT_SCALES: { value: number; label: string }[] = [
  { value: 0.9, label: "Меньше" },
  { value: 1, label: "Обычный" },
  { value: 1.15, label: "Больше" },
];

const THEMES: { value: ThemeMode; label: string; icon: string }[] = [
  { value: "light", label: "Светлая", icon: "☀️" },
  { value: "dark", label: "Тёмная", icon: "🌙" },
];

export default function SettingsModal({ settings, onChange, onClose }: SettingsModalProps) {
  const { backdropProps } = useModal<HTMLDivElement>(onClose);

  const segBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "9px",
    border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
    borderRadius: 8,
    cursor: "pointer",
    background: active ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "var(--surface)",
    color: active ? "var(--accent)" : "var(--text-muted)",
    fontWeight: 600,
    fontSize: 13,
  });

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div
      {...backdropProps}
      className="tm-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        className="tm-modal"
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: 28,
          width: 460,
          maxWidth: "100%",
          boxSizing: "border-box",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: "var(--text)", flex: 1 }}>Оформление</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-faint)" }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Section title="Тема">
            <div style={{ display: "flex", gap: 8 }}>
              {THEMES.map((t) => (
                <button key={t.value} onClick={() => onChange({ theme: t.value })} style={segBtn(settings.theme === t.value)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Акцентный цвет">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {ACCENT_PRESETS.map((c) => {
                const active = settings.accent.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    onClick={() => onChange({ accent: c })}
                    title={c}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: c,
                      border: active ? "3px solid var(--text)" : "2px solid var(--border)",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  />
                );
              })}
            </div>
          </Section>

          <Section title="Плотность списка">
            <div style={{ display: "flex", gap: 8 }}>
              {DENSITIES.map((d) => (
                <button key={d.value} onClick={() => onChange({ density: d.value })} style={segBtn(settings.density === d.value)}>
                  {d.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Масштаб интерфейса">
            <div style={{ display: "flex", gap: 8 }}>
              {FONT_SCALES.map((f) => (
                <button key={f.value} onClick={() => onChange({ fontScale: f.value })} style={segBtn(settings.fontScale === f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
          </Section>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: 24,
            padding: "10px",
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Готово
        </button>
      </div>
    </div>
  );
}
