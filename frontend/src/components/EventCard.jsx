import dayjs from "dayjs";
import "dayjs/locale/ko";
dayjs.locale("ko");

const DOW = ["일","월","화","수","목","금","토"];

export default function EventCard({ event, onDelete }) {
  const d   = dayjs(event.date);
  const dow = DOW[d.day()];
  const isWeekend = d.day() === 0 || d.day() === 6;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"8px 10px",
      background:"#fff",
      border:"1px solid var(--border)",
      borderRadius:"var(--radius-sm)",
      marginBottom:6,
    }}>
      {/* Date badge */}
      <div style={{
        width:34, height:34, borderRadius:6, flexShrink:0,
        background:"#fffbeb", border:"1px solid #fde68a",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
      }}>
        <div style={{fontSize:12, fontWeight:800, lineHeight:1, color:"#92400e"}}>{d.date()}</div>
        <div style={{fontSize:9, color: isWeekend ? "#ef4444" : "#b45309", fontWeight:600}}>{dow}</div>
      </div>

      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:13, fontWeight:600, color:"var(--text-1)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
          {event.label}
        </div>
      </div>

      <button
        onClick={() => { if (window.confirm(`"${event.label}" 삭제할까요?`)) onDelete(event.id); }}
        style={{
          background:"none", border:"none",
          color:"var(--text-3)", fontSize:14,
          padding:"2px 6px", borderRadius:4,
          flexShrink:0, transition:"color .15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
      >✕</button>
    </div>
  );
}
