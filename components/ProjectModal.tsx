import { useState } from "react";
import { PROJECT_COLORS } from "../types";
import { inp } from "../utils";
import { useModal } from "../lib/useModal";

interface ProjectModalProps {
  onClose: () => void;
  onAddProj: (name: string, color: string, scope: "work" | "personal") => void;
  scope: "work" | "personal";
}

export default function ProjectModal({
  onClose,
  onAddProj,
  scope,
}: ProjectModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const { firstFieldRef, backdropProps } = useModal<HTMLInputElement>(onClose);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAddProj(name.trim(), color, scope);
    setName("");
    setColor(PROJECT_COLORS[0]);
  };

  return (
    <div
      {...backdropProps}
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
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: 28,
          width: 360,
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: "var(--text)", flex: 1 }}>
            Новый проект
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "var(--text-faint)",
            }}
          >
            ×
          </button>
        </div>

        <input
          {...inp({ style: { marginBottom: 14 } })}
          ref={firstFieldRef}
          placeholder="Название проекта *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>Цвет</div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          {PROJECT_COLORS.map((c) => (
            <div
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: c,
                cursor: "pointer",
                border: `3px solid ${
                  color === c ? "var(--text)" : "transparent"
                }`,
                transition: "border .15s",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              background: "var(--surface-2)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 2,
              padding: "10px",
              background: color,
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
