import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSearch,
  MessageSquareText,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import AppFooter from "../components/layout/AppFooter";

export default function Landing() {
  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--app-border)] bg-[var(--app-bg)]/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white shadow-lg shadow-[var(--brand-blue)]/20 dark:text-[#052033]">
              <Sparkles size={20} />
            </div>

            <div>
              <p className="text-base font-black tracking-tight text-[var(--app-text)]">
                M&amp;E Assistant
              </p>
              <p className="text-xs font-semibold text-[var(--app-muted)]">
                by Cloneshouse
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-semibold text-[var(--app-muted)] md:flex">
            <a href="#how-it-works" className="hover:text-[var(--brand-blue)]">
              How it works
            </a>
            <a href="#quality" className="hover:text-[var(--brand-blue)]">
              Quality controls
            </a>
            <a href="#admin" className="hover:text-[var(--brand-blue)]">
              Admin workflow
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-3 text-sm font-bold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] sm:inline-flex"
            >
              Sign in
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:-translate-y-0.5 hover:shadow-xl dark:text-[#052033]"
            >
              Start asking
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-[-12rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-[var(--brand-sky)]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-16rem] right-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[var(--brand-blue)]/15 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-bold text-[var(--brand-blue)]">
              <ShieldCheck size={16} />
              Source-backed answers for Monitoring &amp; Evaluation
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-tight text-[var(--app-text)] md:text-6xl">
              Ask M&amp;E questions and trace every answer back to your
              evidence library.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--app-muted)]">
              M&amp;E Assistant helps teams search books, manuals, reports, and
              evaluation guidance through a citation-first chat experience. It
              is built for learning, programme design, evaluation planning, and
              evidence-informed decision-making.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:-translate-y-0.5 hover:shadow-xl dark:text-[#052033]"
              >
                Start asking
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-4 text-base font-bold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <TrustPill
                icon={<BookOpenCheck size={17} />}
                text="Private knowledge base"
              />
              <TrustPill
                icon={<FileSearch size={17} />}
                text="Cited source chunks"
              />
              <TrustPill
                icon={<ClipboardCheck size={17} />}
                text="Admin quality review"
              />
            </div>
          </div>

          <div className="relative z-10">
            <div className="rounded-[2.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-2xl shadow-[var(--brand-blue)]/10">
              <div className="rounded-[1.75rem] border border-[var(--brand-sky-border)] bg-[var(--app-surface-muted)] p-5">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--app-border)] pb-4">
                  <div>
                    <p className="text-sm font-bold text-[var(--brand-blue)]">
                      M&amp;E Assistant
                    </p>
                    <p className="mt-1 text-xs text-[var(--app-muted)]">
                      Source-backed response preview
                    </p>
                  </div>

                  <div className="rounded-full bg-[var(--brand-sky-soft)] px-3 py-1 text-xs font-bold text-[var(--brand-blue)]">
                    Citations on
                  </div>
                </div>

                <div className="mt-5 rounded-3xl bg-[var(--app-surface)] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--app-muted)]">
                    Question
                  </p>
                  <p className="mt-2 text-lg font-bold text-[var(--app-text)]">
                    What makes a theory of change useful for evaluation?
                  </p>
                </div>

                <div className="mt-4 rounded-3xl bg-[var(--brand-blue)] p-5 text-white dark:text-[#052033]">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">
                    Answer
                  </p>
                  <p className="mt-3 leading-7">
                    A theory of change is useful when it explains how activities
                    are expected to lead to outputs, outcomes, and longer-term
                    change. It should make assumptions visible and support
                    evaluation questions, indicators, and evidence needs.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                      Source 1
                    </span>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                      Source 2
                    </span>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                      Source 3
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <PreviewCard
                    icon={<Database size={18} />}
                    title="Retrieval"
                    text="Finds relevant chunks from embedded M&E sources."
                  />
                  <PreviewCard
                    icon={<CheckCircle2 size={18} />}
                    title="Evaluation"
                    text="Scores answer quality before beta release."
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
              <p className="text-sm font-bold text-[var(--app-text)]">
                Built for evidence teams
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                Designed by the Evidence and Intelligence team at Cloneshouse
                to help users move from scattered documents to clearer
                evaluation thinking.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-[var(--app-border)] bg-[var(--app-surface)]"
      >
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--brand-blue)]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--app-text)]">
              A simple pipeline from documents to reviewed answers.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={<BookOpenCheck />}
              title="Upload knowledge"
              text="Admins sync books and PDFs from Google Drive, process text, OCR scanned files, and embed chunks into Qdrant."
            />
            <FeatureCard
              icon={<MessageSquareText />}
              title="Ask questions"
              text="Users ask natural M&E questions and receive answers grounded in retrieved source chunks."
            />
            <FeatureCard
              icon={<ClipboardCheck />}
              title="Review quality"
              text="Admins evaluate answers, inspect context, and mark responses reviewed before broader use."
            />
          </div>
        </div>
      </section>

      <section id="quality" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--brand-blue)]">
              Quality controls
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--app-text)]">
              Trust is designed into the workflow.
            </h2>
            <p className="mt-4 leading-7 text-[var(--app-muted)]">
              The assistant is not just a chat box. It includes retrieval
              diagnostics, source feedback, answer feedback, automated
              evaluation, and human review.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <QualityItem
              title="Citations"
              text="Every useful answer is tied to source chunks."
            />
            <QualityItem
              title="Retrieval Lab"
              text="Reviewers can inspect chunk relevance and source quality."
            />
            <QualityItem
              title="RAG evaluation"
              text="Answers are scored across relevance, sufficiency, correctness, and groundedness."
            />
            <QualityItem
              title="Human review"
              text="The team can review answers, note risks, and improve the evidence library."
            />
          </div>
        </div>
      </section>

      <section id="admin" className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        <div className="rounded-[2.25rem] border border-[var(--app-border)] bg-[var(--brand-blue)] p-8 text-white shadow-2xl shadow-[var(--brand-blue)]/20 dark:text-[#052033] lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] opacity-80">
                Source-backed evaluation support
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Turn your M&amp;E knowledge library into practical, cited
                answers.
              </h2>
              <p className="mt-4 max-w-3xl leading-7 opacity-90">
                Ask questions, review the sources behind each response, and use
                feedback to strengthen the quality of evaluation learning over
                time.
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-black text-[var(--brand-blue)] transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Go to workspace
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <AppFooter />
    </main>
  );
}

function TrustPill({ icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-bold text-[var(--app-text)]">
      <span className="text-[var(--brand-blue)]">{icon}</span>
      {text}
    </div>
  );
}

function PreviewCard({ icon, title, text }) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        {icon}
      </div>
      <p className="font-bold text-[var(--app-text)]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">{text}</p>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <article className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        {icon}
      </div>
      <h3 className="text-xl font-black text-[var(--app-text)]">{title}</h3>
      <p className="mt-3 leading-7 text-[var(--app-muted)]">{text}</p>
    </article>
  );
}

function QualityItem({ title, text }) {
  return (
    <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        <CheckCircle2 size={18} />
      </div>
      <p className="text-lg font-black text-[var(--app-text)]">{title}</p>
      <p className="mt-2 leading-7 text-[var(--app-muted)]">{text}</p>
    </div>
  );
}