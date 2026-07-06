import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  MessageSquareText
} from "lucide-react";
import { checkApiHealth } from "../api/healthApi";
import AppFooter from "../components/layout/AppFooter";

export default function Landing() {
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    async function loadHealth() {
      try {
        const data = await checkApiHealth();
        setApiStatus(data.status === "ok" ? "connected" : "error");
      } catch (error) {
        setApiStatus("error");
      }
    }

    loadHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--app-bg)] via-white to-[var(--brand-sky-soft)] text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white shadow-sm shadow-[var(--brand-blue)]/20">
            <BrainCircuit size={24} />
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight">M&E Assistant</p>
            <p className="text-xs text-slate-500">
              Source-backed M&E knowledge
            </p>
          </div>
        </div>

        <div className="rounded-full border border-[var(--brand-sky-border)] bg-white px-4 py-2 text-sm text-slate-600 shadow-sm shadow-[var(--brand-blue)]/10">
          API:{" "}
          <span
            className={
              apiStatus === "connected"
                ? "font-semibold text-[var(--brand-blue)]"
                : apiStatus === "checking"
                ? "font-semibold text-amber-600"
                : "font-semibold text-red-600"
            }
          >
            {apiStatus}
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <section>
          <div className="mb-5 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-medium text-[var(--brand-blue)] shadow-sm">
            Built for Monitoring & Evaluation practitioners
          </div>

          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
            Ask better M&E questions. Get{" "}
            <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-sky)] bg-clip-text text-transparent">
              source-backed
            </span>{" "}
            answers.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            M&E Assistant helps users explore Monitoring and Evaluation
            concepts, frameworks, indicators, learning questions, and evaluation
            methods using a curated private library.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="rounded-2xl bg-[var(--brand-blue)] px-6 py-3 font-semibold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:bg-[var(--brand-blue-hover)]"
            >
              Start asking
            </Link>

            <Link
              to="/login"
              className="rounded-2xl border border-[var(--brand-sky-border)] bg-white px-6 py-3 font-semibold text-[var(--brand-blue)] shadow-sm transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue-dark)]"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--brand-sky-border)] bg-white/80 p-5 shadow-2xl shadow-[var(--brand-blue)]/10 backdrop-blur">
          <div className="rounded-[1.5rem] bg-[#071827] p-5 text-white">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="font-semibold">M&E Assistant</p>
                <p className="text-sm text-slate-400">
                  Preview chat workspace
                </p>
              </div>

              <div className="rounded-full bg-[var(--brand-sky)]/15 px-3 py-1 text-xs text-[#9BEAFF]">
                v1 foundation
              </div>
            </div>

            <div className="space-y-4">
              <div className="max-w-[85%] rounded-2xl bg-white/10 p-4 text-sm text-slate-100">
                What is the difference between outputs and outcomes?
              </div>

              <div className="ml-auto max-w-[90%] rounded-2xl bg-[#DDF7FF] p-4 text-sm text-slate-900">
                Outputs are immediate deliverables. Outcomes are the changes
                that result from those deliverables. In v1, this answer will
                include citations from your M&E library.
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-100">
                  Feedback built into the design
                </p>

                <div className="flex gap-2 text-sm">
                  <button className="rounded-full bg-white/10 px-3 py-1 text-slate-200 transition hover:bg-[var(--brand-sky)]/20 hover:text-white">
                    Helpful
                  </button>

                  <button className="rounded-full bg-white/10 px-3 py-1 text-slate-200 transition hover:bg-[var(--brand-sky)]/20 hover:text-white">
                    Not helpful
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-16 md:grid-cols-4">
        <FeatureCard
          icon={<BookOpenCheck />}
          title="82-book library"
          description="Built to ingest your Google Drive folder of M&E books."
        />

        <FeatureCard
          icon={<MessageSquareText />}
          title="RAG answers"
          description="Answers will be grounded in retrieved source excerpts."
        />

        <FeatureCard
          icon={<BarChart3 />}
          title="Feedback-first"
          description="Every answer becomes a learning opportunity."
        />

        <FeatureCard
          icon={<BrainCircuit />}
          title="AI-ready"
          description="Prepared for OpenAI embeddings and answer generation."
        />
      </section>

      <AppFooter />
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-3xl border border-[var(--brand-border-soft)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--brand-blue)]/10">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        {icon}
      </div>

      <h3 className="mb-2 font-bold text-slate-900">{title}</h3>

      <p className="text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}