const GRADE_BG = {
  S: "#14532d",
  A: "#15803d",
  B: "#16a34a",
  C: "#22c55e",
  D: "#86efac",
};
const GRADE_TEXT = { S: "#fff", A: "#fff", B: "#fff", C: "#fff", D: "#14532d" };

export default function ActivityCard({ activity, onConfirm }) {
  return (
    <div
      style={{
        border: "1px solid #d1fae5",
        borderRadius: 10,
        padding: "12px 14px",
        background: "#f0fdf4",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{activity.title}</div>
          <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>
            {activity.region} · {activity.duration_days}일 · {activity.tags.join(", ")}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            {activity.description}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {activity.grade.map((g) => (
              <span
                key={g}
                style={{
                  background: GRADE_BG[g] || "#6b7280",
                  color: GRADE_TEXT[g] || "#fff",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {g}
              </span>
            ))}
          </div>
          {onConfirm && (
            <button
              onClick={() => onConfirm(activity)}
              style={{
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              확정하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
