import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  ClipboardCheck,
  MessageSquareText,
  Search,
  ShieldCheck,
  UserCircle2,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { USER_ROLES } from "../../constants/roles";

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);

  const role = user?.role || USER_ROLES.USER;

  if (role === USER_ROLES.ADMIN) {
    return <AdminDashboard user={user} />;
  }

  if (role === USER_ROLES.REVIEWER) {
    return <ReviewerDashboard user={user} />;
  }

  return <UserDashboard user={user} />;
}

function UserDashboard({ user }) {
  return (
    <div className="space-y-8">
      <HeroSection
        eyebrow="Your workspace"
        title={`Welcome${user?.name ? `, ${getFirstName(user.name)}` : ""}.`}
        description="Ask Monitoring and Evaluation questions, review cited sources, and share feedback that helps improve the assistant."
        primaryLink="/dashboard/chat"
        primaryLabel="Ask a question"
        secondaryLink="/dashboard/feedback"
        secondaryLabel="Share feedback"
      />

      <div className="grid gap-5 md:grid-cols-3">
        <ActionCard
          icon={<MessageSquareText />}
          title="Ask source-backed questions"
          text="Use the chat workspace to ask practical M&E questions and review the cited sources behind each answer."
          to="/dashboard/chat"
          label="Open chat"
        />

        <ActionCard
          icon={<BarChart3 />}
          title="Improve the assistant"
          text="Send answer, source, product, or session feedback when something is useful, unclear, or needs review."
          to="/dashboard/feedback"
          label="Open feedback"
        />

        <ActionCard
          icon={<UserCircle2 />}
          title="Manage your account"
          text="Review your profile details and change your password securely when needed."
          to="/dashboard/account"
          label="Account settings"
        />
      </div>

      <GuidancePanel
        title="Good questions to try"
        items={[
          "What is result-based M&E?",
          "What is the difference between outputs and outcomes?",
          "What makes a good evaluation question?",
          "When should I use experimental design in evaluation?"
        ]}
      />
    </div>
  );
}

function ReviewerDashboard({ user }) {
  return (
    <div className="space-y-8">
      <HeroSection
        eyebrow="Quality review"
        title={`Welcome${user?.name ? `, ${getFirstName(user.name)}` : ""}.`}
        description="Inspect retrieved sources, evaluate answer quality, and help decide which responses are ready for trusted use."
        primaryLink="/dashboard/admin/evaluations"
        primaryLabel="Review evaluations"
        secondaryLink="/dashboard/admin/retrieval"
        secondaryLabel="Test retrieval"
      />

      <div className="grid gap-5 md:grid-cols-3">
        <ActionCard
          icon={<ClipboardCheck />}
          title="Evaluate answers"
          text="Score answer quality, inspect evidence, and mark review decisions before wider release."
          to="/dashboard/admin/evaluations"
          label="Open evaluations"
        />

        <ActionCard
          icon={<Search />}
          title="Inspect retrieval"
          text="Use Retrieval Lab to check whether the assistant is finding relevant source chunks."
          to="/dashboard/admin/retrieval"
          label="Open Retrieval Lab"
        />

        <ActionCard
          icon={<BarChart3 />}
          title="Review feedback"
          text="Look for patterns in answer and source feedback from beta users."
          to="/dashboard/admin/feedback"
          label="Open feedback review"
        />
      </div>

      <GuidancePanel
        title="Reviewer focus"
        items={[
          "Are retrieved sources relevant to the question?",
          "Is the answer grounded in the cited sources?",
          "Is the answer clear enough for a normal M&E user?",
          "Should this response be accepted, fixed, or excluded?"
        ]}
      />
    </div>
  );
}

function AdminDashboard({ user }) {
  return (
    <div className="space-y-8">
      <HeroSection
        eyebrow="System admin"
        title={`Welcome${user?.name ? `, ${getFirstName(user.name)}` : ""}.`}
        description="Manage users, source documents, usage, retrieval quality, and answer evaluations from one secure workspace."
        primaryLink="/dashboard/admin/users"
        primaryLabel="Manage users"
        secondaryLink="/dashboard/admin/usage"
        secondaryLabel="View usage"
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <ActionCard
          icon={<Users />}
          title="Users and roles"
          text="Manage beta users, reviewers, admins, and account status."
          to="/dashboard/admin/users"
          label="Open users"
        />

        <ActionCard
          icon={<BookOpenCheck />}
          title="Knowledge library"
          text="Sync documents, process PDFs, run OCR, and review source metadata."
          to="/dashboard/admin/documents"
          label="Open documents"
        />

        <ActionCard
          icon={<BrainCircuit />}
          title="Vector index"
          text="Embed pending chunks and monitor vector indexing progress."
          to="/dashboard/admin/vectors"
          label="Open vectors"
        />

        <ActionCard
          icon={<ClipboardCheck />}
          title="Quality evaluation"
          text="Evaluate RAG answers and review citation-backed quality decisions."
          to="/dashboard/admin/evaluations"
          label="Open evaluations"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ActionCard
          icon={<BarChart3 />}
          title="Usage monitoring"
          text="Track chat activity, evaluation activity, active users, and usage trends during beta."
          to="/dashboard/admin/usage"
          label="Open usage"
        />

        <ActionCard
          icon={<Search />}
          title="Retrieval quality"
          text="Test search queries, inspect selected chunks, and identify source quality issues."
          to="/dashboard/admin/retrieval"
          label="Open Retrieval Lab"
        />
      </div>

      <GuidancePanel
        title="Admin checklist before inviting beta users"
        items={[
          "Confirm the readiness check is passing before inviting users.",
          "Check that users and roles are correct.",
          "Test chat answers and citations.",
          "Review weak evaluations and source feedback daily."
        ]}
      />
    </div>
  );
}

function HeroSection({
  eyebrow,
  title,
  description,
  primaryLink,
  primaryLabel,
  secondaryLink,
  secondaryLabel
}) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10 lg:p-10">
      <div className="pointer-events-none absolute right-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-[var(--brand-sky)]/20 blur-3xl" />

      <div className="relative z-10 max-w-5xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-bold text-[var(--brand-blue)]">
          <ShieldCheck size={16} />
          {eyebrow}
        </div>

        <h1 className="text-4xl font-black leading-tight tracking-tight text-[var(--app-text)] lg:text-5xl">
          {title}
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--app-muted)]">
          {description}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to={primaryLink}
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--brand-blue)] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:-translate-y-0.5 dark:text-[#052033]"
          >
            {primaryLabel}
          </Link>

          <Link
            to={secondaryLink}
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-6 py-4 text-sm font-bold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function ActionCard({ icon, title, text, to, label }) {
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

function GuidancePanel({ title, items }) {
  return (
    <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
      <h2 className="text-xl font-black text-[var(--app-text)]">{title}</h2>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--app-muted)]"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function getFirstName(name = "") {
  return name.trim().split(" ")[0] || name;
}