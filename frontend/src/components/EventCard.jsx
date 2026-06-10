import dayjs from "dayjs";
import "dayjs/locale/ko";
dayjs.locale("ko");

const DOW = ["일","월","화","수","목","금","토"];

export default function EventCard({ event, onDelete }) {
  const d = dayjs(event.date);
  const isWeekend = d.day()===0 || d.day()===6;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"11px 12px",
      background:"var(--bg-2)",
      border:"1.5px solid var(--border)",
      borderRadius:"var(--r)",
      marginBottom:8,
      transition:"border-color .15s, box-shadow .15s",
      boxShadow:"0 1px 4px rgba(0,0,0,.04)",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.boxShadow="0 2px 12px rgba(0,191,165,.12)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.04)"; }}
    >
      {/* 날짜 배지 */}
      <div style={{
        width:42, height:42, borderRadius:14, flexShrink:0,
        background:"var(--accent-bg)",
        border:"1.5px solid var(--border-2)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
      }}>
        <div style={{ fontSize:16, fontWeight:800, lineHeight:1, color:"var(--accent)" }}>{d.date()}</div>
        <div style={{ fontSize:10, fontWeight:600, marginTop:2,
          color: isWeekend ? "#EF4444" : "var(--text-3)" }}>
          {DOW[d.day()]}
        </div>
      </div>

      {/* 내용 */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontSize:14, fontWeight:500, color:"var(--text-1)",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>
          {event.label}
        </div>
        <div style={{ fontSize:11, color:"var(--text-3)", marginTop:2 }}>{event.date}</div>
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={() => { if(window.confirm(`"${event.label}" 삭제할까요?`)) onDelete(event.id); }}
        style={{
          width:28, height:28, borderRadius:8, flexShrink:0,
          background:"none", border:"1.5px solid transparent",
          color:"var(--text-3)", fontSize:12,
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background="rgba(239,68,68,.1)"; e.currentTarget.style.borderColor="rgba(239,68,68,.25)"; e.currentTarget.style.color="#EF4444"; }}
        onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.color="var(--text-3)"; }}
      >✕</button>
    </div>
  );
}
