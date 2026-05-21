import dayjs from "dayjs";
import "dayjs/locale/ko";
dayjs.locale("ko");

const DOW = ["일","월","화","수","목","금","토"];

export default function EventCard({ event, onDelete }) {
  const d = dayjs(event.date);
  const isWeekend = d.day() === 0 || d.day() === 6;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"9px 10px",
      background:"#fff",
      border:"1px solid var(--border)",
      borderRadius:"var(--radius-sm)",
      marginBottom:6,
      boxShadow:"var(--shadow-sm)",
      transition:"box-shadow .15s, transform .15s",
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow="var(--shadow-md)"; e.currentTarget.style.transform="translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow="var(--shadow-sm)"; e.currentTarget.style.transform="none"; }}
    >
      <div style={{
        width:36, height:36, borderRadius:8, flexShrink:0,
        background:"linear-gradient(135deg, #FEF3C7, #FDE68A)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        border:"1px solid #FCD34D",
      }}>
        <div style={{ fontSize:13, fontWeight:800, lineHeight:1, color:"#92400E" }}>{d.date()}</div>
        <div style={{ fontSize:9, color: isWeekend ? "#EF4444" : "#B45309", fontWeight:700, marginTop:1 }}>
          {DOW[d.day()]}
        </div>
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"var(--text-1)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {event.label}
        </div>
        <div style={{ fontSize:11, color:"var(--text-3)", marginTop:1 }}>{event.date}</div>
      </div>

      <button
        onClick={() => { if (window.confirm(`"${event.label}" 삭제할까요?`)) onDelete(event.id); }}
        style={{
          width:26, height:26, borderRadius:6, flexShrink:0,
          background:"none", border:"1px solid transparent",
          color:"var(--text-3)", fontSize:12,
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background="#FEF2F2"; e.currentTarget.style.color="#EF4444"; e.currentTarget.style.borderColor="#FECACA"; }}
        onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="var(--text-3)"; e.currentTarget.style.borderColor="transparent"; }}
      >✕</button>
    </div>
  );
}
