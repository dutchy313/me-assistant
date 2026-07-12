import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Target,
  ThumbsUp,
  Zap
} from "lucide-react";
import {
  evaluateSnapshot,
  evaluateSnapshotsBatch,
  getEvaluationSnapshots,
  getEvaluationSummary,
  getRagEvaluations
} from "../../api/ragEvaluationApi";

export default function AdminEvaluations() {
  const [summary, setSummary] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotPagination, setSnapshotPagination] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationPagination, setEvaluationPagination] = useState(null);

  const [snapshotPage, setSnapshotPage] = useState(1);
  const [evaluationPage, setEvaluationPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [evaluationStatusFilter, setEvaluationStatusFilter] =
    useState("not_evaluated");

  const [batchSize, setBatchSize] = useState(3);
  const [status, setStatus] = useState("loading");
  const [evaluateStatus, setEvaluateStatus] = useState("idle");
  const [batchEvaluateStatus, setBatchEvaluateStatus] = useState("idle");
  const [evaluatingSnapshotId, setEvaluatingSnapshotId] = useState("");
  const [message, setMessage] = useState("");

  async function loadData(options = {}) {
    try {
      setStatus("loading");

      const nextSnapshotPage = options.snapshotPage ?? snapshotPage;
      const nextEvaluationPage = options.evaluationPage ?? evaluationPage;
      const nextLimit = options.limit ?? pageLimit;
      const nextEvaluationStatus =
        options.evaluationStatusFilter ?? evaluationStatusFilter;

      const [summaryResponse, snapshotsResponse, evaluationsResponse] =
        await Promise.all([
          getEvaluationSummary(),
          getEvaluationSnapshots({
            page: nextSnapshotPage,
            limit: nextLimit,
            evaluationStatus: nextEvaluationStatus
          }),
          getRagEvaluations({
            page: nextEvaluationPage,
            limit: nextLimit
          })
        ]);

      setSummary(summaryResponse.data);
      setSnapshots(snapshotsResponse.data.snapshots || []);
      setSnapshotPagination(snapshotsResponse.data.pagination || null);
      setEvaluations(evaluationsResponse.data.evaluations || []);
      setEvaluationPagination(evaluationsResponse.data.pagination || null);

      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      setMessage(
        error.response?.data?.message || "Could not load evaluation dashboard"
      );
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleEvaluateSnapshot(snapshot) {
    const confirmed = window.confirm(
      `Evaluate this answer?\n\nQuestion:\n${snapshot.originalQuestion}\n\nThis will use the evaluator model and save 1–5 scores.`
    );

    if (!confirmed) return;

    try {
      setEvaluateStatus("loading");
      setEvaluatingSnapshotId(snapshot._id);
      setMessage("");

      const response = await evaluateSnapshot(snapshot._id);
      const evaluation = response.data.evaluation;

      setMessage(
        `Evaluation completed. Overall score: ${evaluation.overallScore}/5 (${formatOverallLabel(
          evaluation.overallLabel
        )}).`
      );

      setEvaluateStatus("succeeded");
      setEvaluatingSnapshotId("");

      await loadData();
    } catch (error) {
      setEvaluateStatus("failed");
      setEvaluatingSnapshotId("");
      setMessage(error.response?.data?.message || "Could not evaluate snapshot");
    }
  }

  async function handleBatchEvaluate() {
    const confirmed = window.confirm(
      `Evaluate up to ${batchSize} waiting snapshot(s)?\n\nThis will call the evaluator model once per answer and save 1–5 scores.`
    );

    if (!confirmed) return;

    try {
      setBatchEvaluateStatus("loading");
      setMessage("");

      const response = await evaluateSnapshotsBatch(batchSize);
      const result = response.data.result;

      setMessage(
        `Batch evaluation completed. Selected ${result.totalSelected}, evaluated ${result.evaluated}, already evaluated ${result.alreadyEvaluated}, failed ${result.failed}.`
      );

      setBatchEvaluateStatus("succeeded");
      setEvaluationStatusFilter("not_evaluated");
      setSnapshotPage(1);
      setEvaluationPage(1);

      await loadData({
        snapshotPage: 1,
        evaluationPage: 1,
        evaluationStatusFilter: "not_evaluated"
      });
    } catch (error) {
      setBatchEvaluateStatus("failed");
      setMessage(error.response?.data?.message || "Could not run batch evaluation");
    }
  }

  async function handleSnapshotStatusFilterChange(value) {
    setEvaluationStatusFilter(value);
    setSnapshotPage(1);

    await loadData({
      snapshotPage: 1,
      evaluationStatusFilter: value
    });
  }

  async function handleLimitChange(value) {
    const nextLimit = Number(value);

    setPageLimit(nextLimit);
    setSnapshotPage(1);
    setEvaluationPage(1);

    await loadData({
      snapshotPage: 1,
      evaluationPage: 1,
      limit: nextLimit
    });
  }

  async function goToSnapshotPage(nextPage) {
    setSnapshotPage(nextPage);
    await loadData({ snapshotPage: nextPage });
  }

  async function goToEvaluationPage(nextPage) {
    setEvaluationPage(nextPage);
    await loadData({ evaluationPage: nextPage });
  }

  const busy =
    status === "loading" ||
    evaluateStatus === "loading" ||
    batchEvaluateStatus === "loading";

  const averages = summary?.averages || {
    overallScore: 0,
    contextRelevance: 0,
    contextSufficiency: 0,
    answerRelevance: 0,
    answerCorrectness: 0,
    answerGroundedness: 0
  };

  const totalEvaluations = summary?.totalEvaluations || 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          RAG quality evaluation
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--app-text)]">
              Evaluation Dashboard
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
              Review source-grounded answers using the 1–5 rubric for context
              relevance, context sufficiency, answer relevance, answer
              correctness, and groundedness.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => loadData()}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={status === "loading" ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <div className="flex flex-col gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 sm:flex-row sm:items-center">
              <label className="text-sm font-semibold text-[var(--app-text)]">
                Batch
              </label>

              <select
                value={batchSize}
                onChange={(event) => setBatchSize(Number(event.target.value))}
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value={1}>1 answer</option>
                <option value={3}>3 answers</option>
                <option value={5}>5 answers</option>
                <option value={10}>10 answers</option>
              </select>

              <button
                onClick={handleBatchEvaluate}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 dark:text-[#052033]"
              >
                {batchEvaluateStatus === "loading" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} />
                )}
                {batchEvaluateStatus === "loading"
                  ? "Evaluating..."
                  : "Evaluate batch"}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--brand-sky-soft)] px-4 py-3 text-sm font-medium text-[var(--brand-blue)]">
            {message}
          </div>
        )}
      </section>

      <section className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={<BarChart3 />}
          label="Evaluations"
          value={totalEvaluations}
          detail="Completed scoring runs"
        />
        <MetricCard
          icon={<ClipboardCheck />}
          label="Overall"
          value={formatScore(averages.overallScore)}
          detail="Average score"
        />
        <MetricCard
          icon={<SearchCheck />}
          label="Context relevance"
          value={formatScore(averages.contextRelevance)}
          detail="Retrieved chunks match question"
        />
        <MetricCard
          icon={<Target />}
          label="Context sufficiency"
          value={formatScore(averages.contextSufficiency)}
          detail="Enough evidence to answer"
        />
        <MetricCard
          icon={<ThumbsUp />}
          label="Answer relevance"
          value={formatScore(averages.answerRelevance)}
          detail="Directness of answer"
        />
        <MetricCard
          icon={<ShieldCheck />}
          label="Groundedness"
          value={formatScore(averages.answerGroundedness)}
          detail="Hallucination control"
        />
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--app-text)]">
              Evaluation snapshots
            </h2>

            <p className="mt-2 text-sm text-[var(--app-muted)]">
              These are saved RAG answer snapshots waiting for scoring or
              already scored.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                Snapshot status
              </span>

              <select
                value={evaluationStatusFilter}
                onChange={(event) =>
                  handleSnapshotStatusFilterChange(event.target.value)
                }
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value="">All</option>
                <option value="not_evaluated">Not evaluated</option>
                <option value="evaluating">Evaluating</option>
                <option value="evaluated">Evaluated</option>
                <option value="failed">Failed</option>
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                Rows
              </span>

              <select
                value={pageLimit}
                onChange={(event) => handleLimitChange(event.target.value)}
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>

            <button
              onClick={() => handleSnapshotStatusFilterChange("not_evaluated")}
              className="self-end rounded-2xl border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
            >
              Show queue
            </button>
          </div>
        </div>

        {status === "loading" ? (
          <p className="mt-5 text-sm text-[var(--app-muted)]">
            Loading snapshots...
          </p>
        ) : snapshots.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--app-muted)]">
            No snapshots match the selected filter.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {snapshots.map((snapshot) => {
              const isEvaluating = evaluatingSnapshotId === snapshot._id;

              return (
                <article
                  key={snapshot._id}
                  className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-4xl">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <StatusBadge status={snapshot.evaluationStatus} />

                        <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                          {new Date(snapshot.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[var(--app-text)]">
                        {snapshot.originalQuestion}
                      </h3>

                      {snapshot.rewrittenQuestion &&
                        snapshot.rewrittenQuestion !==
                          snapshot.originalQuestion && (
                          <p className="mt-2 text-sm text-[var(--app-muted)]">
                            Retrieval query: {snapshot.rewrittenQuestion}
                          </p>
                        )}

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--app-muted)]">
                        {snapshot.answer}
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <SmallInfo
                          label="Retrieved"
                          value={snapshot.retrievedChunks?.length || 0}
                        />
                        <SmallInfo
                          label="Citations"
                          value={snapshot.citations?.length || 0}
                        />
                        <SmallInfo
                          label="Top K"
                          value={snapshot.retrievalConfig?.topK || "—"}
                        />
                        <SmallInfo
                          label="Min score"
                          value={snapshot.retrievalConfig?.minScore ?? "—"}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEvaluateSnapshot(snapshot)}
                        disabled={
                          busy ||
                          snapshot.evaluationStatus === "evaluated" ||
                          snapshot.evaluationStatus === "evaluating"
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 dark:text-[#052033]"
                      >
                        {isEvaluating ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ClipboardCheck size={16} />
                        )}
                        {isEvaluating ? "Evaluating..." : "Evaluate"}
                      </button>

                      {snapshot.evaluationStatus === "failed" &&
                        snapshot.errorMessage && (
                          <p className="max-w-xs text-xs leading-5 text-red-600">
                            {snapshot.errorMessage}
                          </p>
                        )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <PaginationControls
          pagination={snapshotPagination}
          onPrevious={() =>
            goToSnapshotPage(Math.max((snapshotPagination?.page || 1) - 1, 1))
          }
          onNext={() => goToSnapshotPage((snapshotPagination?.page || 1) + 1)}
        />
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--app-text)]">
              Completed evaluations
            </h2>

            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Review scored answers, weak spots, and recommended actions.
            </p>
          </div>
        </div>

        {evaluations.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--app-muted)]">
            No completed evaluations yet.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {evaluations.map((evaluation) => (
              <EvaluationCard key={evaluation._id} evaluation={evaluation} />
            ))}
          </div>
        )}

        <PaginationControls
          pagination={evaluationPagination}
          onPrevious={() =>
            goToEvaluationPage(
              Math.max((evaluationPagination?.page || 1) - 1, 1)
            )
          }
          onNext={() =>
            goToEvaluationPage((evaluationPagination?.page || 1) + 1)
          }
        />
      </section>
    </div>
  );
}

