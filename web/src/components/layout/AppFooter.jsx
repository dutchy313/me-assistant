const cloneshouseUrl =
  import.meta.env.VITE_CLONESHOUSE_URL || "https://cloneshouse.com";

export default function AppFooter() {
  return (
    <footer className="border-t border-[var(--brand-border-soft)] bg-white/80 px-6 py-5 text-center text-sm text-slate-500">
      Designed by the{" "}
      <span className="font-medium text-slate-700">
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