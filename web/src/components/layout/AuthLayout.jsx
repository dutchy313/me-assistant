import { BrainCircuit } from "lucide-react";
import AppFooter from "./AppFooter";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--app-bg)] via-white to-[var(--brand-sky-soft)] text-slate-950">
      <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-7xl items-center justify-center px-6 py-12">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--brand-border-soft)] bg-white shadow-2xl shadow-[var(--brand-blue)]/10 lg:grid-cols-2">
          <div className="hidden bg-[#071827] p-10 text-white lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky)] text-[#052033]">
                <BrainCircuit />
              </div>
              <div>
                <p className="text-xl font-bold">M&E Assistant</p>
                <p className="text-sm text-slate-400">
                  Source-backed M&E knowledge
                </p>
              </div>
            </div>

            <div className="mt-20">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#9BEAFF]">
                Feedback-first by design
              </p>
              <h1 className="text-4xl font-bold leading-tight">
                A secure learning system for Monitoring & Evaluation knowledge.
              </h1>
              <p className="mt-6 leading-7 text-slate-300">
                Sign in to ask questions, review source-backed answers, and help
                improve the system through structured feedback.
              </p>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white">
                <BrainCircuit />
              </div>
              <p className="text-xl font-bold">M&E Assistant</p>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>

            <div className="mt-8">{children}</div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}