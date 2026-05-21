import { useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
dayjs.locale("ko");

const GRADE = {
  S: { color:"#10B981", bg:"rgba(16,185,129,.15)",  text:"#10B981" },
  A: { color:"#34D399", bg:"rgba(52,211,153,.10)",  text:"#34D399" },
  B: { color:"#6EE7B7", bg:"rgba(110,231,183,.08)", text:"#6EE7B7" },
  C: { color:"#A7F3D0", bg:"rgba(167,243,208,.07)", text:"#A7F3D0" },
  D: { color:"#D1FAE5", bg:"rgba(209,250,229,.05)", text:"#D1FAE5" },
};

const WD = ["일","월","화","수","목","금","토"];

export default function Calendar({ month, events, confirmed, freeWindows }) {
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

  const gMap = useMemo(() => {
    const m = {};
    for (const w of freeWindows) for (const d of w.dates) m[d] = w.grade;
    return m;
  }, [freeWindows]);

  const { cells, rows } = useMemo(() => {
    const blanks = Array(base.day()).fill(null);
    const days   = Array.from({ length: base.daysInMonth() }, (_, i) =>
      base.add(i,"day").format("YYYY-MM-DD")
    );
    const all = [...blanks, ...days];
    return { cells: all, rows: Math.ceil(all.length / 7) };
  }, [base]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Week header */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", flexShrink:0, borderBottom:"1px solid var(--border)" }}>
        {WD.map((w,i) => (
          <div key={w} style={{
            textAlign:"center", padding:"11px 0",
            fontSize:10, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase",
            color: i===0 ? "#F87171" : i===6 ? "#60A5FA" : "var(--text-3)",
          }}>{w}</div>
        ))}
      </div>

      {/* Cells */}
      <div style={{
        flex:1, minHeight:0,
        display:"grid",
        gridTemplateColumns:"repeat(7,1fr)",
        gridTemplateRows:`repeat(${rows},1fr)`,
      }}>
        {cells.map((date, i) => {
          if (!date) return (
            <div key={`b${i}`} style={{ borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)", background:"var(--bg)" }} />
          );

          const busy  = eMap[date] || [];
          const conf  = cMap[date];
          const grade = gMap[date];
          const dow   = dayjs(date).day();
          const dn    = parseInt(date.slice(-2), 10);
          const isToday = date === today;
          const g     = grade ? GRADE[grade] : null;

          return (
            <div key={date} style={{
              borderRight:"1px solid var(--border)",
              borderBottom:"1px solid var(--border)",
              background: conf ? "rgba(96,165,250,.06)"
                        : busy.length ? "rgba(251,191,36,.05)"
                        : g ? g.bg : "var(--bg)",
              padding:"6px 7px", overflow:"hidden",
              transition:"background .15s",
              position:"relative",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-3)"}
            onMouseLeave={e => e.currentTarget.style.background = conf ? "rgba(96,165,250,.06)" : busy.length ? "rgba(251,191,36,.05)" : g ? g.bg : "var(--bg)"}
            >
              {/* Grade bar — left edge */}
              {g && !busy.length && !conf && (
                <div style={{
                  position:"absolute", left:0, top:0, bottom:0, width:2,
                  background:g.color, borderRadius:"0 1px 1px 0",
                  opacity:.8,
                }} />
              )}

              {/* Day num */}
              <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
                <span style={{
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  width:22, height:22, borderRadius:"50%", flexShrink:0,
                  fontSize:11, fontWeight: isToday ? 800 : 400,
                  background: isToday ? "var(--accent)" : "transparent",
                  color: isToday ? "#fff"
                       : dow===0 ? "#F87171"
                       : dow===6 ? "#60A5FA"
                       : "var(--text-2)",
                }}>{dn}</span>
                {g && !busy.length && !conf && (
                  <span style={{ fontSize:9, fontWeight:700, color:g.text, opacity:.8 }}>{grade}</span>
                )}
              </div>

              {busy.slice(0,2).map((l,i) => (
                <div key={i} style={{
                  fontSize:9, lineHeight:1.4, marginBottom:2,
                  color:"#FCD34D",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>· {l}</div>
              ))}
              {busy.length > 2 && <div style={{fontSize:9,color:"var(--text-3)"}}>+{busy.length-2}</div>}
              {conf && (
                <div style={{
                  fontSize:9, lineHeight:1.4, color:"#93C5FD",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>✓ {conf}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:14, padding:"8px 14px", borderTop:"1px solid var(--border)", flexShrink:0, flexWrap:"wrap" }}>
        {Object.entries(GRADE).map(([g, {color}]) => (
          <span key={g} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"var(--text-3)" }}>
            <span style={{ width:8, height:2, background:color, display:"inline-block", borderRadius:1 }}/>
            {g}등급
          </span>
        ))}
        <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"var(--text-3)" }}>
          <span style={{ fontSize:9 }}>·</span><span style={{ color:"#FCD34D" }}>일정</span>
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"var(--text-3)" }}>
          <span style={{ fontSize:9 }}>✓</span><span style={{ color:"#93C5FD" }}>확정</span>
        </span>
      </div>
    </div>
  );
}
