import { useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
dayjs.locale("ko");

const WD = ["일","월","화","수","목","금","토"];

export default function Calendar({ month, events, confirmed, freeWindows, onDateClick, selectedDate }) {
  const base  = dayjs(`${month}-01`);
  const today = dayjs().format("YYYY-MM-DD");

  const eMap = useMemo(() => {
    const m = {};
    for (const e of events) m[e.date] = [...(m[e.date]||[]), e.label];
    return m;
  }, [events]);

  const cMap = useMemo(() => {
    const m = {};
    for (const c of confirmed) m[c.date] = c.activity;
    return m;
  }, [confirmed]);

  const { cells, rows } = useMemo(() => {
    const blanks = Array(base.day()).fill(null);
    const days   = Array.from({ length: base.daysInMonth() }, (_, i) =>
      base.add(i,"day").format("YYYY-MM-DD")
    );
    const all = [...blanks, ...days];
    return { cells: all, rows: Math.ceil(all.length / 7) };
  }, [base]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)" }}>

      {/* 요일 헤더 */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(7,1fr)",
        flexShrink:0, padding:"0 8px",
        background:"var(--bg)",
      }}>
        {WD.map((w,i) => (
          <div key={w} style={{
            textAlign:"center", padding:"14px 0",
            fontSize:11, fontWeight:700, letterSpacing:".08em",
            color: i===0 ? "#EF4444" : i===6 ? "#3B82F6" : "var(--text-3)",
          }}>{w}</div>
        ))}
      </div>

      {/* 날짜 셀 */}
      <div style={{
        flex:1, minHeight:0,
        display:"grid",
        gridTemplateColumns:"repeat(7,1fr)",
        gridTemplateRows:`repeat(${rows},1fr)`,
        gap:4, padding:"0 8px 8px",
      }}>
        {cells.map((date, i) => {
          if (!date) return <div key={`b${i}`} />;

          const busy    = eMap[date] || [];
          const conf    = cMap[date];
          const dow     = dayjs(date).day();
          const dn      = parseInt(date.slice(-2), 10);
          const isToday = date === today;

          const cellBg = conf        ? "rgba(0,191,165,.08)"
                       : busy.length ? "rgba(249,115,22,.08)"
                       : "var(--bg-2)";

          const isSelected = date === selectedDate;

          return (
            <div key={date}
              onClick={e => onDateClick?.(date, e.currentTarget)}
              style={{
                border: isSelected
                  ? "2px solid var(--accent)"
                  : "1.5px solid var(--border)",
                borderRadius:10,
                background: cellBg,
                padding:"8px 9px", overflow:"hidden",
                transition:"background .15s, border-color .15s",
                position:"relative",
                cursor: onDateClick ? "pointer" : "default",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,191,165,.1)"; if(!isSelected) e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = cellBg; if(!isSelected) e.currentTarget.style.borderColor = "var(--border)"; }}
            >

              {/* 날짜 숫자 */}
              <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
                <span style={{
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  width:24, height:24, borderRadius:"50%", flexShrink:0,
                  fontSize:12, fontWeight: isToday ? 800 : 400,
                  background: isToday ? "var(--accent)" : "transparent",
                  color: isToday ? "#fff"
                       : dow===0   ? "#EF4444"
                       : dow===6   ? "#3B82F6"
                       : "var(--text-1)",
                }}>{dn}</span>
              </div>

              {/* 일정 */}
              {busy.slice(0,2).map((l,idx) => (
                <div key={idx} style={{
                  fontSize:10, lineHeight:1.4, marginBottom:2,
                  color:"var(--orange, #F97316)",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>· {l}</div>
              ))}
              {busy.length > 2 && (
                <div style={{ fontSize:9, color:"var(--text-3)" }}>+{busy.length-2}</div>
              )}

              {/* 확정 */}
              {conf && (
                <div style={{
                  fontSize:10, lineHeight:1.4, color:"#00BFA5",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>✓ {conf}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div style={{
        display:"flex", gap:14, padding:"10px 16px",
        borderTop:"1.5px solid var(--border)",
        flexShrink:0, flexWrap:"wrap",
        background:"var(--bg)",
      }}>
        <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text-3)" }}>
          <span style={{ width:10, height:3, background:"#F97316", display:"inline-block", borderRadius:99 }}/>
          일정
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text-3)" }}>
          <span style={{ width:10, height:3, background:"#00BFA5", display:"inline-block", borderRadius:99 }}/>
          확정
        </span>
      </div>
    </div>
  );
}
