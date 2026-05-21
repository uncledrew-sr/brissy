const GRADE_STYLE = {
  S:{bg:"#14532d",text:"#fff"}, A:{bg:"#15803d",text:"#fff"},
  B:{bg:"#16a34a",text:"#fff"}, C:{bg:"#4ade80",text:"#14532d"},
  D:{bg:"#d1fae5",text:"#14532d"},
};

export default function ActivityCard({ activity, onConfirm }) {
  return (
    <div style={{
      border:"1px solid var(--border)", borderRadius:"var(--radius-sm)",
      background:"#fff", marginBottom:8, overflow:"hidden",
    }}>
      <div style={{
        padding:"10px 12px",
        borderBottom:"1px solid var(--border)",
        background:"var(--primary-light)",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <span style={{fontWeight:700, fontSize:13, color:"var(--text-1)"}}>{activity.title}</span>
        <div style={{display:"flex", gap:3}}>
          {activity.grade.map(g => (
            <span key={g} style={{
              background: GRADE_STYLE[g]?.bg||"#6b7280",
              color: GRADE_STYLE[g]?.text||"#fff",
              fontSize:10, fontWeight:700, borderRadius:4, padding:"1px 5px",
            }}>{g}</span>
          ))}
        </div>
      </div>

      <div style={{padding:"10px 12px"}}>
        <div style={{display:"flex", gap:6, marginBottom:6, flexWrap:"wrap"}}>
          <span style={chip}>📍 {activity.region}</span>
          <span style={chip}>📅 {activity.duration_days}일</span>
        </div>
        <p style={{fontSize:12, color:"var(--text-2)", lineHeight:1.6, margin:0}}>
          {activity.description}
        </p>
        {activity.tags?.length > 0 && (
          <div style={{display:"flex", gap:4, marginTop:8, flexWrap:"wrap"}}>
            {activity.tags.map(t => (
              <span key={t} style={{
                fontSize:10, color:"var(--primary)",
                background:"var(--primary-light)",
                border:"1px solid var(--primary-border)",
                borderRadius:99, padding:"1px 7px",
              }}>#{t}</span>
            ))}
          </div>
        )}
        {onConfirm && (
          <button
            onClick={() => onConfirm(activity)}
            style={{
              marginTop:10, width:"100%",
              background:"var(--primary)", color:"#fff",
              border:"none", borderRadius:6,
              padding:"8px", fontSize:12, fontWeight:600,
              cursor:"pointer", transition:"background .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background="var(--primary-hover)"}
            onMouseLeave={e => e.currentTarget.style.background="var(--primary)"}
          >이 활동으로 확정 →</button>
        )}
      </div>
    </div>
  );
}

const chip = {
  fontSize:11, color:"var(--text-2)",
  background:"#f1f5f9", border:"1px solid var(--border)",
  borderRadius:5, padding:"2px 7px",
};
