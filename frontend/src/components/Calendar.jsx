import { useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
dayjs.locale("ko");

const GRADE_COLOR = {
  S: "#16a34a",
  A: "#22c55e",
  B: "#4ade80",
  C: "#86efac",
  D: "#bbf7d0",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function Calendar({ month, events, confirmed, freeWindows }) {
  const base = dayjs(`${month}-01`);
  const daysInMonth = base.daysInMonth();
  const startWeekday = base.day();

  const eventDates = useMemo(() => {
    const map = {};
    for (const e of events) {
      map[e.date] = [...(map[e.date] || []), e.label];
    }
    return map;
  }, [events]);

  const confirmedDates = useMemo(() => {
    const map = {};
    for (const c of confirmed) {
      map[c.date] = { activity: c.activity, grade: c.grade };
    }
    return map;
  }, [confirmed]);

  const freeDateGrade = useMemo(() => {
    const map = {};
    for (const w of freeWindows) {
      for (const d of w.dates) {
        map[d] = w.grade;
      }
    }
    return map;
  }, [freeWindows]);

  const cells = useMemo(() => {
    const blanks = Array(startWeekday).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = base.add(i, "day");
      return d.format("YYYY-MM-DD");
    });
    return [...blanks, ...days];
  }, [base, daysInMonth, startWeekday]);

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          marginBottom: 4,
        }}
      >
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            style={{
              textAlign: "center",
              fontWeight: 600,
              fontSize: 12,
              color: i === 0 ? "#ef4444" : i === 6 ? "#3b82f6" : "#374151",
              padding: "4px 0",
            }}
          >
            {w}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {cells.map((dateStr, idx) => {
          if (!dateStr) return <div key={`blank-${idx}`} />;

          const isBusy = !!eventDates[dateStr];
          const isConfirmed = !!confirmedDates[dateStr];
          const freeGrade = freeDateGrade[dateStr];
          const dow = dayjs(dateStr).day();
          const dayNum = parseInt(dateStr.slice(-2), 10);

          let bg = "#f9fafb";
          if (freeGrade) bg = GRADE_COLOR[freeGrade];
          if (isBusy) bg = "#fef9c3";
          if (isConfirmed) bg = "#dbeafe";

          return (
            <div
              key={dateStr}
              title={
                isConfirmed
                  ? confirmedDates[dateStr].activity
                  : isBusy
                  ? eventDates[dateStr].join(", ")
                  : freeGrade
                  ? `빈 날 (${freeGrade}등급)`
                  : ""
              }
              style={{
                background: bg,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                minHeight: 64,
                padding: "4px 6px",
                position: "relative",
                cursor: "default",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    dow === 0 ? "#ef4444" : dow === 6 ? "#3b82f6" : "#111827",
                }}
              >
                {dayNum}
              </div>

              {freeGrade && !isBusy && !isConfirmed && (
                <span
                  style={{
                    display: "inline-block",
                    background: "#15803d",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 4,
                    padding: "1px 4px",
                    marginTop: 2,
                  }}
                >
                  {freeGrade}
                </span>
              )}

              {isBusy && (
                <div style={{ fontSize: 10, color: "#92400e", marginTop: 2 }}>
                  {eventDates[dateStr][0]}
                  {eventDates[dateStr].length > 1 &&
                    ` +${eventDates[dateStr].length - 1}`}
                </div>
              )}

              {isConfirmed && (
                <div style={{ fontSize: 10, color: "#1e40af", marginTop: 2 }}>
                  ✓ {confirmedDates[dateStr].activity}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 12,
          flexWrap: "wrap",
          fontSize: 11,
          color: "#6b7280",
        }}
      >
        {Object.entries(GRADE_COLOR).map(([g, c]) => (
          <span key={g} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: c,
                borderRadius: 2,
              }}
            />
            빈 날 {g}등급
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              background: "#fef9c3",
              borderRadius: 2,
            }}
          />
          일정 있음
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              background: "#dbeafe",
              borderRadius: 2,
            }}
          />
          확정 활동
        </span>
      </div>
    </div>
  );
}
