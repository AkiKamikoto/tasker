import { useState, RefObject } from "react";
import { TaskTemplate } from "../templates";

interface QuickAddBarProps {
  placeholder: string;
  accentColor: string;
  onAdd: (title: string) => void;
  inputRef?: RefObject<HTMLInputElement>;
  templates: TaskTemplate[];
  onPickTemplate: (tpl: TaskTemplate) => void;
}

export default function QuickAddBar({
  placeholder,
  accentColor,
  onAdd,
  inputRef,
  templates,
  onPickTemplate,
}: QuickAddBarProps) {
  const [value, setValue] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    onAdd(t);
    setValue("");
  };

  return (
    <div style={{ position: "relative", display: "flex", gap: 8 }}>
      <input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        style={{
          flex: 1,
          padding: "10px 14px",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          fontSize: 14,
          outline: "none",
          background: "white",
        }}
      />
      {templates.length > 0 && (
        <button
          onClick={() => setShowTemplates((s) => !s)}
          title="Создать из шаблона"
          style={{
            padding: "0 12px",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            color: "#475569",
          }}
        >
          📋
        </button>
      )}
      <button
        onClick={submit}
        style={{
          padding: "0 18px",
          background: accentColor,
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          whiteSpace: "nowrap",
        }}
      >
        + Добавить
      </button>

      {showTemplates && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 46,
            zIndex: 30,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            padding: 6,
            minWidth: 220,
          }}
        >
          <div style={{ fontSize: 11, color: "#94a3b8", padding: "4px 8px" }}>Из шаблона</div>
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                onPickTemplate(tpl);
                setShowTemplates(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 8px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                color: "#334155",
              }}
            >
              <span>{tpl.icon || "📄"}</span>
              <span>{tpl.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
