import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import MyOrders from "../production/MyOrders";
import ProductionQueue from "../production/ProductionQueue";
import RecipeBook from "../production/RecipeBook";
import EmployeeProfile from "../employees/EmployeeProfile";

export default function BrewerDashboard({ user, onLogout }) {
  const [active, setActive] = useState("myorders");

  const pageStyle = {
    marginLeft: 220,
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0d0a1a 0%, #111820 100%)",
    padding: "36px 40px",
    fontFamily: "Georgia, serif",
  };

  return (
    <div style={{ background: "#0a0714", minHeight: "100vh" }}>
      <Sidebar
        active={active}
        setActive={setActive}
        user={user}
        onLogout={onLogout}
      />
      <div style={pageStyle}>
        {active === "myorders" && <MyOrders user={user} />}
        {active === "queue" && <ProductionQueue user={user} />}
        {active === "recipes" && <RecipeBook />}
        {active === "profile" && <EmployeeProfile user={user} employeeId={user.id} onBack={() => setActive("myorders")} />}
      </div>
    </div>
  );
}
