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

const MOCK   = import.meta.env.VITE_MOCK_MODE === "true";
const API    = import.meta.env.VITE_API_URL || "http://localhost:8000";
const UID    = "default-user";
const GRADES = { S:"#10B981", A:"#34D399", B:"#86EFAC", C:"#BEF264", D:"#D9F99D" };

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
        const [e, c, w] = await Promise.all([apiFetchEvents(month), apiFetchConfirmed(month), apiFetchFreeWindows(month)]);
        setEvents(e); setConfirmed(c); setWindows(w.free_windows || []);
      } else {
        const [eR, cR, wR] = await Promise.all([
          fetch(`${API}/events?month=${month}&userId=${UID}`),
          fetch(`${API}/confirmed?month=${month}&userId=${UID}`),
          fetch(`${API}/free-windows?month=${month}&userId=${UID}`),
        ]);
        setEvents(await eR.json());
        setConfirmed(await cR.json());
        setWindows((await wR.json()).free_windows || []);
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
      setLabel(""); load(); notify("일정이 추가됐어요!");
    } catch { notify("추가 실패", "error"); }
    finally { setSaving(false); }
  }

  async function deleteEvent(id, lbl) {
    try {
      if (MOCK) await apiDeleteEvent(id);
      else await fetch(`${API}/events/${id}`, { method:"DELETE" });
      load(); notify(`"${lbl}" 삭제됐어요.`);
    } catch { notify("삭제 실패", "error"); }
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
    } catch { notify("추천 불러오기 실패", "error"); }
  }

  async function confirm(act) {
    const d = windows[0]?.dates[0] || dayjs().format("YYYY-MM-DD");
    const g = windows[0]?.grade    || "D";
    try {
      if (MOCK) await apiCreateConfirmed({ user_id:UID, date:d, activity:act.title, grade:g });
      else await fetch(`${API}/confirmed`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ user_id:UID, date:d, activity:act.title, grade:g }) });
      setActs([]); load(); notify(`"${act.title}" 확정! 🎉`);
    } catch { notify("확정 실패", "error"); }
  }

  const prev = () => setMonth(dayjs(`${month}-01`).subtract(1,"month").format("YYYY-MM"));
  const next = () => setMonth(dayjs(`${month}-01`).add(1,"month").format("YYYY-MM"));
  const ml   = dayjs(`${month}-01`).format("YYYY년 M월");

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)", fontFamily:"inherit" }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <header style={{
        height:"var(--header)", flexShrink:0,
        display:"flex", alignItems:"center", gap:20, padding:"0 24px",
        background:"rgba(255,255,255,0.85)", backdropFilter:"blur(16px)",
        borderBottom:"1px solid var(--border)",
        boxShadow:"0 1px 0 var(--border)",
      }}>
        {/* Brand */}
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{
            width:30, height:30, borderRadius:8,
            background:"linear-gradient(135deg, var(--accent), #7C83D4)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:15, boxShadow:"0 2px 8px rgba(92,107,192,.35)",
          }}>🗓</div>
          <span style={{ fontWeight:800, fontSize:16, color:"var(--text-1)", letterSpacing:"-.01em" }}>Brissy</span>
        </div>

        <div style={{ width:1, height:20, background:"var(--border)" }} />

        {/* Month nav */}
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <NavBtn onClick={prev}>‹</NavBtn>
          <span style={{ fontWeight:700, fontSize:14, minWidth:96, textAlign:"center", color:"var(--text-1)" }}>{ml}</span>
          <NavBtn onClick={next}>›</NavBtn>
          <NavBtn onClick={() => setMonth(dayjs().format("YYYY-MM"))} small>오늘</NavBtn>
        </div>

        {loading && <span style={{ fontSize:11, color:"var(--text-3)" }}>불러오는 중…</span>}

        {/* Right stats */}
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          {events.length    > 0 && <Pill bg="#FFFBEB" color="#92400E">📋 {events.length}개 일정</Pill>}
          {windows.length   > 0 && <Pill bg="var(--green-light)" color="#166534">✦ {windows[0].grade}등급 빈 날</Pill>}
          {confirmed.length > 0 && <Pill bg="var(--blue-light)" color="#1E40AF">✓ {confirmed.length}개 확정</Pill>}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex:1, display:"flex", minHeight:0 }}>

        {/* Calendar panel */}
        <div style={{
          flex:1, minWidth:0,
          background:"#fff",
          borderRight:"1px solid var(--border)",
        }}>
          <Calendar month={month} events={events} confirmed={confirmed} freeWindows={windows} />
        </div>

        {/* Sidebar */}
        <div style={{
          width:316, flexShrink:0,
          display:"flex", flexDirection:"column",
          background:"var(--bg)",
          overflow:"hidden",
        }}>

          {/* Add form */}
          <form onSubmit={addEvent} style={{
            padding:"16px", background:"#fff",
            borderBottom:"1px solid var(--border)",
            flexShrink:0,
          }}>
            <p style={{ fontSize:11, fontWeight:700, color:"var(--text-3)", letterSpacing:".07em", textTransform:"uppercase", marginBottom:10 }}>
              일정 추가
            </p>
            <div style={{ display:"flex", gap:7, marginBottom:8 }}>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                style={{ ...inp, width:128, flexShrink:0 }} />
              <input type="text" placeholder="내용 입력…" value={label}
                onChange={e=>setLabel(e.target.value)} maxLength={50}
                style={{ ...inp, flex:1 }}
                onFocus={e=>e.target.style.borderColor="var(--accent)"}
                onBlur={e=>e.target.style.borderColor="var(--border)"}
              />
            </div>
            <button type="submit" disabled={saving || !label.trim()} style={{
              width:"100%", padding:"9px",
              background: saving || !label.trim() ? "var(--border-2)" : "var(--accent)",
              color: saving || !label.trim() ? "var(--text-3)" : "#fff",
              border:"none", borderRadius:9, fontSize:13, fontWeight:600,
              cursor: saving || !label.trim() ? "not-allowed" : "pointer",
              transition:"background .2s, color .2s",
            }}
            onMouseEnter={e => { if(!saving && label.trim()) e.currentTarget.style.background="var(--accent-hover)"; }}
            onMouseLeave={e => { if(!saving && label.trim()) e.currentTarget.style.background="var(--accent)"; }}
            >
              {saving ? "추가 중…" : "+ 추가"}
            </button>
          </form>

          {/* Tabs */}
          <div style={{ display:"flex", background:"#fff", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            {[
              ["events",     `일정${events.length ? ` · ${events.length}` : ""}`],
              ["windows",    `빈 날${windows.length ? ` · ${windows.length}` : ""}`],
              ["activities", "추천"],
            ].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                flex:1, padding:"10px 6px",
                background:"none", border:"none",
                borderBottom: tab===k ? "2px solid var(--accent)" : "2px solid transparent",
                fontSize:12, fontWeight: tab===k ? 700 : 500,
                color: tab===k ? "var(--accent)" : "var(--text-3)",
                cursor:"pointer", transition:"all .15s",
              }}>{l}</button>
            ))}
          </div>

          {/* Tab body */}
          <div style={{ flex:1, overflowY:"auto", padding:"14px" }}>

            {tab === "events" && (
              events.length === 0
                ? <Empty icon="📭" label="등록된 일정이 없어요" sub="GPTs나 위 폼으로 추가해보세요" />
                : events.map(ev => <EventCard key={ev.id} event={ev} onDelete={id => deleteEvent(id, ev.label)} />)
            )}

            {tab === "windows" && (
              windows.length === 0
                ? <Empty icon="🎉" label="빈 날이 없어요" sub="일정을 추가하면 자동 계산됩니다" />
                : windows.map((w, i) => (
                  <div key={i} style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"10px 12px", marginBottom:6,
                    background: i===0 ? "var(--green-light)" : "#fff",
                    border:`1px solid ${i===0 ? "#A7F3D0" : "var(--border)"}`,
                    borderRadius:10,
                    boxShadow: i===0 ? "0 2px 8px rgba(16,185,129,.12)" : "var(--shadow-sm)",
                  }}>
                    <div style={{
                      width:34, height:34, borderRadius:9, flexShrink:0,
                      background: GRADES[w.grade] + "33",
                      border:`2px solid ${GRADES[w.grade]}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:12, fontWeight:800, color: GRADES[w.grade],
                      filter:"brightness(.75)",
                    }}>{w.grade}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"var(--text-1)" }}>
                        {w.dates[0]}{w.dates.length>1 ? ` ~ ${w.dates[w.dates.length-1]}` : ""}
                      </div>
                      <div style={{ fontSize:10, color:"var(--text-3)", marginTop:2 }}>
                        {w.duration_days}일{w.has_weekend ? " · 주말 포함" : ""}
                      </div>
                    </div>
                    {w.has_weekend && (
                      <span style={{ fontSize:9, fontWeight:700, background:"#3B82F6", color:"#fff", borderRadius:5, padding:"2px 7px" }}>주말</span>
                    )}
                  </div>
                ))
            )}

            {tab === "activities" && (
              <div>
                <div style={{ display:"flex", gap:7, marginBottom:10 }}>
                  <select value={region} onChange={e=>setRegion(e.target.value)} style={{ ...inp, flex:1 }}>
                    {["서울","부산","제주","강원","경주","전주"].map(r => <option key={r}>{r}</option>)}
                  </select>
                  <select value={season} onChange={e=>setSeason(e.target.value)} style={{ ...inp, flex:1 }}>
                    {[["spring","🌸 봄"],["summer","☀️ 여름"],["fall","🍂 가을"],["winter","❄️ 겨울"]].map(([v,l])=>(
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <button onClick={recommend} style={{
                  width:"100%", marginBottom:14,
                  background:"linear-gradient(135deg, var(--accent), #7C83D4)",
                  color:"#fff", border:"none", borderRadius:9,
                  padding:"9px", fontSize:13, fontWeight:600,
                  boxShadow:"0 4px 14px rgba(92,107,192,.35)",
                  cursor:"pointer", transition:"opacity .15s",
                }}
                onMouseEnter={e=>e.currentTarget.style.opacity=".88"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                >✨ 추천 받기</button>
                {activities.length === 0
                  ? <Empty icon="🗺" label="활동 추천" sub="지역과 계절을 선택하고 추천 받기를 눌러보세요" />
                  : activities.map(a => <ActivityCard key={a.id} activity={a} onConfirm={confirm} />)
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBtn({ onClick, children, small }) {
  return (
    <button onClick={onClick} style={{
      background:"none", border:"1px solid var(--border)",
      borderRadius:8, padding: small ? "4px 10px" : "4px 11px",
      fontSize: small ? 12 : 17, color:"var(--text-2)",
      fontWeight: small ? 600 : 400,
      transition:"all .15s",
    }}
    onMouseEnter={e=>{ e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="var(--border-2)"; }}
    onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.borderColor="var(--border)"; }}
    >{children}</button>
  );
}

function Pill({ bg, color, children }) {
  return (
    <span style={{ fontSize:11, fontWeight:600, background:bg, color, padding:"4px 10px", borderRadius:99 }}>
      {children}
    </span>
  );
}

function Empty({ icon, label, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"44px 16px", color:"var(--text-2)" }}>
      <div style={{ fontSize:38, marginBottom:12 }}>{icon}</div>
      <div style={{ fontWeight:600, fontSize:13, marginBottom:5 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:"var(--text-3)", lineHeight:1.5 }}>{sub}</div>}
    </div>
  );
}

const inp = {
  border:"1px solid var(--border)", borderRadius:8,
  padding:"8px 10px", fontSize:12, outline:"none",
  background:"#fff", color:"var(--text-1)", width:"100%",
  transition:"border-color .15s",
};
