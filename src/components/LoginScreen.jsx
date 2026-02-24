import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginScreen({ onLogin, accounts }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const user = accounts.find(u => u.username === username && u.password === password);
      if (user) { 
        const userData = { ...user, role: user.position, displayName: user.username };
        localStorage.setItem("user", JSON.stringify(userData));
        onLogin(userData); 
      } else { 
        setError("Invalid credentials. Check username and password."); 
        setLoading(false); 
      }
    }, 500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0d0a1a 0%, #1a1130 50%, #0d1a0f 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(180,140,20,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(30,100,40,0.08) 0%, transparent 50%)" }} />
      <div style={{ position: "relative", width: 420, background: "rgba(15,10,30,0.95)", border: "1px solid rgba(180,140,20,0.3)", borderRadius: 4, padding: "48px 40px", boxShadow: "0 0 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(180,140,20,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>🍺</div>
          <div style={{ color: "#c8a820", fontSize: 22, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase" }}>Green Bastards</div>
          <div style={{ color: "#5a6a5a", fontSize: 12, letterSpacing: 4, textTransform: "uppercase", marginTop: 4 }}>Brewery · Financial Portal</div>
        </div>

        <form onSubmit={handle}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Username</label>
            <input value={username} onChange={e => { setUsername(e.target.value); setError(""); }}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,20,0.2)", borderRadius: 3, padding: "10px 14px", color: "#e8e0d0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              placeholder="Enter username" />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", color: "#8a9a8a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Password</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(180,140,20,0.2)", borderRadius: 3, padding: "10px 14px", color: "#e8e0d0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              placeholder="Enter password" />
          </div>
          {error && <div style={{ color: "#e05050", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", background: loading ? "rgba(180,140,20,0.3)" : "linear-gradient(135deg, #c8a820, #a08010)", border: "none", borderRadius: 3, padding: "12px", color: "#0d0a1a", fontSize: 13, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
            {loading ? "Authenticating..." : "Access Portal"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <span onClick={() => navigate("/")} style={{ color: "#5a6a5a", fontSize: 12, cursor: "pointer", textDecoration: "none" }}>← Back to Home</span>
        </div>
      </div>
    </div>
  );
}
