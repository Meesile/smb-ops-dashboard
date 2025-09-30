import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import Products from "./Products";
import AddProductForm from "./AddProductForm";
import Alerts from "./Alerts";
import ImportHistory from "./components/ImportHistory";
import KpiCards from "./components/KpiCards";
import SalesCharts from "./components/SalesCharts";

function App() {
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SMB Ops Dashboard</h1>
      </header>
      <div className="app-content">
        <div className="main-column">
          <KpiCards />
          <SalesCharts />
          <Products key={"p-" + Date.now()} />
        </div>
        <div className="sidebar-column">
          <AddProductForm onCreated={refresh} />
          <Alerts />
          <ImportHistory />
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);