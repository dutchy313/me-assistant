import { BookOpenCheck, Database, ShieldCheck, Users } from "lucide-react";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          Admin foundation
        </div>

        <h1 className="text-3xl font-bold text-[var(--app-text)]">
          Admin Home
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
          This area will manage document ingestion, source status, feedback
          analytics, usage limits, and system settings.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminCard
          icon={<BookOpenCheck />}
          title="Documents"
          description="Google Drive folder ingestion will live here."
        />
        <AdminCard
          icon={<Database />}
          title="RAG system"
          description="Vector database and chunk status will be monitored here."
        />
        <AdminCard
          icon={<Users />}
          title="Users"
          description="User and role management will be added later."
        />
        <AdminCard
          icon={<ShieldCheck />}
          title="Security"
          description="Auth, rate limits, and access controls are active."
        />
      </section>
    </div>
  );
}

function AdminCard({ icon, title, description }) {
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