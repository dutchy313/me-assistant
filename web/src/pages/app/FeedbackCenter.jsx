import { useState } from "react";
import {
  BarChart3,
  MessageCircle,
  MousePointerClick,
  Star
} from "lucide-react";
import { submitProductFeedback, submitSessionFeedback } from "../../api/feedbackApi";

const usageOptions = [
  { value: "indicator_design", label: "Indicator design" },
  { value: "theory_of_change", label: "Theory of Change" },
  { value: "logframe", label: "Logframe" },
  { value: "evaluation_methods", label: "Evaluation methods" },
  { value: "data_collection", label: "Data collection" },
  { value: "reporting", label: "Reporting" },
  { value: "learning_research", label: "Learning/research" },
  { value: "other", label: "Other" }
];

const sessionGoals = [
  { value: "understand_concept", label: "Understand an M&E concept" },
  { value: "design_indicators", label: "Design indicators" },
  { value: "build_logframe", label: "Build a logframe" },
  { value: "prepare_report", label: "Prepare a report" },
  { value: "plan_evaluation", label: "Plan an evaluation" },
  { value: "develop_theory_of_change", label: "Develop a Theory of Change" },
  { value: "review_proposal", label: "Review a proposal" },
  { value: "learning_research", label: "Learning/research" },
  { value: "other", label: "Other" }
];

