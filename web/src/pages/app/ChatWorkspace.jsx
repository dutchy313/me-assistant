import { BookOpenCheck, MessageSquareText, Send } from "lucide-react";
import AnswerFeedback from "../../components/feedback/AnswerFeedback";

export default function ChatWorkspace() {
  const exampleQuestion =
    "How do I design outcome indicators for a youth employment project?";

  const exampleAnswer =
    "In the RAG phase, this answer will be generated from retrieved M&E book excerpts and will include citations.";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="border-b border-[var(--app-border)] p-6">
          <p className="text-sm font-semibold text-[var(--brand-blue)]">
            Ask M&E Assistant
          </p>

          <h1 className="mt-1 text-2xl font-bold text-[var(--app-text)]">
            Chat workspace
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
            RAG answers will appear here in a later phase. For now, this is the
            workspace shell with real answer feedback wired into the backend.
          </p>
        </div>

        <div className="min-h-[430px] space-y-5 p-6">
          <div className="max-w-[80%] rounded-3xl bg-[var(--app-surface-muted)] p-5 text-[var(--app-text)]">
            <p className="text-sm font-semibold">Example user question</p>

            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
              {exampleQuestion}
            </p>
          </div>

          <div className="ml-auto max-w-[88%] rounded-3xl bg-[var(--brand-sky-soft)] p-5 text-[var(--app-text)]">
            <p className="text-sm font-semibold text-[var(--brand-blue)]">
              Example assistant answer
            </p>

            <p className="mt-2 text-sm leading-6">{exampleAnswer}</p>

            <div className="mt-4">
              <AnswerFeedback
                questionText={exampleQuestion}
                answerText={exampleAnswer}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--app-border)] p-5">
          <div className="flex gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
            <input
              disabled
              placeholder="Chat input will be activated in the RAG phase..."
              className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
            />

            <button
              disabled
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white opacity-70 dark:text-[#052033]"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <InfoPanel
          icon={<BookOpenCheck />}
          title="Sources panel"
          description="Retrieved book chunks and citations will appear here."
        />

        <InfoPanel
          icon={<MessageSquareText />}
          title="Learning loop"
          description="Answer and source feedback will help improve retrieval quality."
        />
      </aside>
    </div>
  );
}

function InfoPanel({ icon, title, description }) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
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