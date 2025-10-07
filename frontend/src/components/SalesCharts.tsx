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

type WeekdayWeekendDatum = { label: "Weekday" | "Weekend"; units: number; salesCount: number; avgUnits: number };

export default function SalesCharts() {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [productTrends, setProductTrends] = useState<ProductTrend[]>([]);
  const [weekdayWeekend, setWeekdayWeekend] = useState<WeekdayWeekendDatum[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [chartMode, setChartMode] = useState<"timeseries" | "trends" | "weekdayWeekend">("timeseries");
  const [days, setDays] = useState<number>(30);

  const fetchSalesData = async () => {
    try {
      setError("");
      const [salesRes, trendsRes, wwRes] = await Promise.all([
        fetch(`http://localhost:4000/api/kpis/sales-timeseries?days=${days}`),
        fetch(`http://localhost:4000/api/kpis/product-trends?days=${days}&limit=10`),
        fetch(`http://localhost:4000/api/kpis/weekday-weekend?days=${days}`),
      ]);

      if (!salesRes.ok || !trendsRes.ok || !wwRes.ok) {
        throw new Error("Failed to load sales data");
      }

      const [salesData, trendsData, wwData] = await Promise.all([
        salesRes.json() as Promise<SalesDataPoint[]>,
        trendsRes.json() as Promise<ProductTrend[]>,
        wwRes.json() as Promise<{ data: WeekdayWeekendDatum[] }>,
      ]);

      setSalesData(Array.isArray(salesData) ? salesData : []);
      setProductTrends(Array.isArray(trendsData) ? trendsData : []);
      setWeekdayWeekend(Array.isArray(wwData?.data) ? wwData.data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
          <button
            onClick={() => setChartMode("weekdayWeekend")}
            disabled={chartMode === "weekdayWeekend"}
            className={chartMode === "weekdayWeekend" ? "" : "btn-secondary"}
            title="Compare weekday vs weekend"
          >
            Weekday vs Weekend
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Days:</label>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>7</option>
              <option value={14}>14</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={90}>90</option>
            </select>
          </div>
          <button onClick={fetchSalesData} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {chartMode === "timeseries" ? (
        <div className="chart-container" style={{ height: 220 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600 }}>Daily Sales ({days} days)</h3>
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
      ) : chartMode === "trends" ? (
        <div className="chart-container" style={{ height: 220 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600 }}>Top Products by Sales ({days} days)</h3>
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
      ) : (
        <div className="chart-container" style={{ height: 220 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600 }}>Weekday vs Weekend ({days} days)</h3>
          {!weekdayWeekend || weekdayWeekend.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <p style={{ opacity: 0.6 }}>No sales data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayWeekend} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value: any, key: any) => {
                    if (key === "units") return [value, "Units Sold"];
                    if (key === "salesCount") return [value, "Sales Count"];
                    if (key === "avgUnits") return [value, "Avg Units/Sale"];
                    return [value, key];
                  }}
                />
                <Legend />
                <Bar dataKey="units" fill="#8884d8" name="Units Sold" />
                <Bar dataKey="salesCount" fill="#82ca9d" name="Sales Count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