function EvaluationCard({ evaluation }) {
  const snapshot = evaluation.snapshotId;

  return (
    <article className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-4xl">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue)]">
              Overall {evaluation.overallScore}/5
            </span>

            <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
              {formatOverallLabel(evaluation.overallLabel)}
            </span>

            <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
              Action: {formatAction(evaluation.recommendedAction)}
            </span>
          </div>

          <h3 className="text-lg font-bold text-[var(--app-text)]">
            {snapshot?.originalQuestion || "Question unavailable"}
          </h3>

          <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
            {evaluation.summary}
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            <ScorePill
              label="Context relevance"
              score={evaluation.contextRelevance?.score}
            />
            <ScorePill
              label="Context sufficiency"
              score={evaluation.contextSufficiency?.score}
            />
            <ScorePill
              label="Answer relevance"
              score={evaluation.answerRelevance?.score}
            />
            <ScorePill
              label="Correctness"
              score={evaluation.answerCorrectness?.score}
            />
            <ScorePill
              label="Groundedness"
              score={evaluation.answerGroundedness?.score}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ListBlock title="Strengths" items={evaluation.strengths} />
            <ListBlock title="Weaknesses" items={evaluation.weaknesses} />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-sm text-[var(--app-muted)]">
          <p className="font-semibold text-[var(--app-text)]">Evaluator</p>
          <p className="mt-1">{evaluation.evaluatorModel || "—"}</p>
          <p className="mt-3 font-semibold text-[var(--app-text)]">Date</p>
          <p className="mt-1">{new Date(evaluation.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </article>
  );
}

function ScorePill({ label, score }) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <p className="text-xs font-semibold text-[var(--app-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--app-text)]">
        {score || "—"}/5
      </p>
    </div>
  );
}

