export default function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "rgba(15,10,30,0.8)", border: `1px solid ${accent}22`, borderRadius: 4, padding: "20px 24px", flex: 1 }}>
      <div style={{ color: "#5a6a5a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ color: accent, fontSize: 26, fontWeight: "bold", letterSpacing: 1 }}>{value}</div>
      {sub && <div style={{ color: "#5a6a5a", fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
