import { useDispatch, useSelector } from "react-redux";
import { BrainCircuit, LogOut, MessageSquareText, ShieldCheck } from "lucide-react";
import { logout } from "../../store/authSlice";
import AppFooter from "../../components/layout/AppFooter";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  function handleLogout() {
    dispatch(logout());
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--app-bg)] via-white to-[var(--brand-sky-soft)]">
      <header className="border-b border-[var(--brand-border-soft)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white shadow-sm shadow-[var(--brand-blue)]/20">
              <BrainCircuit size={24} />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">M&E Assistant</p>
              <p className="text-xs text-slate-500">Secure dashboard</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--brand-border-soft)] bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-[2rem] border border-[var(--brand-border-soft)] bg-white p-8 shadow-xl shadow-[var(--brand-blue)]/10">
          <div className="mb-6 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-medium text-[var(--brand-blue)]">
            Authentication foundation complete
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            Welcome, {user?.name || "M&E user"}.
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            You are now signed in. Next, we will turn this dashboard into the
            full M&E Assistant workspace with chat, source citations, feedback,
            and admin tools.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <InfoCard
              icon={<ShieldCheck />}
              title="JWT Auth"
              description="Protected routes are working with your backend token."
            />
            <InfoCard
              icon={<MessageSquareText />}
              title="Chat workspace next"
              description="The next build step is the app shell and feedback-first chat UI."
            />
            <InfoCard
              icon={<BrainCircuit />}
              title="RAG-ready"
              description="This authentication layer will protect future AI and document features."
            />
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}

function InfoCard({ icon, title, description }) {
  return (
    <div className="rounded-3xl border border-[var(--brand-border-soft)] bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        {icon}
      </div>
      <h3 className="mb-2 font-bold text-slate-900">{title}</h3>
      <p className="text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}