export default function FeedbackCenter() {
  const [productForm, setProductForm] = useState({
    rating: 5,
    usagePurpose: [],
    comment: "",
    requestedFeature: "",
    allowContact: false
  });

  const [sessionForm, setSessionForm] = useState({
    helpedProgress: "yes",
    userGoal: "learning_research",
    comment: ""
  });

  const [productStatus, setProductStatus] = useState("idle");
  const [sessionStatus, setSessionStatus] = useState("idle");
  const [message, setMessage] = useState("");

  function toggleUsagePurpose(value) {
    setProductForm((current) => {
      const exists = current.usagePurpose.includes(value);

      return {
        ...current,
        usagePurpose: exists
          ? current.usagePurpose.filter((item) => item !== value)
          : [...current.usagePurpose, value]
      };
    });
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      setProductStatus("loading");

      await submitProductFeedback(productForm);

      setProductStatus("succeeded");
      setMessage("Product feedback submitted. Thank you.");

      setProductForm({
        rating: 5,
        usagePurpose: [],
        comment: "",
        requestedFeature: "",
        allowContact: false
      });
    } catch (error) {
      setProductStatus("failed");
      setMessage(error.response?.data?.message || "Could not submit feedback.");
    }
  }

  async function handleSessionSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      setSessionStatus("loading");

      await submitSessionFeedback(sessionForm);

      setSessionStatus("succeeded");
      setMessage("Session feedback submitted. Thank you.");

      setSessionForm({
        helpedProgress: "yes",
        userGoal: "learning_research",
        comment: ""
      });
    } catch (error) {
      setSessionStatus("failed");
      setMessage(error.response?.data?.message || "Could not submit feedback.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          Feedback is core to M&E Assistant
        </div>

        <h1 className="text-3xl font-bold text-[var(--app-text)]">
          Feedback Center
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
          Share how M&E Assistant is working for you. Your feedback helps us
          improve answer quality, source relevance, usability, and future
          features.
        </p>

        {message && (
          <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--brand-sky-soft)] px-4 py-3 text-sm font-medium text-[var(--brand-blue)]">
            {message}
          </div>
        )}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <FeedbackCard
          icon={<MousePointerClick />}
          title="Answer feedback"
          description="Was this answer helpful or not helpful?"
        />
        <FeedbackCard
          icon={<MessageCircle />}
          title="Source feedback"
          description="Were the retrieved sources useful?"
        />
        <FeedbackCard
          icon={<BarChart3 />}
          title="Session feedback"
          description="Did the conversation help you make progress?"
        />
        <FeedbackCard
          icon={<Star />}
          title="Product feedback"
          description="How useful is M&E Assistant overall?"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={handleProductSubmit}
          className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6"
        >
          <h2 className="text-xl font-bold text-[var(--app-text)]">
            Product feedback
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
            Tell us how useful the app is overall.
          </p>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
              Rating
            </label>

            <select
              value={productForm.rating}
              onChange={(event) =>
                setProductForm((current) => ({
                  ...current,
                  rating: Number(event.target.value)
                }))
              }
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-[var(--app-text)] outline-none"
            >
              <option value={5}>5 - Very useful</option>
              <option value={4}>4 - Useful</option>
              <option value={3}>3 - Okay</option>
              <option value={2}>2 - Not very useful</option>
              <option value={1}>1 - Not useful</option>
            </select>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-[var(--app-text)]">
              What are you using it for?
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              {usageOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm text-[var(--app-muted)]"
                >
                  <input
                    type="checkbox"
                    checked={productForm.usagePurpose.includes(option.value)}
                    onChange={() => toggleUsagePurpose(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
              Comment
            </label>
            <textarea
              value={productForm.comment}
              onChange={(event) =>
                setProductForm((current) => ({
                  ...current,
                  comment: event.target.value
                }))
              }
              rows={4}
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-[var(--app-text)] outline-none"
              placeholder="What is working well? What should improve?"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
              Requested feature
            </label>
            <input
              value={productForm.requestedFeature}
              onChange={(event) =>
                setProductForm((current) => ({
                  ...current,
                  requestedFeature: event.target.value
                }))
              }
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-[var(--app-text)] outline-none"
              placeholder="Example: downloadable logframe templates"
            />
          </div>

          <label className="mt-5 flex items-center gap-2 text-sm text-[var(--app-muted)]">
            <input
              type="checkbox"
              checked={productForm.allowContact}
              onChange={(event) =>
                setProductForm((current) => ({
                  ...current,
                  allowContact: event.target.checked
                }))
              }
            />
            You may contact me about this feedback.
          </label>

          <button
            type="submit"
            disabled={productStatus === "loading"}
            className="mt-6 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white dark:text-[#052033]"
          >
            {productStatus === "loading"
              ? "Submitting..."
              : "Submit product feedback"}
          </button>
        </form>

        <form
          onSubmit={handleSessionSubmit}
          className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6"
        >
          <h2 className="text-xl font-bold text-[var(--app-text)]">
            Session feedback
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
            Tell us whether this session helped you make progress.
          </p>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
              Did this session help you make progress?
            </label>

            <select
              value={sessionForm.helpedProgress}
              onChange={(event) =>
                setSessionForm((current) => ({
                  ...current,
                  helpedProgress: event.target.value
                }))
              }
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-[var(--app-text)] outline-none"
            >
              <option value="yes">Yes</option>
              <option value="partly">Partly</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
              What were you trying to do?
            </label>

            <select
              value={sessionForm.userGoal}
              onChange={(event) =>
                setSessionForm((current) => ({
                  ...current,
                  userGoal: event.target.value
                }))
              }
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-[var(--app-text)] outline-none"
            >
              {sessionGoals.map((goal) => (
                <option key={goal.value} value={goal.value}>
                  {goal.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
              Comment
            </label>
            <textarea
              value={sessionForm.comment}
              onChange={(event) =>
                setSessionForm((current) => ({
                  ...current,
                  comment: event.target.value
                }))
              }
              rows={6}
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-[var(--app-text)] outline-none"
              placeholder="What did you need? What was missing?"
            />
          </div>

          <button
            type="submit"
            disabled={sessionStatus === "loading"}
            className="mt-6 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white dark:text-[#052033]"
          >
            {sessionStatus === "loading"
              ? "Submitting..."
              : "Submit session feedback"}
          </button>
        </form>
      </section>
    </div>
  );
}

function FeedbackCard({ icon, title, description }) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        {icon}
      </div>

      <h2 className="font-bold text-[var(--app-text)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
        {description}
      </p>
    </div>
  );
}