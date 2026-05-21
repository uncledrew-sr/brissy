import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { supabase } from "../supabaseClient";
import Calendar from "../components/Calendar";
import EventCard from "../components/EventCard";
import ActivityCard from "../components/ActivityCard";
import Toast from "../components/Toast";
import {
  apiFetchEvents, apiCreateEvent, apiDeleteEvent,
  apiFetchConfirmed, apiCreateConfirmed,
  apiFetchFreeWindows, apiFetchActivities,
} from "../mockApi";

dayjs.locale("ko");

const MOCK = import.meta.env.VITE_MOCK_MODE === "true";
const API  = import.meta.env.VITE_API_URL || "http://localhost:8000";
const UID  = "default-user";

const GRADE_COLOR = { S:"#10B981", A:"#34D399", B:"#6EE7B7", C:"#A7F3D0", D:"#D1FAE5" };

export default function Home() {
  const [month, setMonth]         = useState(dayjs().format("YYYY-MM"));
  const [events, setEvents]       = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  const [windows, setWindows]     = useState([]);
  const [activities, setActs]     = useState([]);
  const [label, setLabel]         = useState("");
  const [date, setDate]           = useState(dayjs().format("YYYY-MM-DD"));
  const [region, setRegion]       = useState("서울");
  const [season, setSeason]       = useState("spring");
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [tab, setTab]             = useState("events");

  const notify = (msg, type="success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (MOCK) {
        const [e,c,w] = await Promise.all([apiFetchEvents(month), apiFetchConfirmed(month), apiFetchFreeWindows(month)]);
        setEvents(e); setConfirmed(c); setWindows(w.free_windows||[]);
      } else {
        const [eR,cR,wR] = await Promise.all([
          fetch(`${API}/events?month=${month}&userId=${UID}`),
          fetch(`${API}/confirmed?month=${month}&userId=${UID}`),
          fetch(`${API}/free-windows?month=${month}&userId=${UID}`),
        ]);
        setEvents(await eR.json());
        setConfirmed(await cR.json());
        setWindows((await wR.json()).free_windows||[]);
      }
    } finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (MOCK) return;
    const a = supabase.channel("ev").on("postgres_changes",{event:"*",schema:"public",table:"events"},load).subscribe();
    const b = supabase.channel("cf").on("postgres_changes",{event:"*",schema:"public",table:"confirmed"},load).subscribe();
    return () => { supabase.removeChannel(a); supabase.removeChannel(b); };
  }, [load]);

  async function addEvent(e) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      if (MOCK) await apiCreateEvent({ user_id:UID, date, label:label.trim() });
      else {
        const r = await fetch(`${API}/events`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ user_id:UID, date, label:label.trim() }) });
        if (!r.ok) throw 0;
      }
      setLabel(""); load(); notify("일정이 추가됐어요");
    } catch { notify("추가 실패", "error"); }
    finally { setSaving(false); }
  }

  async function del(id, lbl) {
    try {
      if (MOCK) await apiDeleteEvent(id);
      else await fetch(`${API}/events/${id}`, { method:"DELETE" });
      load(); notify(`삭제됐어요`);
    } catch { notify("삭제 실패","error"); }
  }

  async function recommend() {
    const grade = windows[0]?.grade;
    try {
      if (MOCK) { const d = await apiFetchActivities({ grade, region, season }); setActs(d.activities||[]); }
      else {
        const p = new URLSearchParams({ region, season });
        if (grade) p.append("grade", grade);
        setActs(((await (await fetch(`${API}/activities?${p}`)).json()).activities)||[]);
      }
      setTab("activities");
    } catch { notify("추천 실패","error"); }
  }

  async function confirm(act) {
    const d = windows[0]?.dates[0] || dayjs().format("YYYY-MM-DD");
    const g = windows[0]?.grade    || "D";
    try {
      if (MOCK) await apiCreateConfirmed({ user_id:UID, date:d, activity:act.title, grade:g });
      else await fetch(`${API}/confirmed`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ user_id:UID, date:d, activity:act.title, grade:g }) });
      setActs([]); load(); notify(`"${act.title}" 확정! 🎉`);
    } catch { notify("확정 실패","error"); }
  }

  const ml = dayjs(`${month}-01`).format("YYYY년 M월");

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)" }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}

      {/* Header */}
      <header style={{
        height:"var(--header)", flexShrink:0,
        display:"flex", alignItems:"center", gap:16, padding:"0 20px",
        background:"var(--bg-2)",
        borderBottom:"1px solid var(--border)",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>🗓</span>
          <span style={{ fontWeight:700, fontSize:15, color:"var(--text-1)", letterSpacing:"-.01em" }}>Brissy</span>
        </div>

        <div style={{ width:1, height:16, background:"var(--border)" }}/>

        {/* Month nav */}
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <Btn onClick={()=>setMonth(dayjs(`${month}-01`).subtract(1,"month").format("YYYY-MM"))}>‹</Btn>
          <span style={{ fontSize:13, fontWeight:600, color:"var(--text-1)", minWidth:92, textAlign:"center" }}>{ml}</span>
          <Btn onClick={()=>setMonth(dayjs(`${month}-01`).add(1,"month").format("YYYY-MM"))}>›</Btn>
          <Btn onClick={()=>setMonth(dayjs().format("YYYY-MM"))} small>오늘</Btn>
        </div>

        {loading && <span style={{ fontSize:10, color:"var(--text-3)" }}>동기화 중…</span>}

        {/* Stats */}
        <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
          {events.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text-2)" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#FCD34D", display:"inline-block" }}/>
              일정 {events.length}
            </div>
          )}
          {windows.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text-2)" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:GRADE_COLOR[windows[0].grade], display:"inline-block" }}/>
              최우선 {windows[0].grade}등급
            </div>
          )}
          {confirmed.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text-2)" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#60A5FA", display:"inline-block" }}/>
              확정 {confirmed.length}
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div style={{ flex:1, display:"flex", minHeight:0 }}>

        {/* Calendar */}
        <div style={{ flex:1, minWidth:0, borderRight:"1px solid var(--border)" }}>
          <Calendar month={month} events={events} confirmed={confirmed} freeWindows={windows} />
        </div>

        {/* Sidebar */}
        <div style={{
          width:300, flexShrink:0,
          display:"flex", flexDirection:"column",
          background:"var(--bg-2)",
          overflow:"hidden",
        }}>

          {/* Add event */}
          <form onSubmit={addEvent} style={{
            padding:"14px 14px 12px",
            borderBottom:"1px solid var(--border)",
            flexShrink:0,
          }}>
            <p style={{ fontSize:10, fontWeight:700, color:"var(--text-3)", letterSpacing:".1em", textTransform:"uppercase", marginBottom:9 }}>일정 추가</p>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ ...inp, marginBottom:6 }} />
            <input
              type="text" placeholder="내용을 입력하세요…" value={label}
              onChange={e=>setLabel(e.target.value)} maxLength={50}
              style={{ ...inp, marginBottom:8 }}
              onFocus={e=>e.target.style.borderColor="var(--accent)"}
              onBlur={e=>e.target.style.borderColor="var(--border)"}
            />
            <button type="submit" disabled={saving||!label.trim()} style={{
              width:"100%", padding:"8px",
              background: saving||!label.trim() ? "var(--bg-3)" : "var(--accent)",
              color: saving||!label.trim() ? "var(--text-3)" : "#fff",
              border:"1px solid " + (saving||!label.trim() ? "var(--border)" : "var(--accent)"),
              borderRadius:"var(--rs)", fontSize:12, fontWeight:600,
              transition:"all .2s",
              cursor: saving||!label.trim() ? "not-allowed" : "pointer",
            }}>{saving ? "추가 중…" : "추가"}</button>
          </form>

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            {[
              ["events",     `일정${events.length ? ` (${events.length})` : ""}`],
              ["windows",    `빈 날${windows.length ? ` (${windows.length})` : ""}`],
              ["activities", "추천"],
            ].map(([k,l]) => (
              <button key={k} onClick={()=>setTab(k)} style={{
                flex:1, padding:"9px 4px",
                background:"none", border:"none",
                borderBottom:`2px solid ${tab===k ? "var(--accent)" : "transparent"}`,
                fontSize:11, fontWeight: tab===k ? 700 : 500,
                color: tab===k ? "var(--accent-2)" : "var(--text-3)",
                transition:"all .15s",
              }}>{l}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>

            {tab==="events" && (
              events.length===0
                ? <Empty icon="📭" text="등록된 일정이 없어요" sub="GPTs나 위 폼으로 추가해보세요" />
                : events.map(ev => <EventCard key={ev.id} event={ev} onDelete={id=>del(id,ev.label)} />)
            )}

            {tab==="windows" && (
              windows.length===0
                ? <Empty icon="✦" text="빈 날이 없어요" sub="일정을 추가하면 자동 계산됩니다" />
                : windows.map((w,i) => (
                  <div key={i} style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"9px 10px", marginBottom:5,
                    background:"var(--bg-3)",
                    border:`1px solid ${i===0 ? GRADE_COLOR[w.grade]+"40" : "var(--border)"}`,
                    borderRadius:"var(--rs)",
                    position:"relative", overflow:"hidden",
                  }}>
                    {i===0 && (
                      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background:GRADE_COLOR[w.grade] }} />
                    )}
                    <div style={{
                      width:30, height:30, borderRadius:6, flexShrink:0,
                      background:`${GRADE_COLOR[w.grade]}18`,
                      border:`1px solid ${GRADE_COLOR[w.grade]}40`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, fontWeight:800, color:GRADE_COLOR[w.grade],
                    }}>{w.grade}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"var(--text-1)" }}>
                        {w.dates[0]}{w.dates.length>1 ? ` ~ ${w.dates[w.dates.length-1]}` : ""}
                      </div>
                      <div style={{ fontSize:10, color:"var(--text-3)", marginTop:2 }}>
                        {w.duration_days}일{w.has_weekend ? " · 주말 포함" : ""}
                      </div>
                    </div>
                    {w.has_weekend && (
                      <span style={{ fontSize:9, fontWeight:700, color:"#60A5FA", background:"rgba(96,165,250,.12)", borderRadius:4, padding:"2px 6px" }}>주말</span>
                    )}
                  </div>
                ))
            )}

            {tab==="activities" && (
              <div>
                <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                  <select value={region} onChange={e=>setRegion(e.target.value)} style={{...inp, flex:1}}>
                    {["서울","부산","제주","강원","경주","전주"].map(r=><option key={r}>{r}</option>)}
                  </select>
                  <select value={season} onChange={e=>setSeason(e.target.value)} style={{...inp, flex:1}}>
                    {[["spring","🌸봄"],["summer","☀️여름"],["fall","🍂가을"],["winter","❄️겨울"]].map(([v,l])=>(
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <button onClick={recommend} style={{
                  width:"100%", marginBottom:12,
                  background:"var(--accent-bg)", color:"var(--accent-2)",
                  border:"1px solid rgba(249,115,22,.25)",
                  borderRadius:"var(--rs)", padding:"9px",
                  fontSize:12, fontWeight:600, transition:"all .15s",
                }}
                onMouseEnter={e=>{ e.currentTarget.style.background="var(--accent)"; e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="var(--accent)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="var(--accent-bg)"; e.currentTarget.style.color="var(--accent-2)"; e.currentTarget.style.borderColor="rgba(249,115,22,.25)"; }}
                >✦ 추천 받기</button>
                {activities.length===0
                  ? <Empty icon="🗺" text="활동 추천" sub="지역과 계절을 선택하고\n추천 받기를 눌러보세요" />
                  : activities.map(a=><ActivityCard key={a.id} activity={a} onConfirm={confirm}/>)
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Btn({ onClick, children, small }) {
  return (
    <button onClick={onClick} style={{
      background:"none", border:"1px solid var(--border)",
      borderRadius:6, padding: small ? "3px 9px" : "3px 10px",
      fontSize: small ? 11 : 16, color:"var(--text-2)",
      fontWeight: small ? 600 : 400,
      transition:"all .15s",
    }}
    onMouseEnter={e=>{ e.currentTarget.style.borderColor="var(--border-2)"; e.currentTarget.style.color="var(--text-1)"; }}
    onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-2)"; }}
    >{children}</button>
  );
}

function Empty({ icon, text, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 12px", color:"var(--text-3)" }}>
      <div style={{ fontSize:32, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:12, fontWeight:600, color:"var(--text-2)", marginBottom:5 }}>{text}</div>
      {sub && <div style={{ fontSize:11, lineHeight:1.6, whiteSpace:"pre-line" }}>{sub}</div>}
    </div>
  );
}

const inp = {
  display:"block", width:"100%",
  border:"1px solid var(--border)", borderRadius:"var(--rs)",
  padding:"8px 10px", fontSize:12, outline:"none",
  background:"var(--bg-3)", color:"var(--text-1)",
  transition:"border-color .15s",
};
