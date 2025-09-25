import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import BackendStatus from "./BackendStatus";
import Products from "./Products";
import AddProductForm from "./AddProductForm";
import Alerts from "./Alerts";

function App() {
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>SMB Ops Dashboard</h1>
      <BackendStatus />
      <AddProductForm onCreated={refresh} />
      <Products key={"p-" + Date.now()} />
      <Alerts />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);