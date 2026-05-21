const GRADE_COLOR = { S:"#10B981", A:"#34D399", B:"#6EE7B7", C:"#A7F3D0", D:"#D1FAE5" };

export default function ActivityCard({ activity, onConfirm }) {
  return (
    <div style={{
      border:"1px solid var(--border)",
      borderRadius:"var(--r)",
      background:"var(--bg-2)",
      marginBottom:10, overflow:"hidden",
      transition:"border-color .15s",
    }}
    onMouseEnter={e=>e.currentTarget.style.borderColor="var(--border-2)"}
    onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}
    >
      <div style={{
        padding:"12px 14px",
        borderBottom:"1px solid var(--border)",
        display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8,
      }}>
        <span style={{ fontWeight:600, fontSize:13, color:"var(--text-1)", lineHeight:1.4 }}>
          {activity.title}
        </span>
        <div style={{ display:"flex", gap:4, flexShrink:0 }}>
          {activity.grade.map(g => (
            <span key={g} style={{
              fontSize:10, fontWeight:700,
              color: GRADE_COLOR[g] || "#10B981",
              background:`${GRADE_COLOR[g]}18`,
              border:`1px solid ${GRADE_COLOR[g]}40`,
              borderRadius:5, padding:"2px 6px",
            }}>{g}</span>
          ))}
        </div>
      </div>

      <div style={{ padding:"12px 14px" }}>
        <div style={{ display:"flex", gap:6, marginBottom:9, flexWrap:"wrap" }}>
          <Tag>📍 {activity.region}</Tag>
          <Tag>📅 {activity.duration_days}일</Tag>
        </div>
        <p style={{ fontSize:12, color:"var(--text-2)", lineHeight:1.7, margin:0 }}>
          {activity.description}
        </p>
        {activity.tags?.length > 0 && (
          <div style={{ display:"flex", gap:5, marginTop:10, flexWrap:"wrap" }}>
            {activity.tags.map(t => (
              <span key={t} style={{
                fontSize:10, color:"var(--accent-2)",
                background:"var(--accent-bg)",
                borderRadius:99, padding:"2px 8px", fontWeight:500,
              }}>#{t}</span>
            ))}
          </div>
        )}
        {onConfirm && (
          <button onClick={()=>onConfirm(activity)} style={{
            marginTop:12, width:"100%",
            background:"var(--accent-bg)",
            color:"var(--accent-2)",
            border:"1px solid rgba(249,115,22,.25)",
            borderRadius:"var(--rs)", padding:"9px",
            fontSize:12, fontWeight:600,
            transition:"background .15s, border-color .15s",
          }}
          onMouseEnter={e=>{ e.currentTarget.style.background="var(--accent)"; e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="var(--accent)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="var(--accent-bg)"; e.currentTarget.style.color="var(--accent-2)"; e.currentTarget.style.borderColor="rgba(249,115,22,.25)"; }}
          >확정하기 →</button>
        )}
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      fontSize:10, color:"var(--text-2)",
      background:"var(--bg-3)", border:"1px solid var(--border)",
      borderRadius:5, padding:"3px 8px",
    }}>{children}</span>
  );
}
