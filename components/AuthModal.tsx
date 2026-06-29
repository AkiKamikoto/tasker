import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthModal() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) return;

    setLoading(true);
    setError("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      if (error) {
        setError(error.message);
      } else {
        setDone(true);
      }
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--surface-3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: "40px 36px",
          width: 380,
          maxWidth: "100%",
          boxSizing: "border-box",
          margin: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
            {done ? "Подтвердите почту" : mode === "login" ? "Войти" : "Создать аккаунт"}
          </h2>
          {!done && (
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-faint)" }}>
              {mode === "login"
                ? "Войдите чтобы увидеть свои задачи"
                : "Зарегистрируйтесь чтобы синхронизировать задачи"}
            </p>
          )}
        </div>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              На адрес <strong>{email}</strong> отправлено письмо с подтверждением.
              Перейдите по ссылке в письме и войдите.
            </p>
            <button
              onClick={() => { setDone(false); setMode("login"); }}
              style={{
                marginTop: 20,
                padding: "10px 24px",
                background: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Войти
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
                EMAIL
              </label>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="you@example.com"
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

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
                ПАРОЛЬ
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Минимум 6 символов"
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

            {error && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#dc2626",
                  marginBottom: 8,
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email.trim() || !password.trim()}
              style={{
                width: "100%",
                marginTop: 16,
                padding: "12px",
                background: loading || !email.trim() || !password.trim() ? "var(--border)" : "#6366f1",
                color: loading || !email.trim() || !password.trim() ? "var(--text-faint)" : "white",
                border: "none",
                borderRadius: 8,
                cursor: loading ? "wait" : "pointer",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {loading ? "..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
              </span>
              <button
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6366f1",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                {mode === "login" ? "Зарегистрироваться" : "Войти"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
