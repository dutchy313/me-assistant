import { useEffect, useState } from "react";
import { getFeedbackSummary, getRecentFeedback } from "../../api/feedbackApi";

export default function AdminFeedbackSummary() {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFeedback() {
      try {
        setStatus("loading");

        const [summaryResponse, recentResponse] = await Promise.all([
          getFeedbackSummary(),
          getRecentFeedback()
        ]);

        setSummary(summaryResponse.data.summary);
        setRecent(recentResponse.data.feedback);
        setStatus("succeeded");
      } catch (error) {
        setError(error.response?.data?.message || "Could not load feedback");
        setStatus("failed");
      }
    }

    loadFeedback();
  }, []);

  if (status === "loading") {
    return (
      <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8">
        <p className="text-[var(--app-muted)]">Loading feedback summary...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          Admin feedback analytics
        </div>

        <h1 className="text-3xl font-bold text-[var(--app-text)]">
          Learning & Feedback Dashboard
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
          This page turns user feedback into learning signals for improving the
          product, retrieval quality, and future M&E features.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Answer helpfulness"
          value={`${summary.answerFeedback.helpfulnessRate}%`}
          note={`${summary.answerFeedback.helpfulAnswers} helpful / ${summary.totals.totalAnswerFeedback} total`}
        />
        <MetricCard
          label="Source usefulness"
          value={`${summary.sourceFeedback.usefulnessRate}%`}
          note={`${summary.sourceFeedback.usefulSources} useful / ${summary.totals.totalSourceFeedback} total`}
        />
        <MetricCard
          label="Session success"
          value={`${summary.sessionFeedback.successRate}%`}
          note={`${summary.sessionFeedback.yes} yes / ${summary.totals.totalSessionFeedback} total`}
        />
        <MetricCard
          label="Product rating"
          value={`${summary.productFeedback.averageRating}/5`}
          note={`${summary.totals.totalProductFeedback} product responses`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Common answer issues">
          {summary.commonAnswerIssues.length === 0 ? (
            <p className="text-sm text-[var(--app-muted)]">No issues yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.commonAnswerIssues.map((item) => (
                <Row key={item._id} label={item._id} value={item.count} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Common user goals">
          {summary.commonUserGoals.length === 0 ? (
            <p className="text-sm text-[var(--app-muted)]">No goals yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.commonUserGoals.map((item) => (
                <Row key={item._id} label={item._id} value={item.count} />
              ))}
            </div>
          )}
        </Panel>
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <h2 className="text-xl font-bold text-[var(--app-text)]">
          Recent product feedback
        </h2>

        <div className="mt-5 space-y-4">
          {recent?.productFeedback?.length === 0 ? (
            <p className="text-sm text-[var(--app-muted)]">
              No product feedback yet.
            </p>
          ) : (
            recent.productFeedback.map((item) => (
              <div
                key={item._id}
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4"
              >
                <p className="text-sm font-semibold text-[var(--app-text)]">
                  Rating: {item.rating}/5
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                  {item.comment || "No comment"}
                </p>
                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  By {item.userId?.name || "Unknown user"}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, note }) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
      <p className="text-sm font-medium text-[var(--app-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--app-text)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--app-muted)]">{note}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
      <h2 className="mb-5 text-xl font-bold text-[var(--app-text)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
      <span className="text-sm text-[var(--app-text)]">{label}</span>
      <span className="text-sm font-bold text-[var(--brand-blue)]">
        {value}
      </span>
    </div>
  );
}