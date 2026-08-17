import { useEffect, useState } from "react";
import { Database, Microscope, PlayCircle, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import {
  embedPendingChunks,
  getVectorStats,
  prepareVectorCollection,
  resetFailedEmbeddings
} from "../../api/vectorApi";

export default function AdminVectors() {
  const [stats, setStats] = useState({
    totalChunks: 0,
    pendingChunks: 0,
    embeddedChunks: 0,
    failedChunks: 0,
    indexedDocuments: 0,
    documentsWithEmbeddings: 0
  });

  const [batchSize, setBatchSize] = useState(25);
  const [status, setStatus] = useState("loading");
  const [prepareStatus, setPrepareStatus] = useState("idle");
  const [embedStatus, setEmbedStatus] = useState("idle");
  const [resetStatus, setResetStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function loadStats() {
    try {
      setStatus("loading");

      const response = await getVectorStats();

      setStats(response.data.stats);
      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      setMessage(error.response?.data?.message || "Could not load vector stats");
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handlePrepareCollection() {
    try {
      setPrepareStatus("loading");
      setMessage("");

      const response = await prepareVectorCollection();

      setMessage(response.message || "Qdrant collection is ready");
      setPrepareStatus("succeeded");
      await loadStats();
    } catch (error) {
      setPrepareStatus("failed");
      setMessage(
        error.response?.data?.message || "Could not prepare Qdrant collection"
      );
    }
  }

  async function handleEmbedChunks() {
    try {
      setEmbedStatus("loading");
      setMessage("");

      const safeBatchSize = Math.max(1, Math.min(Number(batchSize) || 1, 100));
      const response = await embedPendingChunks(safeBatchSize);

      setMessage(
        `Embedding completed. Embedded ${response.data.result.embedded}, failed ${response.data.result.failed}, selected ${response.data.result.totalSelected}.`
      );

      setEmbedStatus("succeeded");
      await loadStats();
    } catch (error) {
      setEmbedStatus("failed");
      setMessage(error.response?.data?.message || "Could not embed chunks");
    }
  }

  async function handleResetFailed() {
    const confirmed = window.confirm(
      "Reset failed chunk embeddings back to pending so they can be embedded again?"
    );

    if (!confirmed) return;

    try {
      setResetStatus("loading");
      setMessage("");

      const response = await resetFailedEmbeddings();

      setMessage(
        `Reset ${response.data.result.resetCount} failed chunk embedding(s) back to pending.`
      );

      setResetStatus("succeeded");
      await loadStats();
    } catch (error) {
      setResetStatus("failed");
      setMessage(error.response?.data?.message || "Could not reset embeddings");
    }
  }

  const busy =
    prepareStatus === "loading" ||
    embedStatus === "loading" ||
    resetStatus === "loading";

  const embeddedPercent =
    stats.totalChunks === 0
      ? 0
      : Math.round((stats.embeddedChunks / stats.totalChunks) * 100);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          Safe vector embedding
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--app-text)]">
              Vector Index
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
              Convert extracted chunks into OpenAI embeddings and store them in
              Qdrant in controlled batches.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handlePrepareCollection}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-50"
              >
                <Database size={16} />
                {prepareStatus === "loading" ? "Preparing..." : "Prepare Qdrant"}
              </button>

              <button
                onClick={handleResetFailed}
                disabled={busy || stats.failedChunks === 0}
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
                <option value={5}>5 chunks</option>
                <option value={25}>25 chunks</option>
                <option value={50}>50 chunks</option>
                <option value={100}>100 chunks</option>
              </select>

              <button
                onClick={handleEmbedChunks}
                disabled={busy || stats.pendingChunks === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:bg-[var(--brand-blue-hover)] disabled:opacity-70 dark:text-[#052033]"
              >
                <PlayCircle size={16} />
                {embedStatus === "loading"
                  ? "Embedding..."
                  : `Embed ${batchSize}`}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--brand-sky-soft)] px-4 py-3 text-sm font-medium text-[var(--brand-blue)]">
            {message}
          </div>
        )}

        {status === "failed" && !message && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Could not load vector stats.
          </div>
        )}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--app-text)]">
              Embedding progress
            </span>
            <span className="text-[var(--app-muted)]">{embeddedPercent}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
            <div
              className="h-full rounded-full bg-[var(--brand-blue)] transition-all"
              style={{ width: `${embeddedPercent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Indexed docs" value={stats.indexedDocuments} />
        <MetricCard
          label="Docs with vectors"
          value={stats.documentsWithEmbeddings}
        />
        <MetricCard label="Total chunks" value={stats.totalChunks} />
        <MetricCard label="Pending chunks" value={stats.pendingChunks} />
        <MetricCard label="Embedded chunks" value={stats.embeddedChunks} />
        <MetricCard label="Failed chunks" value={stats.failedChunks} />
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
              <Microscope size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--app-text)]">
                Test retrieval quality in Retrieval Lab
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--app-muted)]">
                Vector Index is for managing embeddings and Qdrant indexing.
                Use Retrieval Lab to test semantic search, inspect matching
                chunks, check relevance scores, and preview the sources that
                power chat citations.
              </p>
            </div>
          </div>

          <Link
            to="/dashboard/admin/retrieval"
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:bg-[var(--brand-blue-hover)] dark:text-[#052033]"
          >
            Open Retrieval Lab
          </Link>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
      <p className="text-sm text-[var(--app-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--app-text)]">{value}</p>
    </div>
  );
}