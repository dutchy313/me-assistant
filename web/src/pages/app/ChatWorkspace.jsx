import { useEffect, useRef, useState } from "react";
import { BookOpenCheck, Loader2, MessageSquareText, Send } from "lucide-react";
import { askChatQuestion, getChatMessages, getChatSessions } from "../../api/chatApi";
import AnswerFeedback from "../../components/feedback/AnswerFeedback";

export default function ChatWorkspace() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("idle");
  const [loadStatus, setLoadStatus] = useState("loading");
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  async function loadSessions() {
    try {
      setLoadStatus("loading");

      const response = await getChatSessions();
      const loadedSessions = response.data.sessions;

      setSessions(loadedSessions);

      if (loadedSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(loadedSessions[0]._id);
      }

      setLoadStatus("succeeded");
    } catch (error) {
      setLoadStatus("failed");
      setError(error.response?.data?.message || "Could not load chat sessions");
    }
  }

  async function loadMessages(sessionId) {
    if (!sessionId) return;

    try {
      const response = await getChatMessages(sessionId);
      setMessages(response.data.messages);
    } catch (error) {
      setError(error.response?.data?.message || "Could not load messages");
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    loadMessages(activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanQuestion = question.trim();

    if (!cleanQuestion) return;

    setQuestion("");
    setError("");
    setStatus("loading");

    const temporaryUserMessage = {
      _id: `temp-user-${Date.now()}`,
      role: "user",
      content: cleanQuestion,
      citations: []
    };

    setMessages((current) => [...current, temporaryUserMessage]);

    try {
      const response = await askChatQuestion({
        sessionId: activeSessionId,
        question: cleanQuestion
      });

      const { session, assistantMessage } = response.data;

      setActiveSessionId(session._id);

      setMessages((current) => [
        ...current.filter((message) => message._id !== temporaryUserMessage._id),
        response.data.userMessage,
        assistantMessage
      ]);

      await loadSessions();

      setStatus("succeeded");
    } catch (error) {
      setError(error.response?.data?.message || "Could not answer question");
      setStatus("failed");
    }
  }

  function startNewChat() {
    setActiveSessionId(null);
    setMessages([]);
    setQuestion("");
    setError("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--brand-blue)]">
              Conversations
            </p>
            <h2 className="text-xl font-bold text-[var(--app-text)]">
              Chat history
            </h2>
          </div>

          <button
            onClick={startNewChat}
            className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
          >
            New
          </button>
        </div>

        {loadStatus === "loading" ? (
          <p className="text-sm text-[var(--app-muted)]">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-[var(--app-muted)]">No chats yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session._id}
                onClick={() => setActiveSessionId(session._id)}
                className={[
                  "w-full rounded-2xl border px-4 py-3 text-left text-sm transition",
                  activeSessionId === session._id
                    ? "border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]"
                    : "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)]"
                ].join(" ")}
              >
                <p className="line-clamp-2 font-semibold">{session.title}</p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {new Date(session.lastMessageAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </aside>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="border-b border-[var(--app-border)] p-6">
          <p className="text-sm font-semibold text-[var(--brand-blue)]">
            Real RAG chat
          </p>

          <h1 className="mt-1 text-2xl font-bold text-[var(--app-text)]">
            Ask M&E Assistant
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
            Answers are generated from embedded M&E source chunks and include
            citation markers such as [1], [2], and [3].
          </p>
        </div>

        <div className="min-h-[520px] space-y-5 p-6">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((message) => (
              <ChatBubble key={message._id} message={message} />
            ))
          )}

          {status === "loading" && (
            <div className="flex items-center gap-2 text-sm text-[var(--app-muted)]">
              <Loader2 className="animate-spin" size={16} />
              Searching sources and writing answer...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-[var(--app-border)] p-5"
        >
          <div className="flex gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={status === "loading"}
              placeholder="Ask about evaluation design, indicators, outcomes, learning questions..."
              className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
            />

            <button
              type="submit"
              disabled={status === "loading" || !question.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white opacity-90 disabled:opacity-50 dark:text-[#052033]"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-8">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        <MessageSquareText size={22} />
      </div>

      <h2 className="text-xl font-bold text-[var(--app-text)]">
        Start a source-backed M&E chat
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
        Try: “What is mixed methods evaluation design?” or “How do I design
        outcome indicators for a youth employment project?”
      </p>
    </div>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={[
        "rounded-3xl p-5",
        isUser
          ? "ml-auto max-w-[80%] bg-[var(--brand-sky-soft)] text-[var(--app-text)]"
          : "max-w-[92%] bg-[var(--app-surface-muted)] text-[var(--app-text)]"
      ].join(" ")}
    >
      <p className="mb-2 text-sm font-semibold text-[var(--brand-blue)]">
        {isUser ? "You" : "M&E Assistant"}
      </p>

      <div className="whitespace-pre-wrap text-sm leading-7">
        {message.content}
      </div>

      {!isUser && message.citations?.length > 0 && (
        <Sources citations={message.citations} />
      )}

      {!isUser && (
        <div className="mt-4">
          <AnswerFeedback
            questionText=""
            answerText={message.content}
            messageId={message._id}
            sessionId={message.sessionId}
          />
        </div>
      )}
    </div>
  );
}

function Sources({ citations }) {
  return (
    <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <BookOpenCheck size={16} className="text-[var(--brand-blue)]" />
        <p className="text-sm font-bold text-[var(--app-text)]">Sources</p>
      </div>

      <div className="space-y-3">
        {citations.map((citation) => (
          <div
            key={`${citation.sourceNumber}-${citation.chunkId}`}
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3"
          >
            <p className="text-sm font-semibold text-[var(--app-text)]">
              [{citation.sourceNumber}] {citation.documentTitle}
            </p>

            <p className="mt-1 text-xs text-[var(--app-muted)]">
              Chunk {citation.chunkIndex} · Score{" "}
              {Number(citation.score || 0).toFixed(4)}
            </p>

            <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--app-muted)]">
              {citation.excerpt}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}