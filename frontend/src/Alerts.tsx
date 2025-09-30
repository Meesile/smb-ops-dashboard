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
      <div className="card">
        <h2 className="card-title">Alerts</h2>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="card compact">
      <div className="card-header" style={{ marginBottom: 8 }}>
        <h2 className="card-title">Alerts</h2>
        <button onClick={fetchAlerts} className="btn-secondary" style={{ fontSize: 12, padding: "0.375rem 0.75rem" }}>Refresh</button>
      </div>
      {error && <p className="alert-warning">❌ {error}</p>}
      {lowStock.length === 0 ? (
        <p className="alert-success">✅ No low-stock alerts</p>
      ) : (
        <>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, fontWeight: 600, color: "var(--accent-orange)" }}>⚠️ Low Stock</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {lowStock.map((p) => (
              <li key={p.id} style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-color)" }}>
                <strong>{p.name}</strong> ({p.sku}) — Qty: {p.quantity}, Threshold: {p.threshold}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}