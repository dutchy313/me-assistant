import {
  Activity,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  ClipboardCheck,
  Search,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10 lg:p-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-bold text-[var(--brand-blue)]">
          <ShieldCheck size={16} />
          System admin
        </div>

        <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-[var(--app-text)] lg:text-5xl">
          Manage the M&amp;E Assistant workspace.
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--app-muted)]">
          Control user access, maintain the knowledge library, monitor usage,
          and review answer quality from one secure admin area.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/dashboard/admin/users"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:-translate-y-0.5 dark:text-[#052033]"
          >
            <Users size={18} />
            Manage users
          </Link>

          <Link
            to="/dashboard/admin/usage"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-6 py-4 text-sm font-bold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
          >
            <Activity size={18} />
            View usage
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AdminCard
          icon={<Users />}
          title="Users and roles"
          text="Manage beta users, reviewers, admins, and account status."
          to="/dashboard/admin/users"
          label="Open users"
        />

        <AdminCard
          icon={<BookOpenCheck />}
          title="Knowledge library"
          text="Sync documents, process PDFs, run OCR, and review source metadata."
          to="/dashboard/admin/documents"
          label="Open documents"
        />

        <AdminCard
          icon={<BrainCircuit />}
          title="Vector index"
          text="Embed pending chunks and monitor the searchable knowledge index."
          to="/dashboard/admin/vectors"
          label="Open vectors"
        />

        <AdminCard
          icon={<Search />}
          title="Retrieval Lab"
          text="Test search queries, inspect source chunks, and check retrieval quality."
          to="/dashboard/admin/retrieval"
          label="Open Retrieval Lab"
        />

        <AdminCard
          icon={<ClipboardCheck />}
          title="Answer evaluations"
          text="Score RAG answers, inspect context, and record human review decisions."
          to="/dashboard/admin/evaluations"
          label="Open evaluations"
        />

        <AdminCard
          icon={<BarChart3 />}
          title="Feedback review"
          text="Review answer, source, session, and product feedback from users."
          to="/dashboard/admin/feedback"
          label="Open feedback"
        />

        <AdminCard
          icon={<Activity />}
          title="Usage monitoring"
          text="Track chat activity, evaluation activity, active users, and usage trends."
          to="/dashboard/admin/usage"
          label="Open usage"
        />

        <AdminCard
          icon={<Settings />}
          title="System settings"
          text="Review operational settings and deployment readiness checks."
          to="/dashboard/admin/settings"
          label="Open settings"
        />
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <h2 className="text-xl font-black text-[var(--app-text)]">
          Admin operating checklist
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ChecklistItem text="Confirm the readiness check is passing before inviting users." />
          <ChecklistItem text="Review user roles before each beta testing round." />
          <ChecklistItem text="Check retrieval quality after adding new documents." />
          <ChecklistItem text="Review weak evaluations and source feedback daily during beta." />
        </div>
      </section>
    </div>
  );
}

function AdminCard({ icon, title, text, to, label }) {
  return (
    <article className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--brand-blue)]/10">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        {icon}
      </div>

      <h2 className="text-xl font-black text-[var(--app-text)]">{title}</h2>

      <p className="mt-3 min-h-[4.5rem] leading-7 text-[var(--app-muted)]">
        {text}
      </p>

      <Link
        to={to}
        className="mt-5 inline-flex rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm font-bold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
      >
        {label}
      </Link>
    </article>
  );
}

function ChecklistItem({ text }) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--app-muted)]">
      {text}
    </div>
  );
}