import { useEffect, useState } from "react";
import {
  BookOpenCheck,
  BrainCircuit,
  Eye,
  Search,
  SlidersHorizontal
} from "lucide-react";
import {
  getSourceQualitySummary,
  previewChunk,
  testRetrieval
} from "../../api/retrievalApi";

export default function AdminRetrieval() {
  const [form, setForm] = useState({
    query: "mixed methods evaluation design",
    topK: 5,
    candidateK: 20,
    minScore: 0.2,
    maxChunksPerDocument: 2
  });

  const [quality, setQuality] = useState(null);
  const [retrievalResult, setRetrievalResult] = useState(null);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [status, setStatus] = useState("idle");
  const [qualityStatus, setQualityStatus] = useState("loading");
  const [previewStatus, setPreviewStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function loadQuality() {
    try {
      setQualityStatus("loading");
      const response = await getSourceQualitySummary();
      setQuality(response.data.summary);
      setQualityStatus("succeeded");
    } catch (error) {
      setQualityStatus("failed");
      setMessage(
        error.response?.data?.message || "Could not load source quality"
      );
    }
  }

  useEffect(() => {
    loadQuality();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setStatus("loading");
      setMessage("");
      setSelectedChunk(null);

      const response = await testRetrieval({
        query: form.query,
        topK: Number(form.topK),
        candidateK: Number(form.candidateK),
        minScore: Number(form.minScore),
        maxChunksPerDocument: Number(form.maxChunksPerDocument)
      });

      setRetrievalResult(response.data.result);
      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      setMessage(error.response?.data?.message || "Retrieval test failed");
    }
  }

  async function handlePreview(chunkId) {
    try {
      setPreviewStatus("loading");
      setMessage("");

      const response = await previewChunk(chunkId);

      setSelectedChunk(response.data.chunk);
      setPreviewStatus("succeeded");
    } catch (error) {
      setPreviewStatus("failed");
      setMessage(error.response?.data?.message || "Could not preview chunk");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          Citation quality and retrieval tuning
        </div>

        <h1 className="text-3xl font-bold text-[var(--app-text)]">
          Retrieval Lab
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
          Test how Qdrant retrieves source chunks, preview citations, and use
          source feedback to improve answer quality.
        </p>

        {message && (
          <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--brand-sky-soft)] px-4 py-3 text-sm font-medium text-[var(--brand-blue)]">
            {message}
          </div>
        )}
      </section>

      <section className="grid gap-5 md:grid-cols-4">
        <MetricCard
          label="Source feedback"
          value={quality?.totalSourceFeedback || 0}
        />
        <MetricCard label="Useful" value={quality?.usefulSources || 0} />
        <MetricCard label="Not useful" value={quality?.notUsefulSources || 0} />
        <MetricCard
          label="Usefulness rate"
          value={`${quality?.usefulnessRate || 0}%`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
              <SlidersHorizontal size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--app-text)]">
                Retrieval settings
              </h2>
              <p className="text-sm text-[var(--app-muted)]">
                Test retrieval without generating an answer.
              </p>
            </div>
          </div>

          <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
            Test query
          </label>
          <textarea
            value={form.query}
            onChange={(event) => updateField("query", event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumberInput
              label="Top K"
              value={form.topK}
              onChange={(value) => updateField("topK", value)}
            />

            <NumberInput
              label="Candidate K"
              value={form.candidateK}
              onChange={(value) => updateField("candidateK", value)}
            />

            <NumberInput
              label="Min score"
              value={form.minScore}
              step="0.05"
              onChange={(value) => updateField("minScore", value)}
            />

            <NumberInput
              label="Max chunks/document"
              value={form.maxChunksPerDocument}
              onChange={(value) => updateField("maxChunksPerDocument", value)}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:text-[#052033]"
          >
            <Search size={16} />
            {status === "loading" ? "Testing..." : "Test retrieval"}
          </button>
        </form>

        <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
              <BrainCircuit size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--app-text)]">
                Retrieved candidates
              </h2>
              <p className="text-sm text-[var(--app-muted)]">
                Selected results are the chunks that would be sent to the answer
                generator.
              </p>
            </div>
          </div>

          {!retrievalResult ? (
            <p className="text-sm text-[var(--app-muted)]">
              Run a retrieval test to see candidates.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--app-text)]">
                  Config used
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">
                  Top K: {retrievalResult.retrievalConfig.topK} · Candidate K:{" "}
                  {retrievalResult.retrievalConfig.candidateK} · Min score:{" "}
                  {retrievalResult.retrievalConfig.minScore} · Max chunks/doc:{" "}
                  {retrievalResult.retrievalConfig.maxChunksPerDocument}
                </p>
              </div>

              {retrievalResult.candidates.map((candidate) => (
                <CandidateCard
                  key={`${candidate.rank}-${candidate.chunkId}`}
                  candidate={candidate}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          )}
        </section>
      </section>

      {selectedChunk && (
        <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
              <BookOpenCheck size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--app-text)]">
                Source preview
              </h2>
              <p className="text-sm text-[var(--app-muted)]">
                {selectedChunk.documentId?.title || "Untitled source"} · Chunk{" "}
                {selectedChunk.chunkIndex}
              </p>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5 text-sm leading-7 text-[var(--app-text)]">
            {selectedChunk.text}
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <QualityPanel
          title="Most useful sources"
          items={quality?.topUsefulSources || []}
        />

        <QualityPanel
          title="Most not useful sources"
          items={quality?.topNotUsefulSources || []}
        />
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

function NumberInput({ label, value, onChange, step = "1" }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
        {label}
      </span>

      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
      />
    </label>
  );
}

function CandidateCard({ candidate, onPreview }) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        candidate.selected
          ? "border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)]"
          : "border-[var(--app-border)] bg-[var(--app-surface-muted)]"
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--app-text)]">
            #{candidate.rank} {candidate.documentTitle}
          </p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Chunk {candidate.chunkIndex} · Score{" "}
            {Number(candidate.score || 0).toFixed(4)} ·{" "}
            {candidate.selected ? "Selected" : "Candidate only"}
          </p>
        </div>

        <button
          onClick={() => onPreview(candidate.chunkId)}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
        >
          <Eye size={14} />
          Preview
        </button>
      </div>

      <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--app-muted)]">
        {candidate.excerpt}
      </p>
    </div>
  );
}

function QualityPanel({ title, items }) {
  return (
    <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
      <h2 className="mb-5 text-xl font-bold text-[var(--app-text)]">
        {title}
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--app-muted)]">No feedback yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={`${item._id?.chunkId}-${item._id?.sourceTitle}`}
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4"
            >
              <p className="text-sm font-semibold text-[var(--app-text)]">
                {item._id?.sourceTitle || "Untitled source"}
              </p>
              <p className="mt-2 text-xs text-[var(--app-muted)]">
                Count: {item.count} · Avg score:{" "}
                {Number(item.averageRetrievalScore || 0).toFixed(4)}
              </p>
              {item.latestComment && (
                <p className="mt-2 text-sm text-[var(--app-muted)]">
                  “{item.latestComment}”
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}