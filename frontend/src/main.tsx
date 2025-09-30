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
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>SMB Ops Dashboard</h1>
      <KpiCards />
      <SalesCharts />
      <AddProductForm onCreated={refresh} />
      <Products key={"p-" + Date.now()} />
      <Alerts />
      <ImportHistory />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);