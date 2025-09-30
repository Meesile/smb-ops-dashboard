import { useEffect, useState } from "react";
import ConfirmModal from "./ConfirmModal";

type ImportJob = {
  id: string;
  filename: string;
  source: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processedRows: number;
  createdAt: string;
  completedAt?: string | null;
};

type ErrorRow = {
  id: string;
  sku: string | null;
  name: string | null;
  quantity: number | null;
  threshold: number | null;
  error: string | null;
  rawText: string | null;
  createdAt: string;
};

export default function ImportHistory() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [jobErrors, setJobErrors] = useState<Record<string, ErrorRow[]>>({});
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const fetchJobs = async () => {
    try {
      setError("");
      setRefreshing(true);
      const res = await fetch("http://localhost:4000/api/imports/jobs");
      if (!res.ok) throw new Error("Failed to load import jobs");
      const data = (await res.json()) as ImportJob[];
      setJobs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load import jobs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchErrorsForJob = async (jobId: string) => {
    if (jobErrors[jobId]) return; // cache per session
    try {
      const res = await fetch(`http://localhost:4000/api/imports/jobs/${encodeURIComponent(jobId)}/errors`);
      if (!res.ok) throw new Error("Failed to load job errors");
      const data = (await res.json()) as ErrorRow[];
      setJobErrors((prev) => ({ ...prev, [jobId]: Array.isArray(data) ? data : [] }));
    } catch (e) {
      setJobErrors((prev) => ({ ...prev, [jobId]: [] }));
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const toggleOpen = async (jobId: string) => {
    if (openJobId === jobId) {
      setOpenJobId(null);
    } else {
      setOpenJobId(jobId);
      await fetchErrorsForJob(jobId);
    }
  };

  const deleteJob = async (jobId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Import Job",
      message: "Are you sure you want to delete this import job? This action cannot be undone.",
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          setDeleting(true);
          const res = await fetch(`http://localhost:4000/api/imports/jobs/${encodeURIComponent(jobId)}`, {
            method: "DELETE",
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to delete job");
          }
          
          await fetchJobs(); // Refresh the list
        } catch (e: any) {
          setError(e?.message || "Failed to delete job");
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  const deleteAllJobs = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Delete All Import Jobs",
      message: "Are you sure you want to delete ALL import jobs? This action cannot be undone.",
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          setDeleting(true);
          const res = await fetch("http://localhost:4000/api/imports/jobs", {
            method: "DELETE",
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to delete jobs");
          }
          
          const data = await res.json();
          console.log(`Deleted ${data.deletedCount} import jobs`);
          await fetchJobs(); // Refresh the list
        } catch (e: any) {
          setError(e?.message || "Failed to delete jobs");
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Import History</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchJobs} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh"}</button>
          {jobs.length > 0 && (
            <button 
              onClick={deleteAllJobs} 
              disabled={deleting}
              style={{ color: "#b00020" }}
            >
              {deleting ? "Deleting…" : "Delete All"}
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p style={{ color: "crimson" }}>❌ {error}</p>
      ) : jobs.length === 0 ? (
        <p>No import jobs yet</p>
      ) : (
        <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 2fr 2fr 1fr", padding: 8, background: "#fafafa", fontWeight: 600, fontSize: 14 }}>
            <div>File</div>
            <div>Status</div>
            <div>Rows (total / valid / invalid)</div>
            <div>Processed</div>
            <div>Timestamps</div>
            <div>Actions</div>
          </div>
          {jobs.map((j) => (
            <div key={j.id} style={{ borderTop: "1px solid #eee" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 2fr 2fr 1fr", padding: 8, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{j.filename}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{j.source.toUpperCase()}</div>
                </div>
                <div>
                  <span style={{
                    padding: "2px 6px",
                    borderRadius: 6,
                    background: j.status === "COMPLETED" ? "#e6ffed" : j.status === "FAILED" ? "#ffe6e6" : "#eef",
                    color: j.status === "COMPLETED" ? "#137333" : j.status === "FAILED" ? "#b00020" : "#223"
                  }}>{j.status}</span>
                </div>
                <div>
                  {j.totalRows} / {j.validRows} / {j.invalidRows}
                </div>
                <div>{j.processedRows}</div>
                <div>
                  <div style={{ fontSize: 12 }}>Created: {new Date(j.createdAt).toLocaleString()}</div>
                  <div style={{ fontSize: 12 }}>Finished: {j.completedAt ? new Date(j.completedAt).toLocaleString() : "—"}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
                  <button onClick={() => toggleOpen(j.id)}>{openJobId === j.id ? "Hide" : "View"} errors</button>
                  <button 
                    onClick={() => deleteJob(j.id)} 
                    disabled={deleting}
                    style={{ color: "#b00020", fontSize: 12 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {openJobId === j.id && (
                <div style={{ padding: 8, background: "#fafafa" }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Invalid rows</div>
                  {jobErrors[j.id] && jobErrors[j.id].length > 0 ? (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>SKU</th>
                          <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Name</th>
                          <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Qty</th>
                          <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Threshold</th>
                          <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Error</th>
                          <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>Raw</th>
                          <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 6 }}>When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobErrors[j.id].map((r) => (
                          <tr key={r.id}>
                            <td style={{ padding: 6 }}>{r.sku ?? ""}</td>
                            <td style={{ padding: 6 }}>{r.name ?? ""}</td>
                            <td style={{ padding: 6 }}>{r.quantity ?? ""}</td>
                            <td style={{ padding: 6 }}>{r.threshold ?? ""}</td>
                            <td style={{ padding: 6, color: "#b00020" }}>{r.error ?? ""}</td>
                            <td style={{ padding: 6, fontFamily: "monospace", fontSize: 12, maxWidth: 360, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.rawText ?? ""}</td>
                            <td style={{ padding: 6, fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ fontSize: 12, opacity: 0.8 }}>No invalid rows</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        confirmText="Delete"
        isDangerous={true}
      />
    </div>
  );
}
