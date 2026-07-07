import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  MessageSquareText,
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-6 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-medium text-[var(--brand-blue)]">
          Phase 4 workspace foundation
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-[var(--app-text)]">
          Welcome to your M&E Assistant workspace.
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--app-muted)]">
          This is where we will connect source-backed answers, citations,
          feedback loops, document ingestion, and admin learning dashboards.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/dashboard/chat"
            className="rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:bg-[var(--brand-blue-hover)] dark:text-[#052033]"
          >
            Open chat workspace
          </Link>

          <Link
            to="/dashboard/feedback"
            className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
          >
            View feedback center
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<MessageSquareText />}
          label="Chat readiness"
          value="Ready"
          note="UI shell prepared"
        />
        <MetricCard
          icon={<BookOpenCheck />}
          label="Knowledge library"
          value="82 books"
          note="Drive ingestion comes later"
        />
        <MetricCard
          icon={<BarChart3 />}
          label="Feedback design"
          value="Core"
          note="Built into the product"
        />
        <MetricCard
          icon={<BrainCircuit />}
          label="RAG status"
          value="Next"
          note="After feedback foundation"
        />
      </section>

      {isAdmin && (
        <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
              <ShieldCheck />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--app-text)]">
                Admin tools enabled
              </h2>
              <p className="mt-2 max-w-3xl leading-7 text-[var(--app-muted)]">
                Your account has admin access. In later phases, this area will
                manage documents, ingestion, usage, and learning feedback.
              </p>

              <Link
                to="/dashboard/admin"
                className="mt-4 inline-flex rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white dark:text-[#052033]"
              >
                Open admin area
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, note }) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        {icon}
      </div>
      <p className="text-sm font-medium text-[var(--app-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--app-text)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--app-muted)]">{note}</p>
    </div>
  );
}