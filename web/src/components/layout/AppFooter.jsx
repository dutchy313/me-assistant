const cloneshouseUrl =
  import.meta.env.VITE_CLONESHOUSE_URL || "https://cloneshouse.com";

export default function AppFooter({ compact = false }) {
  if (compact) {
    return (
      <footer className="px-2 py-3 text-center text-[11px] leading-5 text-[var(--app-muted)]">
        Designed by{" "}
        <a
          href={cloneshouseUrl}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[var(--brand-blue)] underline underline-offset-4 hover:text-[#00A7D6]"
        >
          Cloneshouse
        </a>
      </footer>
    );
  }

  return (
    <footer className="border-t border-[var(--brand-border-soft)] bg-[var(--app-surface)]/80 px-6 py-5 text-center text-sm text-[var(--app-muted)]">
      Designed by the{" "}
      <span className="font-medium text-[var(--app-text)]">
        Evidence and Intelligence team
      </span>{" "}
      at{" "}
      <a
        href={cloneshouseUrl}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-[var(--brand-blue)] underline underline-offset-4 hover:text-[#00A7D6]"
      >
        Cloneshouse
      </a>
      .
    </footer>
  );
}