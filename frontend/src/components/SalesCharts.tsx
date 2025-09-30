import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type SalesDataPoint = {
  date: string;
  units: number;
  uniqueProducts: number;
};

type ProductTrend = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
  unitsSold: number;
  salesCount: number;
};

export default function SalesCharts() {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [productTrends, setProductTrends] = useState<ProductTrend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [chartMode, setChartMode] = useState<"timeseries" | "trends">("timeseries");

  const fetchSalesData = async () => {
    try {
      setError("");
      const [salesRes, trendsRes] = await Promise.all([
        fetch("http://localhost:4000/api/kpis/sales-timeseries?days=30"),
        fetch("http://localhost:4000/api/kpis/product-trends?days=30&limit=10"),
      ]);

      if (!salesRes.ok || !trendsRes.ok) {
        throw new Error("Failed to load sales data");
      }

      const [salesData, trendsData] = await Promise.all([
        salesRes.json() as Promise<SalesDataPoint[]>,
        trendsRes.json() as Promise<ProductTrend[]>,
      ]);

      setSalesData(Array.isArray(salesData) ? salesData : []);
      setProductTrends(Array.isArray(trendsData) ? trendsData : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h2 className="card-title">Sales Analytics</h2>
        <p>Loading charts…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card alert-warning">
        <h2 className="card-title">Sales Analytics</h2>
        <p>❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="card compact">
      <div className="card-header" style={{ marginBottom: 8 }}>
        <h2 className="card-title">Sales Analytics</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setChartMode("timeseries")}
            disabled={chartMode === "timeseries"}
            className={chartMode === "timeseries" ? "" : "btn-secondary"}
            title="Daily sales over time"
          >
            Time Series
          </button>
          <button
            onClick={() => setChartMode("trends")}
            disabled={chartMode === "trends"}
            className={chartMode === "trends" ? "" : "btn-secondary"}
            title="Top products by sales"
          >
            Product Trends
          </button>
          <button onClick={fetchSalesData} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {chartMode === "timeseries" ? (
        <div className="chart-container" style={{ height: 220 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600 }}>Daily Sales (30 days)</h3>
          {salesData.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <p style={{ opacity: 0.6 }}>No sales data available</p>
            </div>
          ) : (
              <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 11 }}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value: any, key: any) => {
                    if (key === "units") return [value, "Units Sold"];
                    if (key === "uniqueProducts") return [value, "Unique Products"];
                    return [value, key];
                  }}
                  labelFormatter={(label: any) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="units" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Units Sold"
                />
                <Line 
                  type="monotone" 
                  dataKey="uniqueProducts" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Unique Products"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <div className="chart-container" style={{ height: 220 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600 }}>Top Products by Sales (30 days)</h3>
          {productTrends.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <p style={{ opacity: 0.6 }}>No product sales data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productTrends} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="sku" 
                  tickFormatter={(value) => value.length > 8 ? value.substring(0, 8) + "..." : value}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value: any, key: any) => {
                    if (key === "unitsSold") return [value, "Units Sold"];
                    if (key === "salesCount") return [value, "Sales Count"];
                    return [value, key];
                  }}
                  labelFormatter={(label: any, payload: any) => {
                    const item = payload && payload[0] && payload[0].payload;
                    if (item) {
                      return `${item.name} (${item.sku})`;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar dataKey="unitsSold" fill="#8884d8" name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
