

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}

export default function StatCard({ label, value, color, sub }: StatCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        borderTop: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      <div
        style={{
          fontSize: 13,
          color: "#1e293b",
          fontWeight: 600,
          marginTop: 2,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
