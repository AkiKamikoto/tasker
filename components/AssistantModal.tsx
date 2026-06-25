import { useState, useRef, useEffect } from "react";
import { inp } from "../utils";
import { useModal } from "../lib/useModal";
import { supabase } from "../lib/supabase";

interface Props {
  onClose: () => void;
}

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Сколько у меня задач на сегодня?",
  "Какие задачи просрочены?",
  "Что самое срочное?",
  "Сколько времени займут незавершённые задачи?",
];

export default function AssistantModal({ onClose }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const { firstFieldRef, backdropProps } = useModal<HTMLInputElement>(onClose);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Сессия не найдена. Войдите заново.");

      const resp = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, accessToken: session.access_token }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Ошибка запроса");

      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ " + (e?.message || "Не удалось получить ответ") },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      {...backdropProps}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: 24,
          width: 520,
          maxWidth: "100%",
          boxSizing: "border-box",
          height: "80vh",
          maxHeight: 640,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "#1e293b", flex: 1 }}>
            ✨ ИИ-ассистент по задачам
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#94a3b8",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* История */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 14,
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: "#94a3b8", fontSize: 13.5 }}>
              <p style={{ margin: "0 0 12px" }}>
                Спросите что-нибудь о ваших задачах. Например:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 99,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      color: "#475569",
                      cursor: "pointer",
                      fontSize: 12.5,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: 12,
                fontSize: 13.5,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                background: m.role === "user" ? "#6366f1" : "#f1f5f9",
                color: m.role === "user" ? "white" : "#1e293b",
              }}
            >
              {m.text}
            </div>
          ))}

          {loading && (
            <div
              style={{
                alignSelf: "flex-start",
                padding: "10px 14px",
                borderRadius: 12,
                fontSize: 13.5,
                background: "#f1f5f9",
                color: "#94a3b8",
              }}
            >
              Думаю…
            </div>
          )}
        </div>

        {/* Ввод */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <input
              {...inp()}
              ref={firstFieldRef}
              placeholder="Ваш вопрос…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              disabled={loading}
            />
          </div>
          <button
            onClick={() => ask(input)}
            disabled={loading || !input.trim()}
            style={{
              padding: "10px 18px",
              background: loading || !input.trim() ? "#e2e8f0" : "#6366f1",
              color: loading || !input.trim() ? "#94a3b8" : "white",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "wait" : "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
