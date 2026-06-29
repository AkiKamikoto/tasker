import { ToastItem } from "../lib/useToast";

interface Props {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 1000,
        maxWidth: "calc(100vw - 40px)",
      }}
    >
      {toasts.map((t) => {
        const isError = t.type === "error";
        return (
          <div
            key={t.id}
            role="alert"
            onClick={() => onDismiss(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "Inter,sans-serif",
              fontSize: 13.5,
              fontWeight: 500,
              lineHeight: 1.4,
              color: isError ? "#9b1c1c" : "var(--text)",
              background: isError ? "#fff5f5" : "var(--surface-2)",
              border: `1px solid ${isError ? "#f1c0c0" : "var(--border)"}`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              maxWidth: 360,
            }}
          >
            <span style={{ fontSize: 16 }}>{isError ? "⚠️" : "ℹ️"}</span>
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
