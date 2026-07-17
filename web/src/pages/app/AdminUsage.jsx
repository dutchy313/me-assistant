import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Users
} from "lucide-react";
import { getAdminUsage } from "../../api/adminUsageApi";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return date.toISOString().slice(0, 10);
}

export default function AdminUsage() {
  const [summary, setSummary] = useState({
    totalChatMessages: 0,
    totalEvaluations: 0,
    activeUsers: 0
  });

  const [dailySeries, setDailySeries] = useState([]);
  const [usageUsers, setUsageUsers] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [startDate, setStartDate] = useState(getDateDaysAgo(13));
  const [endDate, setEndDate] = useState(getTodayKey());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  async function loadUsage(options = {}) {
    try {
      setStatus("loading");
      setMessage("");

      const nextStartDate = options.startDate ?? startDate;
      const nextEndDate = options.endDate ?? endDate;
      const nextSearch = options.search ?? search;
      const nextPage = options.page ?? page;
      const nextLimit = options.limit ?? limit;

      const response = await getAdminUsage({
        startDate: nextStartDate,
        endDate: nextEndDate,
        page: nextPage,
        limit: nextLimit,
        search: nextSearch
      });

      setSummary(
        response.data.summary || {
          totalChatMessages: 0,
          totalEvaluations: 0,
          activeUsers: 0
        }
      );

      setDailySeries(response.data.dailySeries || []);
      setUsageUsers(response.data.users || []);
      setPagination(response.data.pagination || null);

      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      setMessage(error.response?.data?.message || "Could not load usage data");
    }
  }

  useEffect(() => {
    loadUsage();
  }, []);

  async function handleDateSubmit(event) {
    event.preventDefault();

    setPage(1);

    await loadUsage({
      page: 1
    });
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();

    setPage(1);

    await loadUsage({
      page: 1
    });
  }

  async function handleLimitChange(value) {
    const nextLimit = Number(value);

    setLimit(nextLimit);
    setPage(1);

    await loadUsage({
      page: 1,
      limit: nextLimit
    });
  }

  async function goToPage(nextPage) {
    setPage(nextPage);

    await loadUsage({
      page: nextPage
    });
  }

  function setQuickRange(days) {
    const nextStartDate = getDateDaysAgo(days - 1);
    const nextEndDate = getTodayKey();

    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    setPage(1);

    loadUsage({
      startDate: nextStartDate,
      endDate: nextEndDate,
      page: 1
    });
  }

  const totalActions =
    Number(summary.totalChatMessages || 0) +
    Number(summary.totalEvaluations || 0);

  const maxDailyValue = useMemo(() => {
    const max = Math.max(
      ...dailySeries.map((day) => {
        return Number(day.chatMessages || 0) + Number(day.evaluations || 0);
      }),
      1
    );

    return max;
  }, [dailySeries]);

  const isLoading = status === "loading";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          <Activity size={16} />
          Admin only
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--app-text)]">
              Usage dashboard
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
              Monitor chat and evaluation activity so beta usage stays visible,
              safe, and cost-aware.
            </p>
          </div>

          <button
            onClick={() => loadUsage()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-60"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--brand-sky-soft)] px-4 py-3 text-sm font-medium text-[var(--brand-blue)]">
            {message}
          </div>
        )}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<MessageSquareText />}
          label="Chat messages"
          value={summary.totalChatMessages || 0}
          detail="Questions successfully counted in the selected range"
        />

        <MetricCard
          icon={<ClipboardCheck />}
          label="Evaluations"
          value={summary.totalEvaluations || 0}
          detail="RAG evaluation usage in the selected range"
        />

        <MetricCard
          icon={<Users />}
          label="Active users"
          value={summary.activeUsers || 0}
          detail="Users with at least one counted action"
        />

        <MetricCard
          icon={<BarChart3 />}
          label="Total actions"
          value={totalActions}
          detail="Chat messages plus evaluations"
        />
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <form
          onSubmit={handleDateSubmit}
          className="grid gap-4 xl:grid-cols-[auto_auto_auto_1fr] xl:items-end"
        >
          <label>
            <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
              Start date
            </span>

            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
              End date
            </span>

            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
            />
          </label>

          <button
            type="submit"
            className="rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white dark:text-[#052033]"
          >
            Apply range
          </button>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <QuickRangeButton label="7 days" onClick={() => setQuickRange(7)} />
            <QuickRangeButton
              label="14 days"
              onClick={() => setQuickRange(14)}
            />
            <QuickRangeButton
              label="30 days"
              onClick={() => setQuickRange(30)}
            />
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-[var(--app-text)]">
            Daily usage trend
          </h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Each bar shows combined chat and evaluation actions for the day.
          </p>
        </div>

        {isLoading ? (
          <LoadingBox text="Loading usage trend..." />
        ) : dailySeries.length === 0 ? (
          <EmptyBox text="No usage data exists for this date range." />
        ) : (
          <div className="space-y-3">
            {dailySeries.map((day) => {
              const dayTotal =
                Number(day.chatMessages || 0) + Number(day.evaluations || 0);

              const widthPercent = Math.max(
                Math.round((dayTotal / maxDailyValue) * 100),
                dayTotal > 0 ? 4 : 0
              );

              return (
                <div
                  key={day.date}
                  className="grid gap-3 md:grid-cols-[8rem_1fr_10rem]"
                >
                  <p className="text-sm font-semibold text-[var(--app-text)]">
                    {day.date}
                  </p>

                  <div className="h-9 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--brand-blue)]"
                      style={{
                        width: `${widthPercent}%`
                      }}
                    />
                  </div>

                  <p className="text-sm text-[var(--app-muted)]">
                    {day.chatMessages || 0} chat · {day.evaluations || 0} eval
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--app-text)]">
              Usage by user
            </h2>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Users are sorted by total activity in the selected range.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] xl:min-w-[34rem]">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by user name or email"
                  className="min-w-0 flex-1 rounded-l-2xl bg-transparent px-4 py-3 text-sm text-[var(--app-text)] outline-none"
                />

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-r-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white dark:text-[#052033]"
                >
                  <Search size={16} />
                  Search
                </button>
              </div>
            </form>

            <select
              value={limit}
              onChange={(event) => handleLimitChange(event.target.value)}
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingBox text="Loading user usage..." />
        ) : usageUsers.length === 0 ? (
          <EmptyBox text="No users match this usage range or search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Chat</th>
                  <th className="px-4 py-2">Evaluations</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Days active</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {usageUsers.map((row) => (
                  <tr key={row.user._id}>
                    <td className="rounded-l-3xl border-y border-l border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4">
                      <p className="font-bold text-[var(--app-text)]">
                        {row.user.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--app-muted)]">
                        {row.user.email}
                      </p>
                    </td>

                    <td className="border-y border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm font-semibold capitalize text-[var(--app-text)]">
                      {row.user.role}
                    </td>

                    <td className="border-y border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm text-[var(--app-muted)]">
                      {row.chatMessages}
                    </td>

                    <td className="border-y border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm text-[var(--app-muted)]">
                      {row.evaluations}
                    </td>

                    <td className="border-y border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm font-bold text-[var(--app-text)]">
                      {row.totalActions}
                    </td>

                    <td className="border-y border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm text-[var(--app-muted)]">
                      {row.daysActive}
                    </td>

                    <td className="rounded-r-3xl border-y border-r border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4">
                      <StatusBadge status={row.user.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControls
          pagination={pagination}
          onPrevious={() =>
            goToPage(Math.max((pagination?.page || 1) - 1, 1))
          }
          onNext={() => goToPage((pagination?.page || 1) + 1)}
        />
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, detail }) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        {icon}
      </div>

      <p className="text-sm text-[var(--app-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--app-text)]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">{detail}</p>
    </div>
  );
}

function QuickRangeButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
    >
      {label}
    </button>
  );
}

function LoadingBox({ text }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5 text-[var(--app-muted)]">
      <Loader2 size={18} className="animate-spin" />
      {text}
    </div>
  );
}

function EmptyBox({ text }) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5 text-sm text-[var(--app-muted)]">
      {text}
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === "active";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {active ? "Active" : "Disabled"}
    </span>
  );
}

function PaginationControls({ pagination, onPrevious, onNext }) {
  if (!pagination) return null;

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-[var(--app-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--app-muted)]">
        Page {pagination.page} of {pagination.totalPages}. Total users:{" "}
        {pagination.total}.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onPrevious}
          disabled={!pagination.hasPreviousPage}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <button
          onClick={onNext}
          disabled={!pagination.hasNextPage}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-50"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}