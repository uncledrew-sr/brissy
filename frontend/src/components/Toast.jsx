import { useEffect } from "react";

export default function Toast({ message, type="success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, [onClose]);
  const isOk = type === "success";
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:9999,
      display:"flex", alignItems:"center", gap:10,
      background:"var(--bg-3)", color:"var(--text-1)",
      border:`1px solid ${isOk ? "rgba(16,185,129,.3)" : "rgba(248,113,113,.3)"}`,
      padding:"11px 16px", borderRadius:12,
      boxShadow:"0 8px 32px rgba(0,0,0,.5)",
      fontSize:13, fontWeight:500,
      animation:"slideUp .2s ease",
    }}>
      <span style={{ color: isOk ? "#10B981" : "#F87171", fontWeight:700, fontSize:14 }}>
        {isOk ? "✓" : "✕"}
      </span>
      {message}
      <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text-3)", marginLeft:4, fontSize:14, padding:0 }}>×</button>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}
