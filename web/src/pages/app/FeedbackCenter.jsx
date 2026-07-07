import { BarChart3, MessageCircle, MousePointerClick, Star } from "lucide-react";

export default function FeedbackCenter() {
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
          This page will collect answer feedback, source feedback, session
          feedback, and product feedback. It is the foundation of the product’s
          learning system.
        </p>
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
          description="Did the conversation help the user make progress?"
        />
        <FeedbackCard
          icon={<Star />}
          title="Product feedback"
          description="How useful is M&E Assistant overall?"
        />
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