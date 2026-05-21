import { useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
dayjs.locale("ko");

const GRADE = {
  S: { dot: "#10B981", bg: "#ECFDF5", label: "#065F46" },
  A: { dot: "#34D399", bg: "#F0FDF4", label: "#065F46" },
  B: { dot: "#86EFAC", bg: "#F0FDF4", label: "#166534" },
  C: { dot: "#BEF264", bg: "#F7FEE7", label: "#3F6212" },
  D: { dot: "#D9F99D", bg: "#FEFCE8", label: "#713F12" },
};

const WEEKDAYS = ["일","월","화","수","목","금","토"];

export default function Calendar({ month, events, confirmed, freeWindows }) {
  const base  = dayjs(`${month}-01`);
  const today = dayjs().format("YYYY-MM-DD");

  const eventMap = useMemo(() => {
    const m = {};
    for (const e of events) m[e.date] = [...(m[e.date] || []), e.label];
    return m;
  }, [events]);

  const confirmedMap = useMemo(() => {
    const m = {};
    for (const c of confirmed) m[c.date] = c.activity;
    return m;
  }, [confirmed]);

  const gradeMap = useMemo(() => {
    const m = {};
    for (const w of freeWindows) for (const d of w.dates) m[d] = w.grade;
    return m;
  }, [freeWindows]);

  const { cells, numRows } = useMemo(() => {
    const blanks = Array(base.day()).fill(null);
    const days   = Array.from({ length: base.daysInMonth() }, (_, i) =>
      base.add(i, "day").format("YYYY-MM-DD")
    );
    const all = [...blanks, ...days];
    return { cells: all, numRows: Math.ceil(all.length / 7) };
  }, [base]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", userSelect:"none" }}>

      {/* Weekday row */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(7,1fr)",
        borderBottom:"1px solid var(--border)",
        background:"var(--bg)",
        flexShrink:0,
      }}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{
            textAlign:"center", padding:"10px 0",
            fontSize:11, fontWeight:700, letterSpacing:".05em",
            color: i===0 ? "#EF4444" : i===6 ? "#3B82F6" : "var(--text-3)",
          }}>{w}</div>
        ))}
      </div>

      {/* Cell grid */}
      <div style={{
        flex:1, minHeight:0,
        display:"grid",
        gridTemplateColumns:"repeat(7,1fr)",
        gridTemplateRows:`repeat(${numRows},1fr)`,
      }}>
        {cells.map((date, idx) => {
          if (!date) return (
            <div key={`b${idx}`} style={{
              background:"var(--bg)",
              borderRight:"1px solid var(--border)",
              borderBottom:"1px solid var(--border)",
            }}/>
          );

          const busy  = eventMap[date]    || [];
          const conf  = confirmedMap[date];
          const grade = gradeMap[date];
          const dow   = dayjs(date).day();
          const dn    = parseInt(date.slice(-2), 10);
          const isToday = date === today;

          let bg = "#FFFFFF";
          if (grade && !busy.length && !conf) bg = GRADE[grade]?.bg || "#fff";
          if (busy.length) bg = "#FFFBEB";
          if (conf)        bg = "#EFF6FF";

          return (
            <div key={date} style={{
              background: bg,
              borderRight:"1px solid var(--border)",
              borderBottom:"1px solid var(--border)",
              padding:"6px 7px",
              overflow:"hidden",
              transition:"background .12s",
              cursor:"default",
            }}
            onMouseEnter={e => e.currentTarget.style.background = adjustBrightness(bg, -3)}
            onMouseLeave={e => e.currentTarget.style.background = bg}
            >
              {/* Number row */}
              <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
                <span style={{
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  width:22, height:22, borderRadius:"50%", flexShrink:0,
                  fontSize:11, fontWeight: isToday ? 800 : 500,
                  background: isToday ? "var(--accent)" : "transparent",
                  color: isToday ? "#fff" : dow===0 ? "#EF4444" : dow===6 ? "#3B82F6" : "var(--text-1)",
                }}>{dn}</span>

                {grade && !busy.length && !conf && (
                  <span style={{
                    fontSize:9, fontWeight:700, lineHeight:"15px",
                    color: GRADE[grade]?.label,
                    background:"white",
                    border:`1px solid ${GRADE[grade]?.dot}`,
                    borderRadius:4, padding:"0 4px",
                  }}>{grade}</span>
                )}
              </div>

              {busy.slice(0,2).map((l,i)=>(
                <div key={i} style={{
                  fontSize:9, lineHeight:1.4, marginBottom:2,
                  background:"#FEF08A", color:"#713F12",
                  borderRadius:3, padding:"1px 5px",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>{l}</div>
              ))}
              {busy.length > 2 && <div style={{fontSize:9,color:"var(--text-3)"}}>+{busy.length-2}</div>}
              {conf && (
                <div style={{
                  fontSize:9, lineHeight:1.4,
                  background:"#BFDBFE", color:"#1E3A8A",
                  borderRadius:3, padding:"1px 5px",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>✓ {conf}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display:"flex", flexWrap:"wrap", gap:14,
        padding:"8px 14px", flexShrink:0,
        borderTop:"1px solid var(--border)",
        background:"var(--bg)",
      }}>
        {Object.entries(GRADE).map(([g, {dot}]) => (
          <span key={g} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"var(--text-2)" }}>
            <span style={{ width:8, height:8, borderRadius:2, background:dot, display:"inline-block" }}/>
            {g}등급
          </span>
        ))}
        <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"var(--text-2)" }}>
          <span style={{ width:8, height:8, borderRadius:2, background:"#FEF08A", display:"inline-block" }}/>일정
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"var(--text-2)" }}>
          <span style={{ width:8, height:8, borderRadius:2, background:"#BFDBFE", display:"inline-block" }}/>확정
        </span>
      </div>
    </div>
  );
}

function adjustBrightness(hex, pct) {
  // very subtle darkening on hover by returning a slightly different value
  if (hex === "#FFFFFF") return "#F9F9F9";
  if (hex === "#FFFBEB") return "#FEF3C7";
  if (hex === "#EFF6FF") return "#DBEAFE";
  return hex;
}
