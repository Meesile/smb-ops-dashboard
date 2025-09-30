import { useEffect, useState } from "react";

type KpiSummary = {
  unitsSoldTotal: number;
  unitsSold24h: number;
  unitsSold7d: number;
  lowStockProducts: number;
  stockOutProducts: number;
  revenueTotal: number | null;
  marginPct: number | null;
  asOf: string;
};

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}

export default function KpiCards() {
  const [kpis, setKpis] = useState<KpiSummary | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchKpis = async () => {
    try {
      setError("");
      const res = await fetch("http://localhost:4000/api/kpis/summary");
      if (!res.ok) throw new Error("Failed to load KPIs");
      const data = (await res.json()) as KpiSummary;
      setKpis(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load KPIs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  if (loading) return <div className="card">Loading KPIs…</div>;
  if (error) return <div className="card alert-warning">❌ {error}</div>;
  if (!kpis) return null;

  return (
    <div className="card compact">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        <KpiCard label="Units (Total)" value={kpis.unitsSoldTotal} />
        <KpiCard label="Units (24h)" value={kpis.unitsSold24h} />
        <KpiCard label="Units (7d)" value={kpis.unitsSold7d} />
        <KpiCard label="Low-stock" value={kpis.lowStockProducts} />
      </div>
    </div>
  );
}
