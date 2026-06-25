import { useState } from "react";
import { User, PROJECT_COLORS } from "../types";

interface UserSetupModalProps {
  users: User[];
  onSelect: (user: User) => void;
  onCreate: (name: string, color: string) => void;
}

export default function UserSetupModal({ users, onSelect, onCreate }: UserSetupModalProps) {
  const [mode, setMode] = useState<"select" | "create">(users.length === 0 ? "create" : "select");
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, color);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: "36px 32px",
          width: 380,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👤</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>
            {mode === "create" ? "Создать профиль" : "Выбрать профиль"}
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8" }}>
            {mode === "create"
              ? "Ваши задачи будут привязаны к этому профилю"
              : "Выберите профиль или создайте новый"}
          </p>
        </div>

        {mode === "select" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onSelect(u)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 10,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = u.color)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: u.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    {u.name[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{u.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMode("create")}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                border: "1.5px dashed #cbd5e1",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 13,
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              + Новый профиль
            </button>
          </>
        )}

        {mode === "create" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
                ИМЯ
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Ваше имя"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>
                ЦВЕТ ПРОФИЛЯ
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: c,
                      border: color === c ? `3px solid #1e293b` : "3px solid transparent",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {users.length > 0 && (
                <button
                  onClick={() => setMode("select")}
                  style={{
                    flex: 1,
                    padding: "11px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#475569",
                    fontWeight: 600,
                  }}
                >
                  Назад
                </button>
              )}
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                style={{
                  flex: 2,
                  padding: "11px",
                  background: name.trim() ? color : "#e2e8f0",
                  border: "none",
                  borderRadius: 8,
                  cursor: name.trim() ? "pointer" : "not-allowed",
                  fontSize: 13,
                  color: name.trim() ? "white" : "#94a3b8",
                  fontWeight: 700,
                }}
              >
                Создать профиль
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
