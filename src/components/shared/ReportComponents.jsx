import { fmt } from "../../helpers.js";

export function Row({ label, val, color, sub }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <div>
        <div style={{ color: "#8a9a8a", fontSize: 13 }}>{label}</div>
        {sub && <div style={{ color: "#3a4a3a", fontSize: 11 }}>{sub}</div>}
      </div>
      <div style={{ color: color || "#e8e0d0", fontSize: 13, fontWeight: "bold" }}>{val >= 0 ? fmt(val) : "-" + fmt(Math.abs(val))}</div>
    </div>
  );
}

export function TotalRow({ label, val, color, large }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid rgba(180,140,20,0.2)", borderBottom: "1px solid rgba(180,140,20,0.2)", marginTop: 4 }}>
      <div style={{ color: "#e8e0d0", fontSize: large ? 15 : 13, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: color || "#c8a820", fontSize: large ? 18 : 14, fontWeight: "bold" }}>{val >= 0 ? fmt(val) : "-" + fmt(Math.abs(val))}</div>
    </div>
  );
}

export function SectionHeader({ label }) {
  return <div style={{ color: "#c8a820", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>{label}</div>;
}

export function MDASection({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ color: "#c8a820", fontSize: 13, fontWeight: "bold", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>{title}</div>
      <div style={{ color: "#8a9a8a", fontSize: 13, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}
