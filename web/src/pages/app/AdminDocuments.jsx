import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  PlayCircle,
  RefreshCw,
  RotateCcw
} from "lucide-react";
import {
  disableDocument,
  getAdminDocuments,
  getIngestionLogs,
  processPendingDocuments,
  resetFailedDocuments,
  syncGoogleDriveDocuments
} from "../../api/documentApi";

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    indexed: 0,
    failed: 0,
    disabled: 0
  });
  const [logs, setLogs] = useState([]);
  const [batchSize, setBatchSize] = useState(3);
  const [status, setStatus] = useState("loading");
  const [syncStatus, setSyncStatus] = useState("idle");
  const [processStatus, setProcessStatus] = useState("idle");
  const [resetStatus, setResetStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setStatus("loading");

      const [documentsResponse, logsResponse] = await Promise.all([
        getAdminDocuments(),
        getIngestionLogs()
      ]);

      setDocuments(documentsResponse.data.documents);
      setPagination(documentsResponse.data.pagination);
      setCounts(
        documentsResponse.data.counts || {
          total: 0,
          pending: 0,
          processing: 0,
          indexed: 0,
          failed: 0,
          disabled: 0
        }
      );
      setLogs(logsResponse.data.logs);
      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      setMessage(error.response?.data?.message || "Could not load documents");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSync() {
    try {
      setSyncStatus("loading");
      setMessage("");

      const response = await syncGoogleDriveDocuments();

      setMessage(
        `Sync completed. Created ${response.data.result.created}, updated ${response.data.result.updated}, skipped ${response.data.result.skipped}, failed ${response.data.result.failed}.`
      );

      setSyncStatus("succeeded");
      await loadData();
    } catch (error) {
      setSyncStatus("failed");
      setMessage(error.response?.data?.message || "Google Drive sync failed");
    }
  }

  async function handleProcess() {
    try {
      setProcessStatus("loading");
      setMessage("");

      const safeBatchSize = Math.max(1, Math.min(Number(batchSize) || 1, 10));
      const response = await processPendingDocuments(safeBatchSize);

      setMessage(
        `Processing completed. Indexed ${response.data.result.indexed}, failed ${response.data.result.failed}, selected ${response.data.result.totalSelected}.`
      );

      setProcessStatus("succeeded");
      await loadData();
    } catch (error) {
      setProcessStatus("failed");
      setMessage(error.response?.data?.message || "Document processing failed");
    }
  }

  async function handleResetFailed() {
    const confirmed = window.confirm(
      "Reset failed documents back to pending so they can be processed again?"
    );

    if (!confirmed) return;

    try {
      setResetStatus("loading");
      setMessage("");

      const response = await resetFailedDocuments();

      setMessage(
        `Reset ${response.data.result.resetCount} failed document(s) back to pending.`
      );

      setResetStatus("succeeded");
      await loadData();
    } catch (error) {
      setResetStatus("failed");
      setMessage(error.response?.data?.message || "Could not reset documents");
    }
  }

  async function handleDisable(documentId) {
    const confirmed = window.confirm(
      "Disable this document? It will be excluded from future retrieval."
    );

    if (!confirmed) return;

    try {
      await disableDocument(documentId);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not disable document");
    }
  }

  const busy =
    syncStatus === "loading" ||
    processStatus === "loading" ||
    resetStatus === "loading";

  const indexedPercent =
    counts.total === 0 ? 0 : Math.round((counts.indexed / counts.total) * 100);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          Safe batch processing
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--app-text)]">
              Documents
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
              Process Google Drive PDFs in controlled batches. Start small, then
              increase batch size once processing is stable.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSync}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:bg-[var(--brand-blue-hover)] disabled:opacity-70 dark:text-[#052033]"
              >
                <RefreshCw
                  size={16}
                  className={syncStatus === "loading" ? "animate-spin" : ""}
                />
                {syncStatus === "loading" ? "Syncing..." : "Sync Drive"}
              </button>

              <button
                onClick={handleResetFailed}
                disabled={busy || counts.failed === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Reset failed
              </button>
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 sm:flex-row sm:items-center">
              <label className="text-sm font-semibold text-[var(--app-text)]">
                Batch
              </label>

              <select
                value={batchSize}
                onChange={(event) => setBatchSize(Number(event.target.value))}
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value={1}>1 document</option>
                <option value={3}>3 documents</option>
                <option value={5}>5 documents</option>
                <option value={10}>10 documents</option>
              </select>

              <button
                onClick={handleProcess}
                disabled={busy || counts.pending === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 dark:text-[#052033]"
              >
                <PlayCircle size={16} />
                {processStatus === "loading"
                  ? "Processing..."
                  : `Process ${batchSize}`}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--brand-sky-soft)] px-4 py-3 text-sm font-medium text-[var(--brand-blue)]">
            {message}
          </div>
        )}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--app-text)]">
              Processing progress
            </span>
            <span className="text-[var(--app-muted)]">{indexedPercent}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
            <div
              className="h-full rounded-full bg-[var(--brand-blue)] transition-all"
              style={{ width: `${indexedPercent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-5">
        <MetricCard icon={<BookOpenCheck />} label="Documents" value={counts.total} />
        <MetricCard icon={<CheckCircle2 />} label="Pending" value={counts.pending} />
        <MetricCard icon={<RefreshCw />} label="Processing" value={counts.processing} />
        <MetricCard icon={<FileText />} label="Indexed" value={counts.indexed} />
        <MetricCard icon={<AlertTriangle />} label="Failed" value={counts.failed} />
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <h2 className="text-xl font-bold text-[var(--app-text)]">
          Synced documents
        </h2>

        {status === "loading" ? (
          <p className="mt-5 text-sm text-[var(--app-muted)]">
            Loading documents...
          </p>
        ) : documents.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--app-muted)]">
            No documents synced yet. Click “Sync Drive”.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border)] text-[var(--app-muted)]">
                  <th className="py-3 pr-4">Title</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Chunks</th>
                  <th className="py-3 pr-4">Tokens</th>
                  <th className="py-3 pr-4">Size</th>
                  <th className="py-3 pr-4">Last synced</th>
                  <th className="py-3 pr-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {documents.map((document) => (
                  <tr
                    key={document._id}
                    className="border-b border-[var(--app-border)]"
                  >
                    <td className="max-w-[340px] py-4 pr-4">
                      <p className="font-semibold text-[var(--app-text)]">
                        {document.title}
                      </p>

                      <p className="mt-1 text-xs text-[var(--app-muted)]">
                        {document.fileName}
                      </p>

                      {document.errorMessage && (
                        <p className="mt-2 text-xs text-red-600">
                          {document.errorMessage}
                        </p>
                      )}
                    </td>

                    <td className="py-4 pr-4 text-[var(--app-muted)]">
                      {document.fileType || "unknown"}
                    </td>

                    <td className="py-4 pr-4">
                      <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--app-text)]">
                        {document.status}
                      </span>
                    </td>

                    <td className="py-4 pr-4 text-[var(--app-muted)]">
                      {document.totalChunks || 0}
                    </td>

                    <td className="py-4 pr-4 text-[var(--app-muted)]">
                      {document.totalTokens || 0}
                    </td>

                    <td className="py-4 pr-4 text-[var(--app-muted)]">
                      {formatFileSize(document.driveSize)}
                    </td>

                    <td className="py-4 pr-4 text-[var(--app-muted)]">
                      {document.lastSyncedAt
                        ? new Date(document.lastSyncedAt).toLocaleString()
                        : "—"}
                    </td>

                    <td className="py-4 pr-4">
                      {document.status !== "disabled" ? (
                        <button
                          onClick={() => handleDisable(document._id)}
                          className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
                        >
                          Disable
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--app-muted)]">
                          Disabled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && (
          <p className="mt-4 text-sm text-[var(--app-muted)]">
            Showing page {pagination.page} of {pagination.totalPages}. Total
            records: {pagination.total}.
          </p>
        )}
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <h2 className="text-xl font-bold text-[var(--app-text)]">
          Recent ingestion logs
        </h2>

        <div className="mt-5 space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-[var(--app-muted)]">No logs yet.</p>
          ) : (
            logs.map((log) => (
              <div
                key={log._id}
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--app-text)]">
                    {log.action}
                  </p>

                  <span className="rounded-full border border-[var(--app-border)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                    {log.status}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                  {log.message}
                </p>

                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        {icon}
      </div>

      <p className="text-sm text-[var(--app-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--app-text)]">{value}</p>
    </div>
  );
}

function formatFileSize(size = 0) {
  if (!size) return "—";

  const mb = size / (1024 * 1024);

  if (mb < 1) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${mb.toFixed(1)} MB`;
}