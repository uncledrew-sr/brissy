import { useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
dayjs.locale("ko");

const GRADE_COLOR  = { S:"#16a34a", A:"#22c55e", B:"#4ade80", C:"#86efac", D:"#d1fae5" };
const GRADE_BG     = { S:"#dcfce7", A:"#dcfce7", B:"#f0fdf4", C:"#f0fdf4", D:"#f8fffe" };
const WEEKDAYS = ["일","월","화","수","목","금","토"];

export default function Calendar({ month, events, confirmed, freeWindows }) {
  const base  = dayjs(`${month}-01`);
  const today = dayjs().format("YYYY-MM-DD");

  const eventDates = useMemo(() => {
    const m = {};
    for (const e of events) m[e.date] = [...(m[e.date]||[]), e.label];
    return m;
  }, [events]);

  const confirmedDates = useMemo(() => {
    const m = {};
    for (const c of confirmed) m[c.date] = c.activity;
    return m;
  }, [confirmed]);

  const freeDateGrade = useMemo(() => {
    const m = {};
    for (const w of freeWindows) for (const d of w.dates) m[d] = w.grade;
    return m;
  }, [freeWindows]);

  const { cells, numRows } = useMemo(() => {
    const blanks = Array(base.day()).fill(null);
    const days = Array.from({ length: base.daysInMonth() }, (_, i) =>
      base.add(i, "day").format("YYYY-MM-DD")
    );
    const all = [...blanks, ...days];
    return { cells: all, numRows: Math.ceil(all.length / 7) };
  }, [base]);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", background: "var(--card)",
    }}>
      {/* Weekday header */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7,1fr)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{
            textAlign: "center", padding: "8px 0",
            fontSize: 11, fontWeight: 700, letterSpacing: ".05em",
            color: i===0 ? "#ef4444" : i===6 ? "#3b82f6" : "var(--text-3)",
          }}>{w}</div>
        ))}
      </div>

      {/* Cells */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gridTemplateRows: `repeat(${numRows}, 1fr)`,
        minHeight: 0,
      }}>
        {cells.map((dateStr, idx) => {
          if (!dateStr) return (
            <div key={`b-${idx}`} style={{
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              background: "#f8fafc",
            }}/>
          );

          const busy  = eventDates[dateStr]    || [];
          const conf  = confirmedDates[dateStr];
          const grade = freeDateGrade[dateStr];
          const dow   = dayjs(dateStr).day();
          const dayNum = parseInt(dateStr.slice(-2), 10);
          const isToday = dateStr === today;

          let bg = "#fff";
          if (grade && !busy.length && !conf) bg = GRADE_BG[grade] || "#fff";
          if (busy.length) bg = "#fffbeb";
          if (conf) bg = "#eff6ff";

          return (
            <div key={dateStr} style={{
              background: bg,
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              padding: "5px 6px",
              overflow: "hidden",
              position: "relative",
              transition: "filter .1s",
            }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(.97)"}
            onMouseLeave={e => e.currentTarget.style.filter = "none"}
            >
              {/* Day number */}
              <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:3 }}>
                <span style={{
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  width:22, height:22, borderRadius:"50%",
                  fontSize:11, fontWeight: isToday ? 800 : 500,
                  background: isToday ? "var(--primary)" : "transparent",
                  color: isToday ? "#fff" : dow===0 ? "#ef4444" : dow===6 ? "#3b82f6" : "var(--text-1)",
                  flexShrink: 0,
                }}>
                  {dayNum}
                </span>
                {grade && !busy.length && !conf && (
                  <span style={{
                    fontSize:9, fontWeight:800,
                    color: GRADE_COLOR[grade],
                    background:"#fff",
                    border:`1px solid ${GRADE_COLOR[grade]}`,
                    borderRadius:3, padding:"0 3px", lineHeight:"15px",
                  }}>{grade}</span>
                )}
              </div>

              {/* Events */}
              {busy.slice(0,2).map((label,i) => (
                <div key={i} style={{
                  fontSize:9, lineHeight:1.3,
                  background:"#fef08a", color:"#854d0e",
                  borderRadius:3, padding:"1px 4px",
                  marginBottom:2, overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>{label}</div>
              ))}
              {busy.length > 2 && (
                <div style={{fontSize:9, color:"var(--text-3)"}}>+{busy.length-2}</div>
              )}

              {/* Confirmed */}
              {conf && (
                <div style={{
                  fontSize:9, lineHeight:1.3,
                  background:"#bfdbfe", color:"#1e40af",
                  borderRadius:3, padding:"1px 4px",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>✓ {conf}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display:"flex", gap:12, flexWrap:"wrap",
        padding:"7px 12px",
        borderTop:"1px solid var(--border)",
        background:"#f8fafc",
        flexShrink:0,
      }}>
        {Object.entries(GRADE_COLOR).map(([g,c]) => (
          <span key={g} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"var(--text-2)"}}>
            <span style={{width:8,height:8,borderRadius:2,background:c,display:"inline-block"}}/>
            {g}등급
          </span>
        ))}
        <span style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"var(--text-2)"}}>
          <span style={{width:8,height:8,borderRadius:2,background:"#fef08a",display:"inline-block"}}/>일정
        </span>
        <span style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"var(--text-2)"}}>
          <span style={{width:8,height:8,borderRadius:2,background:"#bfdbfe",display:"inline-block"}}/>확정
        </span>
      </div>
    </div>
  );
}
