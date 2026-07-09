import { useEffect, useState } from "react";
import { BrainCircuit, Database, PlayCircle, Search } from "lucide-react";
import {
  embedPendingChunks,
  getVectorStats,
  prepareVectorCollection,
  semanticVectorSearch
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

  const [status, setStatus] = useState("loading");
  const [prepareStatus, setPrepareStatus] = useState("idle");
  const [embedStatus, setEmbedStatus] = useState("idle");
  const [searchStatus, setSearchStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const [query, setQuery] = useState("mixed methods evaluation design");
  const [results, setResults] = useState([]);

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

      const response = await embedPendingChunks(25);

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

  async function handleSearch(event) {
    event.preventDefault();

    try {
      setSearchStatus("loading");
      setMessage("");

      const response = await semanticVectorSearch({
        query,
        limit: 5
      });

      setResults(response.data.result.results);
      setSearchStatus("succeeded");
    } catch (error) {
      setSearchStatus("failed");
      setMessage(error.response?.data?.message || "Search failed");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          Qdrant + OpenAI embeddings
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--app-text)]">
              Vector Index
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
              Convert extracted chunks into OpenAI embeddings and store them in
              Qdrant for semantic search.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handlePrepareCollection}
              disabled={prepareStatus === "loading" || embedStatus === "loading"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-50"
            >
              <Database size={16} />
              {prepareStatus === "loading" ? "Preparing..." : "Prepare Qdrant"}
            </button>

            <button
              onClick={handleEmbedChunks}
              disabled={
                embedStatus === "loading" ||
                prepareStatus === "loading" ||
                stats.pendingChunks === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:bg-[var(--brand-blue-hover)] disabled:opacity-70 dark:text-[#052033]"
            >
              <PlayCircle size={16} />
              {embedStatus === "loading"
                ? "Embedding..."
                : "Embed 25 chunks"}
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--brand-sky-soft)] px-4 py-3 text-sm font-medium text-[var(--brand-blue)]">
            {message}
          </div>
        )}
      </section>

      <section className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Indexed docs" value={stats.indexedDocuments} />
        <MetricCard label="Docs with vectors" value={stats.documentsWithEmbeddings} />
        <MetricCard label="Total chunks" value={stats.totalChunks} />
        <MetricCard label="Pending chunks" value={stats.pendingChunks} />
        <MetricCard label="Embedded chunks" value={stats.embeddedChunks} />
        <MetricCard label="Failed chunks" value={stats.failedChunks} />
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
            <Search size={20} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--app-text)]">
              Test semantic search
            </h2>
            <p className="text-sm text-[var(--app-muted)]">
              This checks whether Qdrant can retrieve relevant chunks.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-[var(--app-text)] outline-none"
            placeholder="Example: outcome indicators for youth employment"
          />

          <button
            type="submit"
            disabled={searchStatus === "loading" || stats.embeddedChunks === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:text-[#052033]"
          >
            <BrainCircuit size={16} />
            {searchStatus === "loading" ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {results.length === 0 ? (
            <p className="text-sm text-[var(--app-muted)]">
              No search results yet.
            </p>
          ) : (
            results.map((result) => (
              <div
                key={result.id}
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--app-text)]">
                      {result.payload?.documentTitle || "Untitled document"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--app-muted)]">
                      Chunk {result.payload?.chunkIndex} · Score{" "}
                      {Number(result.score || 0).toFixed(4)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 line-clamp-5 text-sm leading-6 text-[var(--app-muted)]">
                  {result.payload?.text}
                </p>
              </div>
            ))
          )}
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