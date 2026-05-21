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

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === "true";
const API       = import.meta.env.VITE_API_URL || "http://localhost:8000";
const USER_ID   = "default-user";
const GRADE_COLOR = { S:"#16a34a", A:"#22c55e", B:"#4ade80", C:"#86efac", D:"#d1fae5" };

export default function Home() {
  const [month, setMonth]               = useState(dayjs().format("YYYY-MM"));
  const [events, setEvents]             = useState([]);
  const [confirmed, setConfirmed]       = useState([]);
  const [freeWindows, setFreeWindows]   = useState([]);
  const [activities, setActivities]     = useState([]);
  const [newLabel, setNewLabel]         = useState("");
  const [newDate, setNewDate]           = useState(dayjs().format("YYYY-MM-DD"));
  const [activityRegion, setRegion]     = useState("서울");
  const [activitySeason, setSeason]     = useState("spring");
  const [loading, setLoading]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [toast, setToast]               = useState(null);
  const [tab, setTab]                   = useState("events"); // "events" | "windows" | "activities"

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      if (MOCK_MODE) {
        const [evs, confs, fw] = await Promise.all([
          apiFetchEvents(month), apiFetchConfirmed(month), apiFetchFreeWindows(month),
        ]);
        setEvents(evs); setConfirmed(confs); setFreeWindows(fw.free_windows || []);
      } else {
        const [evRes, confRes, fwRes] = await Promise.all([
          fetch(`${API}/events?month=${month}&userId=${USER_ID}`),
          fetch(`${API}/confirmed?month=${month}&userId=${USER_ID}`),
          fetch(`${API}/free-windows?month=${month}&userId=${USER_ID}`),
        ]);
        setEvents(await evRes.json());
        setConfirmed(await confRes.json());
        setFreeWindows((await fwRes.json()).free_windows || []);
      }
    } finally { setLoading(false); }
  }, [month]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (MOCK_MODE) return;
    const ev = supabase.channel("ev").on("postgres_changes",{event:"*",schema:"public",table:"events"},fetchAll).subscribe();
    const cf = supabase.channel("cf").on("postgres_changes",{event:"*",schema:"public",table:"confirmed"},fetchAll).subscribe();
    return () => { supabase.removeChannel(ev); supabase.removeChannel(cf); };
  }, [fetchAll]);

  async function handleAddEvent(e) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setSubmitting(true);
    try {
      if (MOCK_MODE) await apiCreateEvent({ user_id:USER_ID, date:newDate, label:newLabel.trim() });
      else {
        const res = await fetch(`${API}/events`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ user_id:USER_ID, date:newDate, label:newLabel.trim() }),
        });
        if (!res.ok) throw new Error();
      }
      setNewLabel(""); fetchAll(); showToast("일정이 추가됐어요!");
    } catch { showToast("일정 추가 실패", "error"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id, label) {
    try {
      if (MOCK_MODE) await apiDeleteEvent(id);
      else await fetch(`${API}/events/${id}`, { method:"DELETE" });
      fetchAll(); showToast(`"${label}" 삭제됐어요.`);
    } catch { showToast("삭제 실패", "error"); }
  }

  async function fetchActivities() {
    const grade = freeWindows[0]?.grade;
    try {
      if (MOCK_MODE) {
        const d = await apiFetchActivities({ grade, region:activityRegion, season:activitySeason });
        setActivities(d.activities || []);
      } else {
        const p = new URLSearchParams({ region:activityRegion, season:activitySeason });
        if (grade) p.append("grade", grade);
        const d = await (await fetch(`${API}/activities?${p}`)).json();
        setActivities(d.activities || []);
      }
      setTab("activities");
    } catch { showToast("추천 불러오기 실패", "error"); }
  }

  async function handleConfirm(activity) {
    const startDate = freeWindows[0]?.dates[0] || dayjs().format("YYYY-MM-DD");
    const grade     = freeWindows[0]?.grade     || "D";
    try {
      if (MOCK_MODE) await apiCreateConfirmed({ user_id:USER_ID, date:startDate, activity:activity.title, grade });
      else await fetch(`${API}/confirmed`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ user_id:USER_ID, date:startDate, activity:activity.title, grade }),
      });
      setActivities([]); fetchAll();
      showToast(`"${activity.title}" 확정! 🎉`);
    } catch { showToast("확정 실패", "error"); }
  }

  const monthLabel = dayjs(`${month}-01`).format("YYYY년 M월");

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <header style={{
        height:"var(--header)", flexShrink:0,
        background:"#fff", borderBottom:"1px solid var(--border)",
        display:"flex", alignItems:"center",
        padding:"0 20px", gap:16,
        boxShadow:"0 1px 4px rgba(0,0,0,.05)",
      }}>
        {/* Logo */}
        <div style={{display:"flex", alignItems:"center", gap:8, marginRight:8}}>
          <span style={{fontSize:20}}>🗓</span>
          <span style={{fontWeight:800, fontSize:16, color:"var(--text-1)"}}>Brissy</span>
        </div>

        {/* Month nav */}
        <div style={{display:"flex", alignItems:"center", gap:6}}>
          <button
            onClick={() => setMonth(dayjs(`${month}-01`).subtract(1,"month").format("YYYY-MM"))}
            style={navBtn}
          >‹</button>
          <span style={{fontWeight:700, fontSize:14, minWidth:90, textAlign:"center", color:"var(--text-1)"}}>
            {monthLabel}
          </span>
          <button
            onClick={() => setMonth(dayjs(`${month}-01`).add(1,"month").format("YYYY-MM"))}
            style={navBtn}
          >›</button>
        </div>

        <button
          onClick={() => setMonth(dayjs().format("YYYY-MM"))}
          style={{...navBtn, fontSize:11, padding:"3px 10px", color:"var(--text-2)"}}
        >
          오늘
        </button>

        {loading && (
          <span style={{fontSize:11, color:"var(--text-3)"}}>불러오는 중…</span>
        )}

        {/* Stats pills */}
        <div style={{marginLeft:"auto", display:"flex", gap:8}}>
          {events.length > 0 && (
            <span style={pill("#fffbeb","#92400e")}>{events.length}개 일정</span>
          )}
          {freeWindows.length > 0 && (
            <span style={pill("var(--primary-light)","var(--primary)")}>
              {freeWindows[0]?.grade}등급 빈 날
            </span>
          )}
          {confirmed.length > 0 && (
            <span style={pill("#eff6ff","#1e40af")}>{confirmed.length}개 확정</span>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex:1, display:"flex", minHeight:0, overflow:"hidden" }}>

        {/* ── Left: Calendar ── */}
        <div style={{
          flex:1, minWidth:0,
          display:"flex", flexDirection:"column",
          borderRight:"1px solid var(--border)",
          background:"#fff",
        }}>
          <Calendar
            month={month}
            events={events}
            confirmed={confirmed}
            freeWindows={freeWindows}
          />
        </div>

        {/* ── Right: Sidebar ── */}
        <div style={{
          width:320, flexShrink:0,
          display:"flex", flexDirection:"column",
          background:"var(--bg)",
          overflow:"hidden",
        }}>
          {/* Quick add */}
          <form onSubmit={handleAddEvent} style={{
            padding:"14px 16px",
            background:"#fff",
            borderBottom:"1px solid var(--border)",
            flexShrink:0,
          }}>
            <div style={{fontSize:11, fontWeight:700, color:"var(--text-3)", letterSpacing:".06em", marginBottom:8}}>
              ＋ 일정 추가
            </div>
            <div style={{display:"flex", gap:6, marginBottom:8}}>
              <input
                type="date" value={newDate}
                onChange={e => setNewDate(e.target.value)}
                style={{...sideInput, width:130, flexShrink:0}}
              />
              <input
                type="text" placeholder="내용 입력…"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                style={{...sideInput, flex:1}}
                maxLength={50}
              />
            </div>
            <button type="submit" disabled={submitting || !newLabel.trim()} style={{
              width:"100%", background:"var(--primary)", color:"#fff",
              border:"none", borderRadius:7, padding:"8px",
              fontSize:12, fontWeight:600, cursor:"pointer",
              opacity: submitting || !newLabel.trim() ? .5 : 1,
              transition:"background .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background="var(--primary-hover)"}
            onMouseLeave={e => e.currentTarget.style.background="var(--primary)"}
            >
              {submitting ? "추가 중…" : "추가"}
            </button>
          </form>

          {/* Tabs */}
          <div style={{
            display:"flex", background:"#fff",
            borderBottom:"1px solid var(--border)",
            flexShrink:0,
          }}>
            {[
              ["events",   `일정 ${events.length ? `(${events.length})` : ""}`],
              ["windows",  `빈 날 ${freeWindows.length ? `(${freeWindows.length})` : ""}`],
              ["activities","추천"],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex:1, padding:"9px 4px",
                background:"none", border:"none",
                fontSize:11, fontWeight: tab===key ? 700 : 500,
                color: tab===key ? "var(--primary)" : "var(--text-3)",
                borderBottom: tab===key ? "2px solid var(--primary)" : "2px solid transparent",
                cursor:"pointer", transition:"all .15s",
              }}>{label}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex:1, overflowY:"auto", padding:"14px 14px" }}>

            {/* Events tab */}
            {tab === "events" && (
              <div>
                {events.length === 0 ? (
                  <EmptyState icon="📭" text="등록된 일정이 없어요" sub="GPTs 채팅이나 위 폼으로 추가해보세요" />
                ) : (
                  events.map(ev => (
                    <EventCard key={ev.id} event={ev} onDelete={(id) => handleDelete(id, ev.label)} />
                  ))
                )}
              </div>
            )}

            {/* Free windows tab */}
            {tab === "windows" && (
              <div>
                {freeWindows.length === 0 ? (
                  <EmptyState icon="🎉" text="빈 날이 없어요" sub="일정을 추가하면 빈 날이 계산됩니다" />
                ) : (
                  freeWindows.map((w, i) => (
                    <div key={i} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"10px 12px", marginBottom:6,
                      background: i===0 ? "var(--primary-light)" : "#fff",
                      border:`1px solid ${i===0 ? "var(--primary-border)" : "var(--border)"}`,
                      borderRadius:"var(--radius-sm)",
                    }}>
                      <div style={{display:"flex", alignItems:"center", gap:10}}>
                        <span style={{
                          width:28, height:28, borderRadius:6,
                          background: GRADE_COLOR[w.grade] + "33",
                          border:`1.5px solid ${GRADE_COLOR[w.grade]}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:11, fontWeight:800, color: GRADE_COLOR[w.grade],
                        }}>{w.grade}</span>
                        <div>
                          <div style={{fontSize:12, fontWeight:600, color:"var(--text-1)"}}>
                            {w.dates[0]}{w.dates.length > 1 ? ` ~ ${w.dates[w.dates.length-1]}` : ""}
                          </div>
                          <div style={{fontSize:10, color:"var(--text-3)", marginTop:1}}>
                            {w.duration_days}일{w.has_weekend ? " · 주말 포함" : ""}
                          </div>
                        </div>
                      </div>
                      {w.has_weekend && (
                        <span style={{fontSize:9, background:"#3b82f6", color:"#fff", borderRadius:4, padding:"2px 6px", fontWeight:700}}>주말</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Activities tab */}
            {tab === "activities" && (
              <div>
                {/* Filter row */}
                <div style={{display:"flex", gap:6, marginBottom:12}}>
                  <select value={activityRegion} onChange={e => setRegion(e.target.value)} style={{...sideInput, flex:1}}>
                    {["서울","부산","제주","강원","경주","전주"].map(r => <option key={r}>{r}</option>)}
                  </select>
                  <select value={activitySeason} onChange={e => setSeason(e.target.value)} style={{...sideInput, flex:1}}>
                    {[["spring","🌸봄"],["summer","☀️여름"],["fall","🍂가을"],["winter","❄️겨울"]].map(([v,l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <button onClick={fetchActivities} style={{
                  width:"100%", marginBottom:12,
                  background:"var(--primary)", color:"#fff",
                  border:"none", borderRadius:7, padding:"8px",
                  fontSize:12, fontWeight:600, cursor:"pointer",
                  transition:"background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background="var(--primary-hover)"}
                onMouseLeave={e => e.currentTarget.style.background="var(--primary)"}
                >
                  ✨ 추천 받기
                </button>
                {activities.length === 0 ? (
                  <EmptyState icon="🗺" text="활동 추천" sub="지역과 계절을 선택하고 추천 받기를 눌러보세요" />
                ) : (
                  activities.map(a => <ActivityCard key={a.id} activity={a} onConfirm={handleConfirm} />)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 16px", color:"var(--text-2)" }}>
      <div style={{ fontSize:36, marginBottom:10 }}>{icon}</div>
      <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{text}</div>
      {sub && <div style={{ fontSize:11, color:"var(--text-3)" }}>{sub}</div>}
    </div>
  );
}

// Styles
const navBtn = {
  background:"none", border:"1px solid var(--border)",
  borderRadius:7, padding:"4px 10px",
  fontSize:16, color:"var(--text-2)", cursor:"pointer",
  transition:"all .15s",
};

const sideInput = {
  border:"1px solid var(--border)", borderRadius:7,
  padding:"7px 10px", fontSize:12, outline:"none",
  background:"#fff", color:"var(--text-1)",
  width:"100%",
};

const pill = (bg, color) => ({
  fontSize:11, fontWeight:600,
  background:bg, color,
  padding:"3px 10px", borderRadius:99,
});
