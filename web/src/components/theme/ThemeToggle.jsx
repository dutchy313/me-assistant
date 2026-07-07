import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const options = [
  {
    value: "light",
    label: "Light",
    icon: Sun
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon
  },
  {
    value: "system",
    label: "System",
    icon: Laptop
  }
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
      <div className="grid grid-cols-3 gap-1">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={
                isActive
                  ? "flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-3 py-2 text-xs font-semibold text-white shadow-sm dark:text-[#052033]"
                  : "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--app-muted)] transition hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
              }
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}