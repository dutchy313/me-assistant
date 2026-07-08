import { useState } from "react";
import { submitAnswerFeedback } from "../../api/feedbackApi";

const reasons = [
  { value: "not_accurate", label: "Not accurate" },
  { value: "sources_not_relevant", label: "Sources were not relevant" },
  { value: "too_shallow", label: "Too shallow" },
  { value: "too_long", label: "Too long" },
  { value: "needed_example", label: "Needed a practical example" },
  { value: "did_not_answer_question", label: "Did not answer my question" },
  { value: "unclear_citation", label: "Citation was unclear" },
  { value: "other", label: "Other" }
];

export default function AnswerFeedback({
  questionText = "",
  answerText = "",
  messageId = null,
  sessionId = null
}) {
  const [rating, setRating] = useState("");
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("idle");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function toggleReason(reason) {
    setSelectedReasons((current) =>
      current.includes(reason)
        ? current.filter((item) => item !== reason)
        : [...current, reason]
    );
  }

  async function submitFeedback(nextRating) {
    setError("");
    setRating(nextRating);

    if (nextRating === "helpful") {
      try {
        setStatus("loading");

        await submitAnswerFeedback({
          sessionId,
          messageId,
          rating: "helpful",
          reasons: [],
          comment: "",
          questionText,
          answerText
        });

        setSubmitted(true);
        setStatus("succeeded");
      } catch (error) {
        setError(error.response?.data?.message || "Could not submit feedback");
        setStatus("failed");
      }
    }
  }

  async function submitNotHelpfulDetails(event) {
    event.preventDefault();

    try {
      setStatus("loading");
      setError("");

      await submitAnswerFeedback({
        sessionId,
        messageId,
        rating: "not_helpful",
        reasons: selectedReasons,
        comment,
        questionText,
        answerText
      });

      setSubmitted(true);
      setStatus("succeeded");
    } catch (error) {
      setError(error.response?.data?.message || "Could not submit feedback");
      setStatus("failed");
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--brand-sky-soft)] px-4 py-3 text-sm font-medium text-[var(--brand-blue)]">
        Thank you — your feedback helps improve M&E Assistant.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <p className="text-sm font-semibold text-[var(--app-text)]">
        Was this answer helpful?
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submitFeedback("helpful")}
          disabled={status === "loading"}
          className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
        >
          Helpful
        </button>

        <button
          type="button"
          onClick={() => setRating("not_helpful")}
          disabled={status === "loading"}
          className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
        >
          Not helpful
        </button>
      </div>

      {rating === "not_helpful" && (
        <form onSubmit={submitNotHelpfulDetails} className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--app-text)]">
              What could be improved?
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              {reasons.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm text-[var(--app-muted)]"
                >
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(reason.value)}
                    onChange={() => toggleReason(reason.value)}
                  />
                  {reason.label}
                </label>
              ))}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            placeholder="Tell us more..."
            className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none focus:border-[var(--brand-sky)] focus:ring-4 focus:ring-[var(--brand-sky)]/20"
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white dark:text-[#052033]"
          >
            {status === "loading" ? "Submitting..." : "Submit feedback"}
          </button>
        </form>
      )}
    </div>
  );
}