function ListBlock({ title, items = [] }) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <p className="text-sm font-bold text-[var(--app-text)]">{title}</p>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--app-muted)]">No items listed.</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--app-muted)]">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, detail }) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        {icon}
      </div>

      <p className="text-sm text-[var(--app-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--app-text)]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">{detail}</p>
    </div>
  );
}

function SmallInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
      <p className="text-xs font-semibold text-[var(--app-muted)]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[var(--app-text)]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const label = formatSnapshotStatus(status);
  const isFailed = status === "failed";
  const isEvaluated = status === "evaluated";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        isFailed
          ? "border-red-200 bg-red-50 text-red-700"
          : isEvaluated
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)]"
      }`}
    >
      {isFailed ? (
        <AlertTriangle size={14} />
      ) : isEvaluated ? (
        <CheckCircle2 size={14} />
      ) : (
        <ClipboardCheck size={14} />
      )}
      {label}
    </span>
  );
}

function PaginationControls({ pagination, onPrevious, onNext }) {
  if (!pagination) return null;

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-[var(--app-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--app-muted)]">
        Showing page {pagination.page} of {pagination.totalPages}. Total
        records: {pagination.total}.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onPrevious}
          disabled={!pagination.hasPreviousPage}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <button
          onClick={onNext}
          disabled={!pagination.hasNextPage}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-50"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function formatScore(value) {
  const number = Number(value || 0);

  if (!number) {
    return "—";
  }

  return `${number.toFixed(1)}/5`;
}

function formatSnapshotStatus(status = "not_evaluated") {
  if (status === "evaluating") return "Evaluating";
  if (status === "evaluated") return "Evaluated";
  if (status === "failed") return "Failed";

  return "Not evaluated";
}

function formatOverallLabel(label = "") {
  if (label === "excellent") return "Excellent";
  if (label === "very_good") return "Very good";
  if (label === "good") return "Good";
  if (label === "limited") return "Limited";
  if (label === "poor") return "Poor";

  return "Unrated";
}

function formatAction(action = "") {
  if (action === "accept") return "Accept";
  if (action === "review_answer") return "Review answer";
  if (action === "improve_retrieval") return "Improve retrieval";
  if (action === "improve_sources") return "Improve sources";
  if (action === "needs_human_review") return "Needs human review";

  return "Review answer";
}