import { LogOut, Menu, UserCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import ThemeToggle from "../theme/ThemeToggle";

export default function Topbar({ user }) {
  const dispatch = useDispatch();

  function handleLogout() {
    dispatch(logout());
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--app-border)] bg-[var(--app-surface)]/85 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text)] lg:hidden">
            <Menu size={20} />
          </button>

          <div>
            <p className="text-sm text-[var(--app-muted)]">Welcome back</p>
            <h1 className="text-xl font-bold tracking-tight text-[var(--app-text)]">
              {user?.name || "M&E user"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="hidden items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2 md:flex">
            <UserCircle size={20} className="text-[var(--brand-blue)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--app-text)]">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-[var(--app-muted)]">
                {user?.role || "user"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}