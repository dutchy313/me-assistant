import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  FileText,
  Home,
  MessageSquareText,
  Settings,
  ShieldCheck
} from "lucide-react";
import { NavLink } from "react-router-dom";
import AppFooter from "../layout/AppFooter";

const userLinks = [
  {
    to: "/dashboard",
    label: "Workspace",
    icon: Home
  },
  {
    to: "/dashboard/chat",
    label: "Ask M&E Assistant",
    icon: MessageSquareText
  },
  {
    to: "/dashboard/feedback",
    label: "Feedback Center",
    icon: BarChart3
  }
];

const adminLinks = [
  {
    to: "/dashboard/admin",
    label: "Admin Home",
    icon: ShieldCheck
  },
  {
    to: "/dashboard/admin/documents",
    label: "Documents",
    icon: BookOpenCheck
  },
  {
    to: "/dashboard/admin/usage",
    label: "Usage",
    icon: FileText
  },
  {
    to: "/dashboard/admin/settings",
    label: "Settings",
    icon: Settings
  }
];

export default function Sidebar({ user }) {
  const isAdmin = user?.role === "admin";

  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-[var(--app-border)] bg-[var(--sidebar-bg)] lg:flex lg:flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--app-border)] px-6 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white shadow-sm shadow-[var(--brand-blue)]/20 dark:text-[#052033]">
          <BrainCircuit size={24} />
        </div>

        <div>
          <p className="text-lg font-bold tracking-tight text-[var(--sidebar-text)]">
            M&E Assistant
          </p>
          <p className="text-xs text-[var(--sidebar-muted)]">
            Evidence intelligence
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
        <NavSection title="Main" links={userLinks} />

        {isAdmin && <NavSection title="Admin" links={adminLinks} />}
      </nav>

      <div className="border-t border-[var(--app-border)] p-4">
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
          <p className="text-sm font-semibold text-[var(--app-text)]">
            Feedback-first design
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
            Every answer helps improve the M&E knowledge system.
          </p>
        </div>
      </div>

      <div className="text-xs">
        <AppFooter compact />
      </div>
    </aside>
  );
}

function NavSection({ title, links }) {
  return (
    <div>
      <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--sidebar-muted)]">
        {title}
      </p>

      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/dashboard"}
              className={({ isActive }) =>
                isActive
                  ? "flex items-center gap-3 rounded-2xl bg-[var(--brand-sky-soft)] px-3 py-3 text-sm font-semibold text-[var(--brand-blue)]"
                  : "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-[var(--sidebar-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--sidebar-text)]"
              }
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}