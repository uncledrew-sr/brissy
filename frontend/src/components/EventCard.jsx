export default function EventCard({ event, onDelete }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 12px",
        background: "#fef9c3",
        borderRadius: 8,
        border: "1px solid #fde68a",
        marginBottom: 6,
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{event.label}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{event.date}</div>
      </div>
      <button
        onClick={() => onDelete(event.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#ef4444",
          fontSize: 16,
          padding: "2px 6px",
        }}
        title="삭제"
      >
        ✕
      </button>
    </div>
  );
}
