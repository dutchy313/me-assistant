import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  Users
} from "lucide-react";
import { useSelector } from "react-redux";
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus
} from "../../api/adminUserApi";

export default function AdminUsers() {
  const { user: currentUser } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [busyUserId, setBusyUserId] = useState("");

  async function loadUsers(options = {}) {
    try {
      setStatus("loading");
      setMessage("");

      const nextPage = options.page ?? page;
      const nextLimit = options.limit ?? limit;
      const nextSearch = options.search ?? search;
      const nextRole = options.role ?? roleFilter;
      const nextStatus = options.status ?? statusFilter;

      const response = await getAdminUsers({
        page: nextPage,
        limit: nextLimit,
        search: nextSearch,
        role: nextRole,
        status: nextStatus
      });

      setUsers(response.data.users || []);
      setPagination(response.data.pagination || null);
      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      setMessage(error.response?.data?.message || "Could not load users");
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSearchSubmit(event) {
    event.preventDefault();

    setPage(1);
    await loadUsers({
      page: 1
    });
  }

  async function handleRoleFilterChange(value) {
    setRoleFilter(value);
    setPage(1);

    await loadUsers({
      page: 1,
      role: value
    });
  }

  async function handleStatusFilterChange(value) {
    setStatusFilter(value);
    setPage(1);

    await loadUsers({
      page: 1,
      status: value
    });
  }

  async function handleLimitChange(value) {
    const nextLimit = Number(value);

    setLimit(nextLimit);
    setPage(1);

    await loadUsers({
      page: 1,
      limit: nextLimit
    });
  }

  async function handleRoleChange(targetUser, nextRole) {
    if (targetUser.role === nextRole) {
      return;
    }

    const confirmed = window.confirm(
      `Change ${targetUser.name}'s role from ${targetUser.role} to ${nextRole}?`
    );

    if (!confirmed) return;

    try {
      setBusyUserId(targetUser._id);
      setMessage("");

      await updateAdminUserRole({
        userId: targetUser._id,
        role: nextRole
      });

      setMessage("User role updated.");
      await loadUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update user role");
    } finally {
      setBusyUserId("");
    }
  }

  async function handleStatusChange(targetUser, nextStatus) {
    if (targetUser.status === nextStatus) {
      return;
    }

    const actionLabel = nextStatus === "disabled" ? "disable" : "reactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} ${targetUser.name}?`
    );

    if (!confirmed) return;

    try {
      setBusyUserId(targetUser._id);
      setMessage("");

      await updateAdminUserStatus({
        userId: targetUser._id,
        status: nextStatus
      });

      setMessage(
        nextStatus === "disabled"
          ? "User account disabled."
          : "User account reactivated."
      );

      await loadUsers();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not update user status"
      );
    } finally {
      setBusyUserId("");
    }
  }

  async function goToPage(nextPage) {
    setPage(nextPage);
    await loadUsers({
      page: nextPage
    });
  }

  const isLoading = status === "loading";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          <UserCog size={16} />
          Admin only
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--app-text)]">
              Users and roles
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
              Manage account access for beta users, reviewers, and system
              administrators.
            </p>
          </div>

          <button
            onClick={() => loadUsers()}
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

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto_auto] xl:items-end">
          <form onSubmit={handleSearchSubmit}>
            <label>
              <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                Search users
              </span>

              <div className="flex rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email"
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
            </label>
          </form>

          <label>
            <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
              Role
            </span>

            <select
              value={roleFilter}
              onChange={(event) => handleRoleFilterChange(event.target.value)}
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
            >
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="reviewer">Reviewer</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
              Status
            </span>

            <select
              value={statusFilter}
              onChange={(event) =>
                handleStatusFilterChange(event.target.value)
              }
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
              Rows
            </span>

            <select
              value={limit}
              onChange={(event) => handleLimitChange(event.target.value)}
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
            <Users size={20} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--app-text)]">
              User accounts
            </h2>
            <p className="text-sm text-[var(--app-muted)]">
              Change roles carefully. Admins can manage system settings and
              source processing.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5 text-[var(--app-muted)]">
            <Loader2 size={18} className="animate-spin" />
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5 text-sm text-[var(--app-muted)]">
            No users match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Today usage</th>
                  <th className="px-4 py-2">Last login</th>
                  <th className="px-4 py-2">Created</th>
                </tr>
              </thead>

              <tbody>
                {users.map((targetUser) => {
                  const isCurrentUser =
                    String(targetUser._id) === String(currentUser?._id);

                  const isBusy = busyUserId === targetUser._id;

                  return (
                    <tr key={targetUser._id}>
                      <td className="rounded-l-3xl border-y border-l border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4">
                        <div>
                          <p className="font-bold text-[var(--app-text)]">
                            {targetUser.name}
                            {isCurrentUser && (
                              <span className="ml-2 rounded-full bg-[var(--brand-sky-soft)] px-2 py-1 text-xs font-semibold text-[var(--brand-blue)]">
                                You
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-sm text-[var(--app-muted)]">
                            {targetUser.email}
                          </p>
                        </div>
                      </td>

                      <td className="border-y border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4">
                        <select
                          value={targetUser.role}
                          disabled={isCurrentUser || isBusy}
                          onChange={(event) =>
                            handleRoleChange(targetUser, event.target.value)
                          }
                          className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-semibold text-[var(--app-text)] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="user">User</option>
                          <option value="reviewer">Reviewer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="border-y border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <StatusBadge status={targetUser.status} />

                          <button
                            disabled={isCurrentUser || isBusy}
                            onClick={() =>
                              handleStatusChange(
                                targetUser,
                                targetUser.status === "active"
                                  ? "disabled"
                                  : "active"
                              )
                            }
                            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-bold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <ShieldCheck size={14} />
                            {targetUser.status === "active"
                              ? "Disable"
                              : "Reactivate"}
                          </button>
                        </div>
                      </td>

                      <td className="border-y border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4">
                        <p className="text-sm font-semibold text-[var(--app-text)]">
                          Chat: {targetUser.todayUsage?.chatMessages || 0}
                        </p>
                        <p className="mt-1 text-sm text-[var(--app-muted)]">
                          Evaluations:{" "}
                          {targetUser.todayUsage?.evaluations || 0}
                        </p>
                      </td>

                      <td className="border-y border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm text-[var(--app-muted)]">
                        {targetUser.lastLoginAt
                          ? new Date(targetUser.lastLoginAt).toLocaleString()
                          : "Never"}
                      </td>

                      <td className="rounded-r-3xl border-y border-r border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-4 text-sm text-[var(--app-muted)]">
                        {targetUser.createdAt
                          ? new Date(targetUser.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
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