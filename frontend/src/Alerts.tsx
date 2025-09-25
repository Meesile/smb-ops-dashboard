import { useEffect, useRef, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
};

export default function Alerts() {
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const timerRef = useRef<number | null>(null);

  const fetchAlerts = async () => {
    try {
      setError("");
      const res = await fetch("http://localhost:4000/api/alerts/low-stock");
      if (!res.ok) throw new Error("Failed to load alerts");
      const data = await res.json();
      setLowStock(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  // initial load + polling every 5s
  useEffect(() => {
    fetchAlerts();
    timerRef.current = window.setInterval(fetchAlerts, 5000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  // refresh when tab regains focus
  useEffect(() => {
    const onFocus = () => fetchAlerts();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (loading) {
    return (
      <div style={{ marginTop: 24 }}>
        <h2>Alerts</h2>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Alerts</h2>
        <button onClick={fetchAlerts}>Refresh</button>
      </div>
      {error && <p style={{ color: "crimson" }}>❌ {error}</p>}
      {lowStock.length === 0 ? (
        <p>✅ No low-stock alerts</p>
      ) : (
        <>
          <h3 style={{ marginTop: 12 }}>⚠️ Low Stock</h3>
          <ul>
            {lowStock.map((p) => (
              <li key={p.id}>
                {p.name} ({p.sku}) — Qty: {p.quantity}, Threshold: {p.threshold}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}