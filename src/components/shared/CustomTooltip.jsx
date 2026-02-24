import { fmt } from "../../helpers.js";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "rgba(10,7,20,0.95)", border: "1px solid rgba(180,140,20,0.3)", borderRadius: 3, padding: "8px 14px" }}>
        <div style={{ color: "#c8a820", fontSize: 13 }}>{fmt(payload[0].value)}</div>
        <div style={{ color: "#5a6a5a", fontSize: 11 }}>{payload[0].payload.date}</div>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
