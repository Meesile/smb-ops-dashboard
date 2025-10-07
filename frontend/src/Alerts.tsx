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
  const [history, setHistory] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const timerRef = useRef<number | null>(null);

  const fetchAlerts = async () => {
    try {
      setError("");
      const [resLow, resHist] = await Promise.all([
        fetch("http://localhost:4000/api/alerts/low-stock"),
        fetch("http://localhost:4000/api/alerts/history?limit=20"),
      ]);
      if (!resLow.ok || !resHist.ok) throw new Error("Failed to load alerts");
      const [dataLow, dataHist] = await Promise.all([resLow.json(), resHist.json() as Promise<AlertItem[]>]);
      setLowStock(Array.isArray(dataLow) ? dataLow : []);
      setHistory(Array.isArray(dataHist) ? dataHist : []);
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
      <div>
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

      <div style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Recent Alert History</h3>
        {history.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No alerts yet</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {history.map((a) => (
              <li key={a.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div>
                    <strong>{a.product.name}</strong> ({a.product.sku}) — {a.message}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Status: {a.status} • {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {a.status === "ACTIVE" && (
                    <>
                      <button className="btn-secondary" onClick={() => actOnAlert(a.id, "ack")}>Acknowledge</button>
                      <button className="btn-secondary" onClick={() => actOnAlert(a.id, "resolve")}>Resolve</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Types and helpers
type AlertItem = {
  id: string;
  productId: string;
  type: "LOW_STOCK";
  message: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  createdAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  product: { id: string; name: string; sku: string };
};

async function actOnAlert(id: string, action: "ack" | "resolve") {
  try {
    const res = await fetch(`http://localhost:4000/api/alerts/${encodeURIComponent(id)}/${action}`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Failed to ${action} alert`);
    }
  } catch (e) {
    // noop for now; could surface toast in future
    console.error(e);
  }
}