import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type ProductSalesData = {
  date: string;
  units: number;
  salesCount: number;
};

type ProductTrendData = {
  product: {
    id: string;
    name: string;
    sku: string;
  };
  salesData: ProductSalesData[];
  totalUnits: number;
  totalSales: number;
};

type Props = {
  productId: string | null;
  onClose: () => void;
};

export default function ProductTrendModal({ productId, onClose }: Props) {
  const [data, setData] = useState<ProductTrendData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!productId) return;

    const fetchProductTrend = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`http://localhost:4000/api/kpis/product-sales/${encodeURIComponent(productId)}?days=30`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to load product trend");
        }
        const trendData = await res.json() as ProductTrendData;
        setData(trendData);
      } catch (e: any) {
        setError(e?.message || "Failed to load product trend");
      } finally {
        setLoading(false);
      }
    };

    fetchProductTrend();
  }, [productId]);

  if (!productId) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "white",
        borderRadius: 8,
        padding: 24,
        maxWidth: "90vw",
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>
            {data ? `${data.product.name} (${data.product.sku})` : "Product Sales Trend"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer" }}>
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <p>Loading sales trend...</p>
          </div>
        ) : error ? (
          <div style={{ color: "crimson", textAlign: "center", padding: 40 }}>
            <p>❌ {error}</p>
          </div>
        ) : data ? (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
                <strong>Total Units Sold (30d):</strong> {data.totalUnits}
              </div>
              <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
                <strong>Total Sales (30d):</strong> {data.totalSales}
              </div>
            </div>

            <div style={{ height: 400, border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
              {data.salesData.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <p style={{ opacity: 0.6 }}>No sales data available for this product</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.salesData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value: any, key: any) => {
                        if (key === "units") return [value, "Units Sold"];
                        if (key === "salesCount") return [value, "Sales Count"];
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
                      dataKey="salesCount" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Sales Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
