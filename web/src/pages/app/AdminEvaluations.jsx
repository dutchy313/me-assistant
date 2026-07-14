import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  Loader2,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Target,
  ThumbsUp,
  X,
  Zap
} from "lucide-react";
import {
  evaluateSnapshot,
  evaluateSnapshotsBatch,
  getEvaluationSnapshots,
  getEvaluationSummary,
  getRagEvaluation,
  getRagEvaluations,
  reviewRagEvaluation
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

  const [reviewStatusFilter, setReviewStatusFilter] = useState("");
  const [recommendedActionFilter, setRecommendedActionFilter] = useState("");
  const [reviewDecisionFilter, setReviewDecisionFilter] = useState("");
  const [maxOverallScoreFilter, setMaxOverallScoreFilter] = useState("");

  const [batchSize, setBatchSize] = useState(3);
  const [status, setStatus] = useState("loading");
  const [evaluateStatus, setEvaluateStatus] = useState("idle");
  const [batchEvaluateStatus, setBatchEvaluateStatus] = useState("idle");
  const [reviewStatus, setReviewStatus] = useState("idle");
  const [evaluatingSnapshotId, setEvaluatingSnapshotId] = useState("");
  const [message, setMessage] = useState("");

  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [detailStatus, setDetailStatus] = useState("idle");
  const [reviewDecision, setReviewDecision] = useState("accepted");
  const [reviewNote, setReviewNote] = useState("");

  async function loadData(options = {}) {
    try {
      setStatus("loading");

      const nextSnapshotPage = options.snapshotPage ?? snapshotPage;
      const nextEvaluationPage = options.evaluationPage ?? evaluationPage;
      const nextLimit = options.limit ?? pageLimit;
      const nextEvaluationStatus =
        options.evaluationStatusFilter ?? evaluationStatusFilter;

      const nextReviewStatus = options.reviewStatusFilter ?? reviewStatusFilter;
      const nextRecommendedAction =
        options.recommendedActionFilter ?? recommendedActionFilter;
      const nextReviewDecision =
        options.reviewDecisionFilter ?? reviewDecisionFilter;
      const nextMaxOverallScore =
        options.maxOverallScoreFilter ?? maxOverallScoreFilter;

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
            limit: nextLimit,
            reviewStatus: nextReviewStatus,
            recommendedAction: nextRecommendedAction,
            reviewDecision: nextReviewDecision,
            maxOverallScore: nextMaxOverallScore
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

  async function openEvaluationDetail(evaluationId) {
    try {
      setDetailStatus("loading");
      setMessage("");

      const response = await getRagEvaluation(evaluationId);
      const evaluation = response.data.evaluation;

      setSelectedEvaluation(evaluation);
      setReviewDecision(
        evaluation.reviewDecision && evaluation.reviewDecision !== "not_decided"
          ? evaluation.reviewDecision
          : suggestedReviewDecision(evaluation.recommendedAction)
      );
      setReviewNote(evaluation.reviewNote || "");

      setDetailStatus("succeeded");
    } catch (error) {
      setDetailStatus("failed");
      setMessage(error.response?.data?.message || "Could not load evaluation");
    }
  }

  function closeEvaluationDetail() {
    setSelectedEvaluation(null);
    setReviewDecision("accepted");
    setReviewNote("");
    setDetailStatus("idle");
  }

  async function handleSaveReview() {
    if (!selectedEvaluation) return;

    try {
      setReviewStatus("loading");
      setMessage("");

      await reviewRagEvaluation({
        evaluationId: selectedEvaluation._id,
        reviewDecision,
        reviewNote
      });

      setReviewStatus("succeeded");

      closeEvaluationDetail();

      setMessage("Evaluation review saved.");

      await loadData();
    } catch (error) {
      setReviewStatus("failed");
      setMessage(error.response?.data?.message || "Could not save review");
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

  async function applyEvaluationFilters(nextFilters = {}) {
    const nextReviewStatus =
      nextFilters.reviewStatusFilter ?? reviewStatusFilter;
    const nextRecommendedAction =
      nextFilters.recommendedActionFilter ?? recommendedActionFilter;
    const nextReviewDecision =
      nextFilters.reviewDecisionFilter ?? reviewDecisionFilter;
    const nextMaxOverallScore =
      nextFilters.maxOverallScoreFilter ?? maxOverallScoreFilter;

    setReviewStatusFilter(nextReviewStatus);
    setRecommendedActionFilter(nextRecommendedAction);
    setReviewDecisionFilter(nextReviewDecision);
    setMaxOverallScoreFilter(nextMaxOverallScore);
    setEvaluationPage(1);

    await loadData({
      evaluationPage: 1,
      reviewStatusFilter: nextReviewStatus,
      recommendedActionFilter: nextRecommendedAction,
      reviewDecisionFilter: nextReviewDecision,
      maxOverallScoreFilter: nextMaxOverallScore
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
  const reviewCounts = summary?.reviews || {};

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
              Score answers, inspect evidence, and mark reviewed decisions
              before releasing the assistant to beta users.
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
          label="Reviewed"
          value={reviewCounts.reviewed || 0}
          detail="Human-reviewed evaluations"
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
              Saved RAG answer snapshots waiting for scoring or already scored.
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--app-text)]">
              Completed evaluations
            </h2>

            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Filter weak answers, inspect context, and mark human review
              decisions.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-5">
            <label>
              <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                Review status
              </span>

              <select
                value={reviewStatusFilter}
                onChange={(event) =>
                  applyEvaluationFilters({
                    reviewStatusFilter: event.target.value
                  })
                }
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value="">All</option>
                <option value="unreviewed">Unreviewed</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                Action
              </span>

              <select
                value={recommendedActionFilter}
                onChange={(event) =>
                  applyEvaluationFilters({
                    recommendedActionFilter: event.target.value
                  })
                }
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value="">All</option>
                <option value="accept">Accept</option>
                <option value="review_answer">Review answer</option>
                <option value="improve_retrieval">Improve retrieval</option>
                <option value="improve_sources">Improve sources</option>
                <option value="needs_human_review">Needs human review</option>
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                Decision
              </span>

              <select
                value={reviewDecisionFilter}
                onChange={(event) =>
                  applyEvaluationFilters({
                    reviewDecisionFilter: event.target.value
                  })
                }
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value="">All</option>
                <option value="not_decided">Not decided</option>
                <option value="accepted">Accepted</option>
                <option value="answer_needs_fix">Answer needs fix</option>
                <option value="retrieval_needs_fix">Retrieval needs fix</option>
                <option value="source_needs_fix">Source needs fix</option>
                <option value="exclude_from_release">Exclude from release</option>
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                Max score
              </span>

              <select
                value={maxOverallScoreFilter}
                onChange={(event) =>
                  applyEvaluationFilters({
                    maxOverallScoreFilter: event.target.value
                  })
                }
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value="">Any</option>
                <option value="2">2 or lower</option>
                <option value="3">3 or lower</option>
                <option value="4">4 or lower</option>
              </select>
            </label>

            <button
              onClick={() =>
                applyEvaluationFilters({
                  reviewStatusFilter: "unreviewed",
                  recommendedActionFilter: "",
                  reviewDecisionFilter: "",
                  maxOverallScoreFilter: "3"
                })
              }
              className="self-end rounded-2xl border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
            >
              Weak queue
            </button>
          </div>
        </div>

        {evaluations.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--app-muted)]">
            No completed evaluations match the selected filters.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {evaluations.map((evaluation) => (
              <EvaluationCard
                key={evaluation._id}
                evaluation={evaluation}
                onOpen={() => openEvaluationDetail(evaluation._id)}
              />
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

      {selectedEvaluation && (
        <EvaluationDetailModal
          evaluation={selectedEvaluation}
          detailStatus={detailStatus}
          reviewStatus={reviewStatus}
          reviewDecision={reviewDecision}
          reviewNote={reviewNote}
          setReviewDecision={setReviewDecision}
          setReviewNote={setReviewNote}
          onClose={closeEvaluationDetail}
          onSaveReview={handleSaveReview}
        />
      )}
    </div>
  );
}

function EvaluationCard({ evaluation, onOpen }) {
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

            <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
              {evaluation.reviewStatus === "reviewed"
                ? "Reviewed"
                : "Unreviewed"}
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
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onOpen}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:text-[#052033]"
          >
            <Eye size={16} />
            Review
          </button>

          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-sm text-[var(--app-muted)]">
            <p className="font-semibold text-[var(--app-text)]">Decision</p>
            <p className="mt-1">{formatDecision(evaluation.reviewDecision)}</p>
            <p className="mt-3 font-semibold text-[var(--app-text)]">Date</p>
            <p className="mt-1">
              {new Date(evaluation.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function EvaluationDetailModal({
  evaluation,
  detailStatus,
  reviewStatus,
  reviewDecision,
  reviewNote,
  setReviewDecision,
  setReviewNote,
  onClose,
  onSaveReview
}) {
  const snapshot = evaluation.snapshotId || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
      <div className="mx-auto my-8 max-w-6xl rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-[var(--app-border)] pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
              Human quality review
            </div>

            <h2 className="text-2xl font-bold text-[var(--app-text)]">
              {snapshot.originalQuestion || "Question unavailable"}
            </h2>

            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Overall score: {evaluation.overallScore}/5 ·{" "}
              {formatOverallLabel(evaluation.overallLabel)} ·{" "}
              {formatAction(evaluation.recommendedAction)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--app-border)] text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]"
          >
            <X size={18} />
          </button>
        </div>

        {detailStatus === "loading" ? (
          <p className="py-10 text-sm text-[var(--app-muted)]">
            Loading evaluation details...
          </p>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <DetailBlock title="Assistant answer">
                <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--app-muted)]">
                  {snapshot.answer || "No answer stored."}
                </p>
              </DetailBlock>

              <DetailBlock title="Selected context">
                <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-[var(--app-surface-muted)] p-4 text-xs leading-6 text-[var(--app-muted)]">
                  {snapshot.selectedContextText || "No selected context stored."}
                </pre>
              </DetailBlock>

              <DetailBlock title="Citations">
                <div className="space-y-3">
                  {(snapshot.citations || []).length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">
                      No citations stored.
                    </p>
                  ) : (
                    snapshot.citations.map((citation, index) => (
                      <div
                        key={`${citation.chunkId || index}`}
                        className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4"
                      >
                        <p className="text-sm font-bold text-[var(--app-text)]">
                          Source {citation.sourceNumber || index + 1}:{" "}
                          {citation.citationLabel ||
                            citation.canonicalTitle ||
                            citation.documentTitle ||
                            "Untitled source"}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">
                          Chunk {citation.chunkIndex} · Score{" "}
                          {Number(citation.score || 0).toFixed(4)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                          {citation.excerpt}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </DetailBlock>
            </div>

            <div className="space-y-5">
              <DetailBlock title="Evaluator scores">
                <div className="grid gap-3">
                  <MetricReason
                    title="Context relevance"
                    metric={evaluation.contextRelevance}
                  />
                  <MetricReason
                    title="Context sufficiency"
                    metric={evaluation.contextSufficiency}
                  />
                  <MetricReason
                    title="Answer relevance"
                    metric={evaluation.answerRelevance}
                  />
                  <MetricReason
                    title="Answer correctness"
                    metric={evaluation.answerCorrectness}
                  />
                  <MetricReason
                    title="Groundedness"
                    metric={evaluation.answerGroundedness}
                  />
                </div>
              </DetailBlock>

              <DetailBlock title="Evaluator summary">
                <p className="text-sm leading-7 text-[var(--app-muted)]">
                  {evaluation.summary}
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <ListBlock title="Strengths" items={evaluation.strengths} />
                  <ListBlock title="Weaknesses" items={evaluation.weaknesses} />
                </div>
              </DetailBlock>

              <DetailBlock title="Human review decision">
                <label>
                  <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                    Decision
                  </span>

                  <select
                    value={reviewDecision}
                    onChange={(event) => setReviewDecision(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-3 text-sm text-[var(--app-text)] outline-none"
                  >
                    <option value="accepted">Accepted</option>
                    <option value="answer_needs_fix">Answer needs fix</option>
                    <option value="retrieval_needs_fix">
                      Retrieval needs fix
                    </option>
                    <option value="source_needs_fix">Source needs fix</option>
                    <option value="exclude_from_release">
                      Exclude from release
                    </option>
                  </select>
                </label>

                <label className="mt-4 block">
                  <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                    Review note
                  </span>

                  <textarea
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    rows={6}
                    placeholder="Add a short note explaining what the team should do next."
                    className="w-full resize-none rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-3 text-sm leading-6 text-[var(--app-text)] outline-none"
                  />
                </label>

                {evaluation.reviewStatus === "reviewed" && (
                  <p className="mt-3 text-xs leading-5 text-[var(--app-muted)]">
                    Reviewed{" "}
                    {evaluation.reviewedAt
                      ? new Date(evaluation.reviewedAt).toLocaleString()
                      : ""}{" "}
                    {evaluation.reviewedBy?.name
                      ? `by ${evaluation.reviewedBy.name}`
                      : ""}
                  </p>
                )}

                <button
                  onClick={onSaveReview}
                  disabled={reviewStatus === "loading"}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 dark:text-[#052033]"
                >
                  {reviewStatus === "loading" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {reviewStatus === "loading"
                    ? "Saving review..."
                    : "Mark reviewed"}
                </button>
              </DetailBlock>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailBlock({ title, children }) {
  return (
    <section className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
      <h3 className="mb-4 text-lg font-bold text-[var(--app-text)]">{title}</h3>
      {children}
    </section>
  );
}

function MetricReason({ title, metric }) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[var(--app-text)]">{title}</p>
        <span className="rounded-full bg-[var(--brand-sky-soft)] px-3 py-1 text-xs font-bold text-[var(--brand-blue)]">
          {metric?.score || "—"}/5
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
        {metric?.reason || "No reason provided."}
      </p>

      {metric?.improvement && (
        <p className="mt-3 text-xs leading-5 text-[var(--app-muted)]">
          Improvement: {metric.improvement}
        </p>
      )}
    </div>
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
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
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

function suggestedReviewDecision(action = "") {
  if (action === "accept") return "accepted";
  if (action === "improve_retrieval") return "retrieval_needs_fix";
  if (action === "improve_sources") return "source_needs_fix";
  if (action === "needs_human_review") return "answer_needs_fix";

  return "answer_needs_fix";
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

function formatDecision(decision = "") {
  if (decision === "accepted") return "Accepted";
  if (decision === "answer_needs_fix") return "Answer needs fix";
  if (decision === "retrieval_needs_fix") return "Retrieval needs fix";
  if (decision === "source_needs_fix") return "Source needs fix";
  if (decision === "exclude_from_release") return "Exclude from release";

  return "Not decided";
}