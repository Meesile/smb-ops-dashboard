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
    <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8, minWidth: 160 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, opacity: 0.6 }}>{hint}</div>}
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

  if (loading) return <div style={{ marginTop: 16 }}>Loading KPIs…</div>;
  if (error) return <div style={{ marginTop: 16, color: "crimson" }}>❌ {error}</div>;
  if (!kpis) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>KPIs</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KpiCard label="Units Sold (Total)" value={kpis.unitsSoldTotal} />
        <KpiCard label="Units Sold (24h)" value={kpis.unitsSold24h} />
        <KpiCard label="Units Sold (7d)" value={kpis.unitsSold7d} />
        <KpiCard label="Low-stock Products" value={kpis.lowStockProducts} />
        <KpiCard label="Stock-outs" value={kpis.stockOutProducts} />
        <KpiCard label="Revenue" value={kpis.revenueTotal == null ? "—" : `$${kpis.revenueTotal.toLocaleString()}`} hint="Add price data to enable" />
        <KpiCard label="Margin" value={kpis.marginPct == null ? "—" : `${kpis.marginPct.toFixed(1)}%`} hint="Add cost data to enable" />
      </div>
    </div>
  );
}
