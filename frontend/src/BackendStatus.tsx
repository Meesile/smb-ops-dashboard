import { useEffect, useState } from "react";

export default function BackendStatus() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    fetch("http://localhost:4000/api/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(`✅ ${data.status} @ ${data.timestamp}`);
      })
      .catch(() => {
        setStatus("❌ Cannot reach backend");
      });
  }, []);

  return (
    <div style={{ padding: "12px", border: "1px solid #ddd", borderRadius: "8px" }}>
      Backend Status: {status}
    </div>
  );
}