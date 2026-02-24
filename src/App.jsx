import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import LoginScreen from "./components/LoginScreen";
import PublicSite from "./pages/public/PublicSite";
import BrewerDashboard from "./pages/dashboards/BrewerDashboard";
import ManagerDashboard from "./pages/dashboards/ManagerDashboard";
import CFODashboard from "./pages/dashboards/CFODashboard";

// Role level mapping
const ROLE_LEVEL = { 'Brewer': 1, 'CEO': 2, 'CFO': 3 };

function DashboardRouter({ user, setUser, fetchData, ...dataProps }) {
  const navigate = useNavigate();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const role = user.role || user.position;
  
  switch(role) {
    case 'CFO':
      return <CFODashboard user={user} onLogout={handleLogout} fetchData={fetchData} {...dataProps} />;
    case 'CEO':
      return <ManagerDashboard user={user} onLogout={handleLogout} fetchData={fetchData} {...dataProps} />;
    case 'Brewer':
      return <BrewerDashboard user={user} onLogout={handleLogout} fetchData={fetchData} {...dataProps} />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  });
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, catRes, accRes, invRes, loanRes] = await Promise.all([
        supabase.from('transactions').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('accounts').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('loans').select('*')
      ]);

      if (txRes.error) throw txRes.error;
      if (catRes.error) throw catRes.error;
      if (accRes.error) throw accRes.error;
      if (invRes.error) throw invRes.error;
      if (loanRes.error) throw loanRes.error;

      const formattedTransactions = txRes.data.map(t => ({
        ...t,
        submittedBy: t.submitted_by,
        approvedBy: t.approved_by
      }));

      setTransactions(formattedTransactions);
      setCategories(catRes.data);
      setAccounts(accRes.data);
      setInventory(invRes.data);
      setLoans(loanRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = (userData) => {
    const enriched = { ...userData, role: userData.position, displayName: userData.username };
    localStorage.setItem("user", JSON.stringify(enriched));
    setUser(enriched);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : 
          <LoginScreen onLogin={handleLogin} accounts={accounts} />
        } />
        <Route path="/dashboard" element={
          <DashboardRouter 
            user={user} 
            setUser={setUser}
            fetchData={fetchData}
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            inventory={inventory}
            loans={loans}
            loading={loading}
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
