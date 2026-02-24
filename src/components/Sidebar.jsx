export default function Sidebar({ navItems, active, setActive, user, onLogout, pendingCount }) {
  const roleColor = {
    'CFO': '#c8a820',
    'CEO': '#50c860',
    'Brewer': '#3498db'
  };

  const role = user.role || user.position;

  return (
    <div style={{ width: 220, minHeight: "100vh", background: "rgba(8,5,18,0.98)", borderRight: "1px solid rgba(180,140,20,0.15)", display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100 }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(180,140,20,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 28 }}>🍺</div>
          <div>
            <div style={{ color: "#c8a820", fontSize: 13, fontWeight: "bold", letterSpacing: 1 }}>Green Bastards</div>
            <div style={{ color: "#3a4a3a", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Brewery</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "16px 0" }}>
        {navItems.map((item, idx) => {
          // Render separator items as section headers
          if (item.separator) {
            return (
              <div key={item.id || `sep-${idx}`} style={{ padding: "16px 20px 6px", marginTop: idx > 0 ? 8 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(180,140,20,0.12)" }} />
                  <div style={{ color: "#5a6a5a", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", fontWeight: "bold", whiteSpace: "nowrap" }}>{item.label}</div>
                  <div style={{ flex: 1, height: 1, background: "rgba(180,140,20,0.12)" }} />
                </div>
              </div>
            );
          }

          const isActive = active === item.id;
          const badgeValue = item.id === "audit" && pendingCount > 0 ? pendingCount : item.badge;
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", background: isActive ? "rgba(180,140,20,0.12)" : "transparent", border: "none", borderLeft: isActive ? "2px solid #c8a820" : "2px solid transparent", color: isActive ? "#c8a820" : "#5a6a5a", cursor: "pointer", fontSize: 13, textAlign: "left", transition: "all 0.15s", fontFamily: "Georgia, serif" }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {badgeValue && badgeValue > 0 && <span style={{ marginLeft: "auto", background: "#c8a820", color: "#0d0a1a", fontSize: 10, fontWeight: "bold", borderRadius: 10, padding: "1px 6px" }}>{badgeValue}</span>}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(180,140,20,0.1)" }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "#e8e0d0", fontSize: 13 }}>{user.displayName}</div>
          <div style={{ color: roleColor[role] || "#5a6a5a", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>⬡ {role}</div>
        </div>
        <button onClick={onLogout}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, padding: "7px", color: "#5a6a5a", fontSize: 11, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontFamily: "Georgia, serif" }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
