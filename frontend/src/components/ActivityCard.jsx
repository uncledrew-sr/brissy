const GRADE_BADGE = {
  S:{ bg:"#064E3B", text:"#6EE7B7" }, A:{ bg:"#065F46", text:"#A7F3D0" },
  B:{ bg:"#166534", text:"#BBF7D0" }, C:{ bg:"#14532D", text:"#D1FAE5" },
  D:{ bg:"#F0FDF4", text:"#166534" },
};

export default function ActivityCard({ activity, onConfirm }) {
  return (
    <div style={{
      border:"1px solid var(--border)",
      borderRadius:"var(--radius-sm)",
      background:"#fff",
      marginBottom:10,
      overflow:"hidden",
      boxShadow:"var(--shadow-sm)",
      transition:"box-shadow .15s, transform .15s",
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow="var(--shadow-md)"; e.currentTarget.style.transform="translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow="var(--shadow-sm)"; e.currentTarget.style.transform="none"; }}
    >
      {/* Header */}
      <div style={{
        padding:"11px 14px",
        background:"linear-gradient(135deg, #F0FDF4, #ECFDF5)",
        borderBottom:"1px solid #D1FAE5",
        display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8,
      }}>
        <span style={{ fontWeight:700, fontSize:13, color:"var(--text-1)", lineHeight:1.3 }}>
          {activity.title}
        </span>
        <div style={{ display:"flex", gap:3, flexShrink:0 }}>
          {activity.grade.map(g => {
            const s = GRADE_BADGE[g] || GRADE_BADGE.D;
            return (
              <span key={g} style={{
                background:s.bg, color:s.text,
                fontSize:10, fontWeight:700,
                borderRadius:4, padding:"2px 6px",
              }}>{g}</span>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"11px 14px" }}>
        <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
          <Chip icon="📍">{activity.region}</Chip>
          <Chip icon="📅">{activity.duration_days}일</Chip>
        </div>
        <p style={{ fontSize:12, color:"var(--text-2)", lineHeight:1.65, margin:0 }}>
          {activity.description}
        </p>
        {activity.tags?.length > 0 && (
          <div style={{ display:"flex", gap:5, marginTop:9, flexWrap:"wrap" }}>
            {activity.tags.map(t => (
              <span key={t} style={{
                fontSize:10, color:"var(--accent)",
                background:"var(--accent-light)",
                border:"1px solid var(--accent-border)",
                borderRadius:99, padding:"2px 8px", fontWeight:500,
              }}>#{t}</span>
            ))}
          </div>
        )}
        {onConfirm && (
          <button
            onClick={() => onConfirm(activity)}
            style={{
              marginTop:11, width:"100%",
              background:"var(--accent)", color:"#fff",
              border:"none", borderRadius:8,
              padding:"9px", fontSize:12, fontWeight:600,
              transition:"background .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background="var(--accent-hover)"}
            onMouseLeave={e => e.currentTarget.style.background="var(--accent)"}
          >확정하기 →</button>
        )}
      </div>
    </div>
  );
}

function Chip({ icon, children }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:3,
      fontSize:11, color:"var(--text-2)",
      background:"var(--bg)", border:"1px solid var(--border)",
      borderRadius:6, padding:"3px 8px",
    }}>{icon} {children}</span>
  );
}
