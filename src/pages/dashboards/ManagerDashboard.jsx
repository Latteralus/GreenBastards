import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import OrdersPage from "../orders/OrdersPage";
import ProductionQueue from "../production/ProductionQueue";
import RecipeBook from "../production/RecipeBook";
import ForecastingPage from "../production/ForecastingPage";
import ProductsRecipesAdmin from "../production/ProductsRecipesAdmin";
import Dashboard from "../financial/Dashboard";
import Transactions from "../financial/Transactions";
import Inventory from "../financial/Inventory";
import Loans from "../financial/Loans";
import Reports from "../financial/Reports";
import Settings from "../financial/Settings";
import EmployeesPage from "../employees/EmployeesPage";
import EmployeeProfile from "../employees/EmployeeProfile";

export default function ManagerDashboard({ user, onLogout, transactions, categories, loans, inventory, fetchData, accounts }) {
  const [active, setActive] = useState("orders");
  const [viewEmployeeId, setViewEmployeeId] = useState(null);

  const pageStyle = {
    marginLeft: 220,
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0d0a1a 0%, #111820 100%)",
    padding: "36px 40px",
    fontFamily: "Georgia, serif",
  };

  const handleViewProfile = (id) => {
    setViewEmployeeId(id);
    setActive("view_employee");
  };

  return (
    <div style={{ background: "#0a0714", minHeight: "100vh" }}>
      <Sidebar
        active={active}
        setActive={(id) => {
          setViewEmployeeId(null);
          setActive(id);
        }}
        user={user}
        onLogout={onLogout}
      />
      <div style={pageStyle}>
        {/* Operations Pages */}
        {active === "orders" && <OrdersPage user={user} />}
        {active === "queue" && <ProductionQueue user={user} />}
        {active === "forecasting" && <ForecastingPage />}
        {active === "recipes" && <RecipeBook />}
        {active === "products" && <ProductsRecipesAdmin />}
        {active === "employees" && <EmployeesPage user={user} onViewProfile={handleViewProfile} />}
        {active === "view_employee" && viewEmployeeId && <EmployeeProfile user={user} employeeId={viewEmployeeId} onBack={() => setActive("employees")} />}
        {active === "profile" && <EmployeeProfile user={user} employeeId={user.id} onBack={() => setActive("orders")} />}
        
        {/* Financial Pages */}
        {active === "dashboard" && <Dashboard transactions={transactions} categories={categories} loans={loans} />}
        {active === "transactions" && <Transactions transactions={transactions} onTransactionUpdate={fetchData} user={user} categories={categories} loans={loans} accounts={accounts} />}
        {active === "inventory" && <Inventory inventory={inventory} onInventoryUpdate={fetchData} />}
        {active === "loans" && <Loans transactions={transactions} loans={loans} />}
        {active === "reports" && <Reports transactions={transactions} inventory={inventory} categories={categories} loans={loans} />}
        {active === "settings" && <Settings user={user} categories={categories} onDataUpdate={fetchData} />}
      </div>
    </div>
  );
}
