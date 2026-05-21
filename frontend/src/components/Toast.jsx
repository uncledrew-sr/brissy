import { useEffect } from "react";

export default function Toast({ message, type="success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  const isOk = type === "success";
  return (
    <div style={{
      position:"fixed", bottom:28, right:28, zIndex:9999,
      display:"flex", alignItems:"center", gap:10,
      background:"var(--bg-2)", color:"var(--text-1)",
      border:`1.5px solid ${isOk ? "rgba(5,150,105,.3)" : "rgba(239,68,68,.3)"}`,
      padding:"13px 18px", borderRadius:99,
      boxShadow:"0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(124,111,247,.08)",
      fontSize:14, fontWeight:500,
      animation:"slideUp .25s ease",
    }}>
      <span style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center",
        width:22, height:22, borderRadius:"50%",
        background: isOk ? "rgba(5,150,105,.12)" : "rgba(239,68,68,.12)",
        color: isOk ? "#059669" : "#EF4444",
        fontWeight:800, fontSize:13, flexShrink:0,
      }}>
        {isOk ? "✓" : "✕"}
      </span>
      {message}
      <button onClick={onClose} style={{
        background:"none", border:"none", color:"var(--text-3)",
        marginLeft:4, fontSize:17, padding:"0 2px", lineHeight:1,
      }}>×</button>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}
