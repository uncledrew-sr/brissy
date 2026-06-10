const GRADE_COLOR = { S:"#047857", A:"#059669", B:"#10B981", C:"#34D399", D:"#6EE7B7" };
const GRADE_BG    = { S:"rgba(4,120,87,.1)", A:"rgba(5,150,105,.1)", B:"rgba(16,185,129,.1)", C:"rgba(52,211,153,.1)", D:"rgba(110,231,183,.1)" };

export default function ActivityCard({ activity, onConfirm }) {
  return (
    <div style={{
      border:"1.5px solid var(--border)",
      borderRadius:"var(--r)",
      background:"var(--bg-2)",
      marginBottom:12, overflow:"hidden",
      transition:"border-color .2s, box-shadow .2s",
      boxShadow:"0 2px 8px rgba(0,0,0,.04)",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor="var(--border-2)"; e.currentTarget.style.boxShadow="0 4px 20px rgba(0,191,165,.1)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.04)"; }}
    >
      <div style={{
        padding:"13px 15px",
        borderBottom:"1px solid var(--border)",
        display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8,
      }}>
        <span style={{ fontWeight:700, fontSize:14, color:"var(--text-1)", lineHeight:1.4 }}>
          {activity.title}
        </span>
        <div style={{ display:"flex", gap:5, flexShrink:0 }}>
          {activity.grade.map(g => (
            <span key={g} style={{
              fontSize:11, fontWeight:700,
              color: GRADE_COLOR[g] || "#059669",
              background: GRADE_BG[g] || "rgba(5,150,105,.1)",
              border:`1.5px solid ${GRADE_COLOR[g] || "#059669"}40`,
              borderRadius:8, padding:"3px 9px",
            }}>{g}</span>
          ))}
        </div>
      </div>

      <div style={{ padding:"13px 15px" }}>
        <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
          <Tag>📍 {activity.region}</Tag>
          <Tag>📅 {activity.duration_days}일</Tag>
        </div>
        <p style={{ fontSize:13, color:"var(--text-2)", lineHeight:1.75, margin:0 }}>
          {activity.description}
        </p>
        {activity.tags?.length > 0 && (
          <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
            {activity.tags.map(t => (
              <span key={t} style={{
                fontSize:11, color:"var(--accent-2)",
                background:"var(--accent-bg)",
                borderRadius:99, padding:"3px 10px", fontWeight:500,
              }}>#{t}</span>
            ))}
          </div>
        )}
        {onConfirm && (
          <button onClick={() => onConfirm(activity)} style={{
            marginTop:14, width:"100%",
            background:"var(--accent)",
            color:"#fff",
            border:"none",
            borderRadius:"var(--rs)", padding:"11px",
            fontSize:14, fontWeight:700,
            transition:"opacity .15s, transform .1s",
            boxShadow:"0 2px 10px rgba(0,191,165,.3)",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity=".88"; e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 4px 16px rgba(0,191,165,.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity="1"; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 2px 10px rgba(0,191,165,.3)"; }}
          >✓ 확정하기</button>
        )}
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      fontSize:11, color:"var(--text-2)",
      background:"var(--bg-3)", border:"1.5px solid var(--border)",
      borderRadius:99, padding:"4px 10px",
    }}>{children}</span>
  );
}
