import { useState } from "react";
import { submitSourceFeedback } from "../../api/feedbackApi";

export default function SourceFeedback({
  citation,
  messageId = null,
  sessionId = null
}) {
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [status, setStatus] = useState("idle");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleQuickSubmit(nextRating) {
    setRating(nextRating);
    setError("");

    if (nextRating === "useful") {
      await submitFeedback({
        nextRating,
        nextComment: ""
      });
    } else {
      setShowComment(true);
    }
  }

  async function handleDetailedSubmit(event) {
    event.preventDefault();

    await submitFeedback({
      nextRating: rating || "not_useful",
      nextComment: comment
    });
  }

  async function submitFeedback({ nextRating, nextComment }) {
    try {
      setStatus("loading");

      await submitSourceFeedback({
        sessionId,
        messageId,
        documentId: citation.documentId || null,
        chunkId: citation.chunkId || null,
        rating: nextRating,
        comment: nextComment,
        sourceTitle: citation.documentTitle || "",
        excerpt: citation.excerpt || "",
        retrievalScore: Number(citation.score || 0)
      });

      setSubmitted(true);
      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      setError(
        error.response?.data?.message || "Could not submit source feedback"
      );
    }
  }

  if (submitted) {
    return (
      <div className="mt-3 rounded-xl border border-[var(--app-border)] bg-[var(--brand-sky-soft)] px-3 py-2 text-xs font-semibold text-[var(--brand-blue)]">
        Source feedback saved.
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-[var(--app-border)] pt-3">
      <p className="text-xs font-semibold text-[var(--app-muted)]">
        Was this source useful?
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleQuickSubmit("useful")}
          disabled={status === "loading"}
          className="rounded-full border border-[var(--app-border)] px-3 py-1 text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-60"
        >
          Useful
        </button>

        <button
          type="button"
          onClick={() => handleQuickSubmit("not_useful")}
          disabled={status === "loading"}
          className="rounded-full border border-[var(--app-border)] px-3 py-1 text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-60"
        >
          Not useful
        </button>
      </div>

      {showComment && (
        <form onSubmit={handleDetailedSubmit} className="mt-3 space-y-2">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={2}
            placeholder="What was wrong with this source?"
            className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs text-[var(--app-text)] outline-none focus:border-[var(--brand-sky)]"
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-xl bg-[var(--brand-blue)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 dark:text-[#052033]"
          >
            {status === "loading" ? "Saving..." : "Save source feedback"}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}