import dayjs from "dayjs";
import "dayjs/locale/ko";
dayjs.locale("ko");

const DOW = ["일","월","화","수","목","금","토"];

export default function EventCard({ event, onDelete }) {
  const d = dayjs(event.date);
  const isWeekend = d.day()===0 || d.day()===6;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"9px 10px",
      background:"var(--bg-2)",
      border:"1px solid var(--border)",
      borderRadius:"var(--rs)",
      marginBottom:5,
      transition:"border-color .15s, background .15s",
    }}
    onMouseEnter={e=>{ e.currentTarget.style.borderColor="var(--border-2)"; e.currentTarget.style.background="var(--bg-3)"; }}
    onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--bg-2)"; }}
    >
      <div style={{
        width:34, height:34, borderRadius:7, flexShrink:0,
        background:"var(--bg-3)", border:"1px solid var(--border-2)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
      }}>
        <div style={{ fontSize:13, fontWeight:700, lineHeight:1, color:"#FCD34D" }}>{d.date()}</div>
        <div style={{ fontSize:9, fontWeight:600, marginTop:1, color: isWeekend ? "#F87171" : "var(--text-3)" }}>
          {DOW[d.day()]}
        </div>
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:"var(--text-1)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {event.label}
        </div>
        <div style={{ fontSize:10, color:"var(--text-3)", marginTop:1 }}>{event.date}</div>
      </div>

      <button
        onClick={()=>{ if(window.confirm(`"${event.label}" 삭제할까요?`)) onDelete(event.id); }}
        style={{
          width:24, height:24, borderRadius:5, flexShrink:0,
          background:"none", border:"none", color:"var(--text-3)", fontSize:11,
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"background .15s, color .15s",
        }}
        onMouseEnter={e=>{ e.currentTarget.style.background="rgba(248,113,113,.15)"; e.currentTarget.style.color="#F87171"; }}
        onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.color="var(--text-3)"; }}
      >✕</button>
    </div>
  );
}
