import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  FileText,
  ClipboardCheck,
  Home,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import AppFooter from "../layout/AppFooter";

const mainLinks = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: Home,
    end: true
  },
  {
    to: "/dashboard/chat",
    label: "Chat",
    icon: MessageSquareText
  },
  {
    to: "/dashboard/feedback",
    label: "Feedback",
    icon: BarChart3
  }
];

const adminLinks = [
  {
    to: "/dashboard/admin",
    label: "Admin Home",
    icon: ShieldCheck,
    end: true
  },
  {
    to: "/dashboard/admin/feedback",
    label: "Feedback",
    icon: BarChart3
  },
  {
    to: "/dashboard/admin/documents",
    label: "Documents",
    icon: BookOpenCheck
  },
  {
    to: "/dashboard/admin/vectors",
    label: "Vectors",
    icon: BrainCircuit
  },
  {
    to: "/dashboard/admin/retrieval",
    label: "Retrieval",
    icon: Search
  },
  {
    to: "/dashboard/admin/evaluations",
    label: "Evaluations",
    icon: ClipboardCheck
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

export default function Sidebar() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-[var(--app-border)] bg-[var(--sidebar-bg)] lg:flex lg:flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white shadow-sm shadow-[var(--brand-blue)]/20 dark:text-[#052033]">
            <BrainCircuit size={24} />
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight text-[var(--sidebar-text)]">
              M&E Assistant
            </p>
            <p className="text-xs text-[var(--sidebar-muted)]">
              Source-backed M&E
            </p>
          </div>
        </div>

        <nav className="space-y-6">
          <NavSection title="Workspace" links={mainLinks} />

          {isAdmin && <NavSection title="Admin" links={adminLinks} />}
        </nav>
      </div>

      <div className="border-t border-[var(--app-border)] px-5 py-4">
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
          <p className="text-sm font-semibold text-[var(--sidebar-text)]">
            Signed in as
          </p>

          <p className="mt-1 truncate text-sm text-[var(--sidebar-muted)]">
            {user?.email || "User"}
          </p>

          <p className="mt-2 inline-flex rounded-full bg-[var(--brand-sky-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue)]">
            {user?.role || "user"}
          </p>
        </div>

        <div className="mt-4 text-xs text-[var(--sidebar-muted)]">
          <AppFooter compact />
        </div>
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
        {links.map((link) => (
          <SidebarLink key={link.to} link={link} />
        ))}
      </div>
    </div>
  );
}

function SidebarLink({ link }) {
  const Icon = link.icon;

  return (
    <NavLink
      to={link.to}
      end={link.end}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
          isActive
            ? "bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]"
            : "text-[var(--sidebar-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--sidebar-text)]"
        ].join(" ")
      }
    >
      <Icon size={18} />
      <span>{link.label}</span>
    </NavLink>
  );
}