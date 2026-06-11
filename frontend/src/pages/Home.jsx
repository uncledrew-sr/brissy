import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { supabase } from "../supabaseClient";
import Calendar from "../components/Calendar";
import EventCard from "../components/EventCard";
import ActivityCard from "../components/ActivityCard";
import Toast from "../components/Toast";
import DatePopover from "../components/DatePopover";
import {
  apiFetchEvents, apiCreateEvent, apiDeleteEvent,
  apiFetchConfirmed, apiCreateConfirmed,
  apiFetchFreeWindows, apiFetchActivities,
} from "../mockApi";

dayjs.locale("ko");

const MOCK = import.meta.env.VITE_MOCK_MODE === "true";
const API  = import.meta.env.VITE_API_URL || "http://localhost:8000";
const UID  = "default-user";

const GRADE_COLOR = { S:"#047857", A:"#059669", B:"#10B981", C:"#34D399", D:"#6EE7B7" };

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
  const [tripType, setTripType]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [popoverInfo, setPopoverInfo]   = useState(null);
  const [activeSection, setActiveSection] = useState("events");

  const notify = (msg, type="success") => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (MOCK) {
        const [e,c,w] = await Promise.all([
          apiFetchEvents(month), apiFetchConfirmed(month), apiFetchFreeWindows(month),
        ]);
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
        const r = await fetch(`${API}/events`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ user_id:UID, date, label:label.trim() }),
        });
        if (!r.ok) throw 0;
      }
      setLabel(""); load(); notify("📅 일정이 추가됐어요!");
    } catch { notify("추가 실패", "error"); }
    finally { setSaving(false); }
  }

  async function del(id) {
    try {
      if (MOCK) await apiDeleteEvent(id);
      else await fetch(`${API}/events/${id}`, { method:"DELETE" });
      load(); notify("🗑 삭제됐어요");
    } catch { notify("삭제 실패","error"); }
  }

  async function recommend(overrideWindow = null) {
    const w        = overrideWindow || windows[0];
    const grade    = w?.grade;
    const max_days = w?.duration_days;
    try {
      if (MOCK) {
        const d = await apiFetchActivities({ grade, region, season, max_days, trip_type: tripType });
        setActs(d.activities||[]);
      } else {
        const p = new URLSearchParams({ region, season });
        if (grade)    p.append("grade", grade);
        if (max_days) p.append("max_days", max_days);
        if (tripType) p.append("trip_type", tripType);
        setActs(((await (await fetch(`${API}/activities?${p}`)).json()).activities)||[]);
      }
    } catch { notify("추천 실패","error"); }
  }

  function findTripForWindow(w) {
    recommend(w);
    setActiveSection("recommend");
  }

  async function confirm(act) {
    const d = windows[0]?.dates[0] || dayjs().format("YYYY-MM-DD");
    const g = windows[0]?.grade    || "D";
    try {
      if (MOCK) await apiCreateConfirmed({ user_id:UID, date:d, activity:act.title, grade:g });
      else await fetch(`${API}/confirmed`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ user_id:UID, date:d, activity:act.title, grade:g }),
      });
      setActs([]); load(); notify(`🎉 "${act.title}" 확정됐어요!`);
    } catch { notify("확정 실패","error"); }
  }

  function handleDateClick(date, el) {
    setDate(date);
    setSelectedDate(date);
    setPopoverInfo({ date, rect: el.getBoundingClientRect() });
    setActiveSection("events");
  }

  function closePopover() {
    setPopoverInfo(null);
    setSelectedDate(null);
  }

  const ml        = dayjs(`${month}-01`).format("YYYY년 M월");
  const canSubmit  = !saving && !!label.trim();
  const topGrade   = windows[0]?.grade;
  const busyDays   = new Set(events.map(e => e.date)).size;
  const freeDays   = windows.reduce((s, w) => s + w.duration_days, 0);
  const today      = dayjs().format("YYYY-MM-DD");
  const nextTrip   = confirmed.filter(c => c.date >= today).sort((a,b) => a.date.localeCompare(b.date))[0];
  const dday       = nextTrip ? dayjs(nextTrip.date).diff(dayjs(), "day") : null;

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden", background:"var(--bg)" }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}

      {/* ── 좌측 네비게이션 사이드바 ── */}
      <aside style={{
        width:210, flexShrink:0,
        display:"flex", flexDirection:"column",
        background:"var(--bg-2)",
        borderRight:"1.5px solid var(--border)",
      }}>
        {/* 로고 */}
        <div style={{
          height:"var(--header)", flexShrink:0,
          display:"flex", alignItems:"center", gap:9,
          padding:"0 18px",
          borderBottom:"1.5px solid var(--border)",
        }}>
          <div style={{
            width:34, height:34, borderRadius:11,
            background:"var(--accent)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:17, boxShadow:"0 2px 10px rgba(0,191,165,.35)",
          }}>🗓</div>
          <span style={{ fontWeight:800, fontSize:17, color:"var(--text-1)", letterSpacing:"-.03em" }}>Brissy</span>
        </div>

        {/* 통계 */}
        <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:7, flexShrink:0 }}>
          <StatRow value={busyDays}           label="바쁜 날"   color="#F97316" />
          <StatRow value={freeDays}  unit="일" label="자유 시간" color="#00BFA5" />
          <StatRow value={confirmed.length}   label="확정 활동" color="#00BFA5" />
        </div>

        <div style={{ height:1, background:"var(--border)", flexShrink:0 }} />

        {/* 섹션 네비 */}
        <nav style={{ padding:"10px", flex:1 }}>
          <SideNavLink active={activeSection==="events"} onClick={()=>setActiveSection("events")} icon="📅">
            일정 관리
            {events.length > 0 && (
              <span style={{
                marginLeft:"auto", fontSize:10, fontWeight:700, borderRadius:99, padding:"1px 7px",
                background: activeSection==="events" ? "var(--accent)" : "var(--bg)",
                color:      activeSection==="events" ? "#fff"          : "var(--text-3)",
              }}>{events.length}</span>
            )}
          </SideNavLink>
          <SideNavLink active={activeSection==="windows"} onClick={()=>setActiveSection("windows")} icon="✨">
            빈 날 창
            {windows.length > 0 && (
              <span style={{
                marginLeft:"auto", fontSize:10, fontWeight:700, borderRadius:99, padding:"1px 7px",
                background: activeSection==="windows" ? "var(--accent)" : "var(--bg)",
                color:      activeSection==="windows" ? "#fff"          : "var(--text-3)",
              }}>{windows.length}</span>
            )}
          </SideNavLink>
          <SideNavLink active={activeSection==="recommend"} onClick={()=>setActiveSection("recommend")} icon="🧭">
            여행 추천
          </SideNavLink>
        </nav>

        {/* 최우선 등급 칩 */}
        {topGrade && (
          <div style={{ padding:"12px 14px", borderTop:"1.5px solid var(--border)" }}>
            <div style={{
              background:`${GRADE_COLOR[topGrade]}12`, color:GRADE_COLOR[topGrade],
              border:`1.5px solid ${GRADE_COLOR[topGrade]}30`,
              borderRadius:10, padding:"8px 12px",
              fontSize:12, fontWeight:700, textAlign:"center",
            }}>
              ✨ 최우선 {topGrade}등급
            </div>
          </div>
        )}
      </aside>

      {/* ── center + right wrapper ── */}
      <div style={{ flex:1, minWidth:0, display:"flex", gap:12, padding:12, overflow:"hidden" }}>

      {/* ── 캘린더 + 헤더 ── */}
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", borderRadius:"var(--r)", overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>

        {/* 캘린더 헤더 */}
        <div style={{
          height:"var(--header)", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 20px",
          background:"var(--bg-2)",
          borderBottom:"1.5px solid var(--border)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:18, fontWeight:800, color:"var(--text-1)", letterSpacing:"-.02em" }}>{ml}</span>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <NavBtn onClick={()=>setMonth(dayjs(`${month}-01`).subtract(1,"month").format("YYYY-MM"))}>‹</NavBtn>
              <NavBtn onClick={()=>setMonth(dayjs().format("YYYY-MM"))} small>오늘</NavBtn>
              <NavBtn onClick={()=>setMonth(dayjs(`${month}-01`).add(1,"month").format("YYYY-MM"))}>›</NavBtn>
            </div>
            {loading && <span style={{ fontSize:10, color:"var(--text-3)", letterSpacing:2 }}>●●●</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {busyDays > 0 && (
              <span style={{
                fontSize:11, fontWeight:600, color:"#F97316",
                background:"rgba(249,115,22,.1)", border:"1px solid rgba(249,115,22,.2)",
                borderRadius:99, padding:"4px 10px",
              }}>일정 {busyDays}일</span>
            )}
            {freeDays > 0 && (
              <span style={{
                fontSize:11, fontWeight:600, color:"#00BFA5",
                background:"rgba(0,191,165,.1)", border:"1px solid rgba(0,191,165,.2)",
                borderRadius:99, padding:"4px 10px",
              }}>자유 {freeDays}일</span>
            )}
            {dday !== null && (
              <span style={{
                fontSize:11, fontWeight:700, color:"#00BFA5",
                background:"rgba(0,191,165,.1)", border:"1.5px solid rgba(0,191,165,.25)",
                borderRadius:99, padding:"4px 12px",
              }}>🗺️ {dday === 0 ? "오늘 여행!" : `D-${dday}`}</span>
            )}
          </div>
        </div>

        {/* 캘린더 그리드 */}
        <div style={{ flex:1, minHeight:0 }}>
          <Calendar
            month={month} events={events} confirmed={confirmed} freeWindows={windows}
            onDateClick={handleDateClick} selectedDate={selectedDate}
          />
        </div>
      </div>

      {/* 날짜 팝오버 */}
      {popoverInfo && (
        <DatePopover
          info={popoverInfo}
          events={events.filter(e => e.date === popoverInfo.date)}
          confirmed={confirmed.find(c => c.date === popoverInfo.date)}
          grade={windows.find(w => w.dates.includes(popoverInfo.date))?.grade}
          onClose={closePopover}
          onAddEvent={closePopover}
          onDelete={del}
        />
      )}

      {/* ── 우측 패널 ── */}
      <aside style={{
        width:320, flexShrink:0,
        display:"flex", flexDirection:"column",
        background:"var(--bg-2)",
        borderRadius:"var(--r)",
        overflow:"hidden",
        boxShadow:"var(--shadow-sm)",
      }}>
        {/* 패널 헤더 */}
        <div style={{
          height:"var(--header)", flexShrink:0,
          display:"flex", alignItems:"center",
          padding:"0 20px",
          borderBottom:"1.5px solid var(--border)",
        }}>
          <span style={{ fontSize:15, fontWeight:700, color:"var(--text-1)" }}>
            {activeSection === "events"    ? "📅 일정 관리"
           : activeSection === "windows"   ? "✨ 빈 날 창"
           :                                 "🧭 여행 추천"}
          </span>
        </div>

        {/* 스크롤 콘텐츠 */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>

          {/* ── 일정 관리 ── */}
          {activeSection === "events" && (
            <>
              <form onSubmit={addEvent} style={{ marginBottom:20 }}>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <label style={labelSt}>날짜</label>
                    <input
                      type="date" value={date} onChange={e=>setDate(e.target.value)}
                      style={inp}
                      onFocus={e=>{ e.target.style.borderColor="var(--accent)"; e.target.style.background="var(--bg-2)"; }}
                      onBlur={e=>{ e.target.style.borderColor="var(--border)"; e.target.style.background="var(--bg-3)"; }}
                    />
                  </div>
                  <div style={{ flex:2 }}>
                    <label style={labelSt}>내용</label>
                    <input
                      type="text" placeholder="일정 내용을 입력하세요…" value={label}
                      onChange={e=>setLabel(e.target.value)} maxLength={50}
                      style={inp}
                      onFocus={e=>{ e.target.style.borderColor="var(--accent)"; e.target.style.background="var(--bg-2)"; }}
                      onBlur={e=>{ e.target.style.borderColor="var(--border)"; e.target.style.background="var(--bg-3)"; }}
                    />
                  </div>
                </div>
                <button type="submit" disabled={!canSubmit} style={{
                  width:"100%", padding:"10px",
                  background: canSubmit ? "var(--accent)" : "var(--bg-3)",
                  color: canSubmit ? "#fff" : "var(--text-3)",
                  border: canSubmit ? "none" : "1.5px solid var(--border)",
                  borderRadius:"var(--rs)", fontSize:13, fontWeight:700,
                  transition:"all .2s", cursor: canSubmit ? "pointer" : "not-allowed",
                  boxShadow: canSubmit ? "0 2px 10px rgba(0,191,165,.25)" : "none",
                }}
                onMouseEnter={e=>{ if(canSubmit){ e.currentTarget.style.opacity=".88"; e.currentTarget.style.transform="translateY(-1px)"; }}}
                onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; e.currentTarget.style.transform="translateY(0)"; }}
                >{saving ? "추가 중…" : "✚ 추가하기"}</button>
              </form>

              {events.length === 0
                ? <Empty icon="📭" text="등록된 일정이 없어요" sub="위에서 일정을 추가해보세요" />
                : events.map(ev => <EventCard key={ev.id} event={ev} onDelete={del} />)
              }
            </>
          )}

          {/* ── 빈 날 창 ── */}
          {activeSection === "windows" && (
            <>
              {windows.length === 0
                ? <Empty icon="🌿" text="빈 날이 없어요" sub="일정을 추가하면 자동으로 계산됩니다" />
                : windows.map((w, i) => (
                  <div key={i} style={{
                    padding:"12px 14px", marginBottom:8,
                    background: i===0 ? `${GRADE_COLOR[w.grade]}08` : "var(--bg-3)",
                    border:`1.5px solid ${i===0 ? GRADE_COLOR[w.grade]+"40" : "var(--border)"}`,
                    borderRadius:"var(--rs)",
                    display:"flex", alignItems:"center", gap:12,
                    position:"relative", overflow:"hidden",
                  }}>
                    {i===0 && (
                      <div style={{
                        position:"absolute", top:0, left:0, right:0, height:3,
                        background:`linear-gradient(90deg, ${GRADE_COLOR[w.grade]}, ${GRADE_COLOR[w.grade]}50)`,
                      }} />
                    )}
                    <div style={{
                      width:38, height:38, borderRadius:11, flexShrink:0,
                      background:`${GRADE_COLOR[w.grade]}15`,
                      border:`1.5px solid ${GRADE_COLOR[w.grade]}30`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:14, fontWeight:800, color:GRADE_COLOR[w.grade],
                    }}>{w.grade}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--text-1)" }}>
                        {w.dates[0]}{w.dates.length>1 ? ` ~ ${w.dates[w.dates.length-1]}` : ""}
                      </div>
                      <div style={{ fontSize:11, color:"var(--text-3)", marginTop:3, display:"flex", gap:8 }}>
                        <span>📆 {w.duration_days}일</span>
                        {w.has_weekend && <span style={{ color:"#3B82F6" }}>🏖 주말 포함</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => findTripForWindow(w)}
                      style={{
                        flexShrink:0, padding:"6px 10px",
                        background:"var(--accent-bg)", color:"var(--accent)",
                        border:"1.5px solid var(--accent)", borderRadius:"var(--rs)",
                        fontSize:11, fontWeight:700, cursor:"pointer",
                        transition:"all .15s", whiteSpace:"nowrap",
                      }}
                      onMouseEnter={e=>{ e.currentTarget.style.background="var(--accent)"; e.currentTarget.style.color="#fff"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background="var(--accent-bg)"; e.currentTarget.style.color="var(--accent)"; }}
                    >여행 찾기 →</button>
                  </div>
                ))
              }
            </>
          )}

          {/* ── 여행 추천 ── */}
          {activeSection === "recommend" && (
            <>
              <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
                {[
                  [null,   "전체"],
                  ["자연", "🌿 자연"],
                  ["문화", "🏛️ 문화"],
                  ["미식", "🍽️ 미식"],
                  ["휴양", "🏖️ 휴양"],
                ].map(([val, lbl]) => (
                  <button key={String(val)} onClick={() => setTripType(val)} style={{
                    padding:"5px 12px",
                    background: tripType === val ? "var(--accent)" : "var(--bg-3)",
                    color: tripType === val ? "#fff" : "var(--text-2)",
                    border: tripType === val ? "none" : "1.5px solid var(--border)",
                    borderRadius:99, fontSize:11, fontWeight:600,
                    cursor:"pointer", transition:"all .15s",
                  }}>{lbl}</button>
                ))}
              </div>

              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <label style={labelSt}>📍 지역</label>
                  <select value={region} onChange={e=>setRegion(e.target.value)} style={inp}
                    onFocus={e=>{ e.target.style.borderColor="var(--accent)"; }}
                    onBlur={e=>{ e.target.style.borderColor="var(--border)"; }}
                  >
                    {["서울","부산","제주","강원","경주","전주"].map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{ flex:1 }}>
                  <label style={labelSt}>🌤 계절</label>
                  <select value={season} onChange={e=>setSeason(e.target.value)} style={inp}
                    onFocus={e=>{ e.target.style.borderColor="var(--accent)"; }}
                    onBlur={e=>{ e.target.style.borderColor="var(--border)"; }}
                  >
                    {[["spring","🌸 봄"],["summer","☀️ 여름"],["fall","🍂 가을"],["winter","❄️ 겨울"]].map(([v,l])=>(
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={recommend} style={{
                width:"100%", marginBottom:14, padding:"10px",
                background:"var(--accent)", color:"#fff", border:"none",
                borderRadius:"var(--rs)", fontSize:13, fontWeight:700,
                boxShadow:"0 2px 10px rgba(0,191,165,.25)",
                transition:"opacity .15s, transform .1s",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.opacity=".88"; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; e.currentTarget.style.transform="translateY(0)"; }}
              >🔍 추천 받기</button>

              {activities.length === 0
                ? <Empty icon="🗺️" text="추천 활동" sub={"지역과 계절을 선택하고\n추천 받기를 눌러보세요"} />
                : activities.map(a => <ActivityCard key={a.id} activity={a} onConfirm={confirm} />)
              }
            </>
          )}

        </div>
      </aside>

      </div>{/* end center+right wrapper */}

      {/* FAB */}
      <button
        onClick={() => setActiveSection("events")}
        title="새 일정 추가"
        style={{
          position:"fixed", bottom:24, right:24,
          width:52, height:52, borderRadius:"50%",
          background:"var(--accent)", color:"#fff", border:"none",
          fontSize:26, display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 4px 20px rgba(0,191,165,.45)",
          cursor:"pointer", zIndex:200,
          transition:"transform .15s, box-shadow .15s",
        }}
        onMouseEnter={e=>{ e.currentTarget.style.transform="scale(1.1)"; e.currentTarget.style.boxShadow="0 6px 28px rgba(0,191,165,.55)"; }}
        onMouseLeave={e=>{ e.currentTarget.style.transform="scale(1)";   e.currentTarget.style.boxShadow="0 4px 20px rgba(0,191,165,.45)"; }}
      >+</button>
    </div>
  );
}

/* ── 서브 컴포넌트 ── */

function NavBtn({ onClick, children, small }) {
  return (
    <button onClick={onClick} style={{
      background:"var(--bg-3)", border:"1.5px solid var(--border)", borderRadius:99,
      padding: small ? "5px 13px" : "5px 12px",
      fontSize: small ? 12 : 16,
      color:"var(--text-2)", fontWeight: small ? 700 : 400, lineHeight:1,
      transition:"all .15s",
    }}
    onMouseEnter={e=>{ e.currentTarget.style.background="var(--accent-bg)"; e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}
    onMouseLeave={e=>{ e.currentTarget.style.background="var(--bg-3)"; e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-2)"; }}
    >{children}</button>
  );
}

function SideNavLink({ active, onClick, icon, children }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:9,
      width:"100%", padding:"10px 12px", borderRadius:10,
      background: active ? "var(--accent-bg)" : "transparent",
      color: active ? "var(--accent)" : "var(--text-2)",
      border: active ? "1.5px solid rgba(0,191,165,.2)" : "1.5px solid transparent",
      fontSize:13, fontWeight: active ? 700 : 500,
      transition:"all .15s", textAlign:"left", cursor:"pointer",
      marginBottom:2,
    }}
    onMouseEnter={e=>{ if(!active) { e.currentTarget.style.background="var(--bg-3)"; e.currentTarget.style.borderColor="var(--border)"; }}}
    onMouseLeave={e=>{ if(!active) { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; }}}
    >
      <span style={{ fontSize:15 }}>{icon}</span>
      {children}
    </button>
  );
}

function StatRow({ value, label, unit="", color }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"8px 10px",
      background:`${color}10`,
      border:`1px solid ${color}22`,
      borderRadius:10,
    }}>
      <span style={{ fontSize:11, color:"var(--text-2)", fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:15, fontWeight:800, color }}>
        {value}<span style={{ fontSize:10, fontWeight:600 }}>{unit}</span>
      </span>
    </div>
  );
}

function Empty({ icon, text, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"32px 16px" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:13, fontWeight:700, color:"var(--text-2)", marginBottom:6 }}>{text}</div>
      {sub && <div style={{ fontSize:12, lineHeight:1.75, color:"var(--text-3)", whiteSpace:"pre-line" }}>{sub}</div>}
    </div>
  );
}

const inp = {
  display:"block", width:"100%",
  border:"1.5px solid var(--border)", borderRadius:"var(--rs)",
  padding:"9px 11px", fontSize:13, outline:"none",
  background:"var(--bg-3)", color:"var(--text-1)",
  transition:"border-color .15s, background .15s",
  boxSizing:"border-box",
};

const labelSt = {
  fontSize:11, fontWeight:600, color:"var(--text-3)",
  display:"block", marginBottom:5, letterSpacing:".03em",
};
