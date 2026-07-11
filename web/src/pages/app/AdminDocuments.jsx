import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileText,
  Loader2,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  X
} from "lucide-react";
import {
  disableDocument,
  getAdminDocuments,
  getIngestionLogs,
  processPendingDocuments,
  reprocessDocument,
  resetFailedDocuments,
  suggestDocumentMetadata,
  suggestMetadataBatch,
  syncGoogleDriveDocuments,
  updateDocumentMetadata
} from "../../api/documentApi";

const emptyMetadataForm = {
  canonicalTitle: "",
  authorsText: "",
  publicationYear: "",
  publisher: "",
  citationLabel: "",
  sourceType: "book",
  metadataStatus: "reviewed",
  metadataNotes: ""
};

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    indexed: 0,
    failed: 0,
    disabled: 0,
    metadataAuto: 0,
    metadataNeedsReview: 0,
    metadataReviewed: 0
  });
  const [logs, setLogs] = useState([]);

  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(20);
  const [documentStatusFilter, setDocumentStatusFilter] = useState("");
  const [metadataStatusFilter, setMetadataStatusFilter] = useState("");

  const [batchSize, setBatchSize] = useState(3);
  const [status, setStatus] = useState("loading");
  const [syncStatus, setSyncStatus] = useState("idle");
  const [processStatus, setProcessStatus] = useState("idle");
  const [resetStatus, setResetStatus] = useState("idle");
  const [metadataStatus, setMetadataStatus] = useState("idle");
  const [suggestStatus, setSuggestStatus] = useState("idle");
  const [bulkSuggestStatus, setBulkSuggestStatus] = useState("idle");
  const [bulkSuggestSize, setBulkSuggestSize] = useState(3);
  const [reprocessStatus, setReprocessStatus] = useState("idle");
  const [reprocessingDocumentId, setReprocessingDocumentId] = useState("");
  const [message, setMessage] = useState("");

  const [editingDocument, setEditingDocument] = useState(null);
  const [metadataForm, setMetadataForm] = useState(emptyMetadataForm);
  const [metadataSuggestion, setMetadataSuggestion] = useState(null);

  async function loadData(options = {}) {
    try {
      setStatus("loading");

      const nextPage = options.page ?? page;
      const nextLimit = options.limit ?? pageLimit;
      const nextDocumentStatus =
        options.documentStatusFilter ?? documentStatusFilter;
      const nextMetadataStatus =
        options.metadataStatusFilter ?? metadataStatusFilter;

      const [documentsResponse, logsResponse] = await Promise.all([
        getAdminDocuments({
          page: nextPage,
          limit: nextLimit,
          status: nextDocumentStatus,
          metadataStatus: nextMetadataStatus
        }),
        getIngestionLogs()
      ]);

      setDocuments(documentsResponse.data.documents);
      setPagination(documentsResponse.data.pagination);
      setCounts(
        documentsResponse.data.counts || {
          total: 0,
          pending: 0,
          processing: 0,
          indexed: 0,
          failed: 0,
          disabled: 0,
          metadataAuto: 0,
          metadataNeedsReview: 0,
          metadataReviewed: 0
        }
      );

      setLogs(logsResponse.data.logs);
      setStatus("succeeded");
    } catch (error) {
      setStatus("failed");
      setMessage(error.response?.data?.message || "Could not load documents");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSync() {
    try {
      setSyncStatus("loading");
      setMessage("");

      const response = await syncGoogleDriveDocuments();

      setMessage(
        `Sync completed. Created ${response.data.result.created}, updated ${response.data.result.updated}, skipped ${response.data.result.skipped}, failed ${response.data.result.failed}.`
      );

      setSyncStatus("succeeded");
      await loadData();
    } catch (error) {
      setSyncStatus("failed");
      setMessage(error.response?.data?.message || "Google Drive sync failed");
    }
  }

  async function handleProcess() {
    try {
      setProcessStatus("loading");
      setMessage("");

      const safeBatchSize = Math.max(1, Math.min(Number(batchSize) || 1, 10));
      const response = await processPendingDocuments(safeBatchSize);

      setMessage(
        `Processing completed. Indexed ${response.data.result.indexed}, failed ${response.data.result.failed}, selected ${response.data.result.totalSelected}.`
      );

      setProcessStatus("succeeded");
      await loadData();
    } catch (error) {
      setProcessStatus("failed");
      setMessage(error.response?.data?.message || "Document processing failed");
    }
  }

  async function handleResetFailed() {
    const confirmed = window.confirm(
      "Reset failed documents back to pending so they can be processed again?"
    );

    if (!confirmed) return;

    try {
      setResetStatus("loading");
      setMessage("");

      const response = await resetFailedDocuments();

      setMessage(
        `Reset ${response.data.result.resetCount} failed document(s) back to pending.`
      );

      setResetStatus("succeeded");
      await loadData();
    } catch (error) {
      setResetStatus("failed");
      setMessage(error.response?.data?.message || "Could not reset documents");
    }
  }

  async function handleReprocess(document) {
    const confirmed = window.confirm(
      `Reprocess this document?\n\n${document.fileName}\n\nThis will delete the old vectors for this document and create new cleaned chunks. You must go to Vector Index afterward and embed the pending chunks.`
    );

    if (!confirmed) return;

    try {
      setReprocessStatus("loading");
      setReprocessingDocumentId(document._id);
      setMessage("");

      const response = await reprocessDocument(document._id);
      const result = response.data.result;

      setMessage(
        `Reprocessed "${document.fileName}". Created ${result.totalChunks} cleaned chunks. Go to Vector Index and embed ${result.pendingEmbeddings} pending chunks.`
      );

      setReprocessStatus("succeeded");
      setReprocessingDocumentId("");

      await loadData();
    } catch (error) {
      setReprocessStatus("failed");
      setReprocessingDocumentId("");
      setMessage(error.response?.data?.message || "Could not reprocess document");
    }
  }

  async function handleQuickMetadataStatus(document, nextStatus) {
    try {
      setMessage("");

      await updateDocumentMetadata(document._id, {
        metadataStatus: nextStatus
      });

      setMessage(`Metadata status updated to ${formatMetadataStatus(nextStatus)}.`);

      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not update metadata status"
      );
    }
  }

  async function handleDisable(documentId) {
    const confirmed = window.confirm(
      "Disable this document? It will be excluded from future retrieval."
    );

    if (!confirmed) return;

    try {
      await disableDocument(documentId);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not disable document");
    }
  }

  function openMetadataEditor(document) {
    setEditingDocument(document);
    setMetadataSuggestion(null);
    setSuggestStatus("idle");

    setMetadataForm({
      canonicalTitle: document.canonicalTitle || "",
      authorsText: Array.isArray(document.authors)
        ? document.authors.join("; ")
        : "",
      publicationYear: document.publicationYear || "",
      publisher: document.publisher || "",
      citationLabel: document.citationLabel || "",
      sourceType: document.sourceType || "book",
      metadataStatus: document.metadataStatus || "reviewed",
      metadataNotes: document.metadataNotes || ""
    });
  }

  function closeMetadataEditor() {
    setEditingDocument(null);
    setMetadataForm(emptyMetadataForm);
    setMetadataSuggestion(null);
    setMetadataStatus("idle");
    setSuggestStatus("idle");
  }

  function updateMetadataField(field, value) {
    setMetadataForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSuggestMetadata() {
    if (!editingDocument) return;

    try {
      setSuggestStatus("loading");
      setMessage("");

      const response = await suggestDocumentMetadata(editingDocument._id);
      const suggestion = response.data.suggestion;

      setMetadataSuggestion(suggestion);
      setSuggestStatus("succeeded");
    } catch (error) {
      setSuggestStatus("failed");
      setMessage(
        error.response?.data?.message || "Could not suggest document metadata"
      );
    }
  }

  async function handleBulkSuggestMetadata() {
    const confirmed = window.confirm(
      `Suggest metadata for ${bulkSuggestSize} auto-metadata document(s)? The results will be saved as needs_review, not reviewed.`
    );

    if (!confirmed) return;

    try {
      setBulkSuggestStatus("loading");
      setMessage("");

      const response = await suggestMetadataBatch(bulkSuggestSize);
      const result = response.data.result;

      setMessage(
        `Bulk metadata suggestion completed. Suggested ${result.suggested}, failed ${result.failed}, selected ${result.totalSelected}. Review suggestions under Metadata status = Needs review.`
      );

      setBulkSuggestStatus("succeeded");

      setMetadataStatusFilter("needs_review");
      setPage(1);

      await loadData({
        page: 1,
        metadataStatusFilter: "needs_review"
      });
    } catch (error) {
      setBulkSuggestStatus("failed");
      setMessage(
        error.response?.data?.message || "Bulk metadata suggestion failed"
      );
    }
  }

  function applySuggestion() {
    if (!metadataSuggestion) return;

    setMetadataForm({
      canonicalTitle: metadataSuggestion.canonicalTitle || "",
      authorsText: Array.isArray(metadataSuggestion.authors)
        ? metadataSuggestion.authors.join("; ")
        : "",
      publicationYear: metadataSuggestion.publicationYear || "",
      publisher: metadataSuggestion.publisher || "",
      citationLabel: metadataSuggestion.citationLabel || "",
      sourceType: metadataSuggestion.sourceType || "book",
      metadataStatus: "needs_review",
      metadataNotes: metadataSuggestion.notes
        ? `AI suggestion (${metadataSuggestion.confidence || "low"} confidence): ${
            metadataSuggestion.notes
          }`
        : `AI suggestion (${metadataSuggestion.confidence || "low"} confidence).`
    });
  }

  async function handleMetadataSubmit(event) {
    event.preventDefault();

    if (!editingDocument) return;

    try {
      setMetadataStatus("loading");
      setMessage("");

      const authors = metadataForm.authorsText
        .split(";")
        .map((author) => author.trim())
        .filter(Boolean);

      const publicationYear = metadataForm.publicationYear
        ? Number(metadataForm.publicationYear)
        : null;

      await updateDocumentMetadata(editingDocument._id, {
        canonicalTitle: metadataForm.canonicalTitle,
        authors,
        publicationYear,
        publisher: metadataForm.publisher,
        citationLabel: metadataForm.citationLabel,
        sourceType: metadataForm.sourceType,
        metadataStatus: metadataForm.metadataStatus,
        metadataNotes: metadataForm.metadataNotes
      });

      setMetadataStatus("succeeded");
      setMessage("Document metadata updated.");
      closeMetadataEditor();
      await loadData();
    } catch (error) {
      setMetadataStatus("failed");
      setMessage(
        error.response?.data?.message || "Could not update document metadata"
      );
    }
  }

  async function goToPage(nextPage) {
    setPage(nextPage);
    await loadData({ page: nextPage });
  }

  async function handlePageLimitChange(value) {
    const nextLimit = Number(value);
    setPageLimit(nextLimit);
    setPage(1);
    await loadData({ page: 1, limit: nextLimit });
  }

  async function handleDocumentStatusFilterChange(value) {
    setDocumentStatusFilter(value);
    setPage(1);
    await loadData({ page: 1, documentStatusFilter: value });
  }

  async function handleMetadataStatusFilterChange(value) {
    setMetadataStatusFilter(value);
    setPage(1);
    await loadData({ page: 1, metadataStatusFilter: value });
  }

  async function clearFilters() {
    setDocumentStatusFilter("");
    setMetadataStatusFilter("");
    setPage(1);
    await loadData({
      page: 1,
      documentStatusFilter: "",
      metadataStatusFilter: ""
    });
  }

  const busy =
    syncStatus === "loading" ||
    processStatus === "loading" ||
    resetStatus === "loading" ||
    bulkSuggestStatus === "loading" ||
    reprocessStatus === "loading";

  const indexedPercent =
    counts.total === 0 ? 0 : Math.round((counts.indexed / counts.total) * 100);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-xl shadow-[var(--brand-blue)]/10">
        <div className="mb-5 inline-flex rounded-full border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]">
          Safe batch processing + metadata review
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--app-text)]">
              Documents
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-[var(--app-muted)]">
              Process PDFs, review failed documents, reprocess selected sources
              with improved cleanup, and correct citation metadata.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSync}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--brand-blue)]/20 transition hover:bg-[var(--brand-blue-hover)] disabled:opacity-70 dark:text-[#052033]"
              >
                <RefreshCw
                  size={16}
                  className={syncStatus === "loading" ? "animate-spin" : ""}
                />
                {syncStatus === "loading" ? "Syncing..." : "Sync Drive"}
              </button>

              <button
                onClick={handleResetFailed}
                disabled={busy || counts.failed === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Reset failed
              </button>
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 sm:flex-row sm:items-center">
              <label className="text-sm font-semibold text-[var(--app-text)]">
                Batch
              </label>

              <select
                value={batchSize}
                onChange={(event) => setBatchSize(Number(event.target.value))}
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value={1}>1 document</option>
                <option value={3}>3 documents</option>
                <option value={5}>5 documents</option>
                <option value={10}>10 documents</option>
              </select>

              <button
                onClick={handleProcess}
                disabled={busy || counts.pending === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 dark:text-[#052033]"
              >
                <PlayCircle size={16} />
                {processStatus === "loading"
                  ? "Processing..."
                  : `Process ${batchSize}`}
              </button>
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 sm:flex-row sm:items-center">
              <label className="text-sm font-semibold text-[var(--app-text)]">
                Metadata AI
              </label>

              <select
                value={bulkSuggestSize}
                onChange={(event) =>
                  setBulkSuggestSize(Number(event.target.value))
                }
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value={1}>1 document</option>
                <option value={3}>3 documents</option>
                <option value={5}>5 documents</option>
              </select>

              <button
                onClick={handleBulkSuggestMetadata}
                disabled={busy || counts.metadataAuto === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-5 py-3 text-sm font-semibold text-[var(--brand-blue)] transition hover:bg-[var(--app-surface)] disabled:opacity-60"
              >
                {bulkSuggestStatus === "loading" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {bulkSuggestStatus === "loading"
                  ? "Suggesting..."
                  : "Bulk suggest metadata"}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--brand-sky-soft)] px-4 py-3 text-sm font-medium text-[var(--brand-blue)]">
            {message}
          </div>
        )}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--app-text)]">
              Processing progress
            </span>
            <span className="text-[var(--app-muted)]">{indexedPercent}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
            <div
              className="h-full rounded-full bg-[var(--brand-blue)] transition-all"
              style={{ width: `${indexedPercent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-4 xl:grid-cols-8">
        <MetricCard
          icon={<BookOpenCheck />}
          label="Documents"
          value={counts.total}
        />
        <MetricCard
          icon={<CheckCircle2 />}
          label="Pending"
          value={counts.pending}
        />
        <MetricCard
          icon={<RefreshCw />}
          label="Processing"
          value={counts.processing}
        />
        <MetricCard icon={<FileText />} label="Indexed" value={counts.indexed} />
        <MetricCard
          icon={<AlertTriangle />}
          label="Failed"
          value={counts.failed}
        />
        <MetricCard
          icon={<Edit3 />}
          label="Auto metadata"
          value={counts.metadataAuto}
        />
        <MetricCard
          icon={<Edit3 />}
          label="Needs review"
          value={counts.metadataNeedsReview}
        />
        <MetricCard
          icon={<Edit3 />}
          label="Reviewed"
          value={counts.metadataReviewed}
        />
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--app-text)]">
              Synced documents
            </h2>

            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Use filters and pagination to review all source documents.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label>
              <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                Document status
              </span>

              <select
                value={documentStatusFilter}
                onChange={(event) =>
                  handleDocumentStatusFilterChange(event.target.value)
                }
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="indexed">Indexed</option>
                <option value="failed">Failed</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                Metadata status
              </span>

              <select
                value={metadataStatusFilter}
                onChange={(event) =>
                  handleMetadataStatusFilterChange(event.target.value)
                }
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value="">All</option>
                <option value="auto">Auto</option>
                <option value="needs_review">Needs review</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold text-[var(--app-muted)]">
                Rows
              </span>

              <select
                value={pageLimit}
                onChange={(event) => handlePageLimitChange(event.target.value)}
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>

            <button
              onClick={clearFilters}
              className="self-end rounded-2xl border border-[var(--app-border)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
            >
              Clear filters
            </button>
          </div>
        </div>

        {status === "loading" ? (
          <p className="mt-5 text-sm text-[var(--app-muted)]">
            Loading documents...
          </p>
        ) : documents.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--app-muted)]">
            No documents match the selected filters.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1450px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border)] text-[var(--app-muted)]">
                  <th className="py-3 pr-4">Title</th>
                  <th className="py-3 pr-4">Citation</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Metadata</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Chunks</th>
                  <th className="py-3 pr-4">Size</th>
                  <th className="py-3 pr-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {documents.map((document) => {
                  const isThisDocumentReprocessing =
                    reprocessingDocumentId === document._id;

                  return (
                    <tr
                      key={document._id}
                      className="border-b border-[var(--app-border)]"
                    >
                      <td className="max-w-[360px] py-4 pr-4">
                        <p className="font-semibold text-[var(--app-text)]">
                          {document.canonicalTitle || document.title}
                        </p>

                        <p className="mt-1 text-xs text-[var(--app-muted)]">
                          File: {document.fileName}
                        </p>

                        {document.authors?.length > 0 && (
                          <p className="mt-1 text-xs text-[var(--app-muted)]">
                            Authors: {document.authors.join(", ")}
                          </p>
                        )}

                        {document.errorMessage && (
                          <p className="mt-2 text-xs text-red-600">
                            {document.errorMessage}
                          </p>
                        )}
                      </td>

                      <td className="py-4 pr-4 text-[var(--app-muted)]">
                        <p>{document.citationLabel || "—"}</p>
                        <p className="mt-1 text-xs">
                          {document.publicationYear || "No year"}
                          {document.publisher ? ` · ${document.publisher}` : ""}
                        </p>
                      </td>

                      <td className="py-4 pr-4 text-[var(--app-muted)]">
                        {document.sourceType || "unknown"}
                      </td>

                      <td className="py-4 pr-4">
                        <div className="space-y-2">
                          <span className="inline-flex rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--app-text)]">
                            {formatMetadataStatus(
                              document.metadataStatus || "auto"
                            )}
                          </span>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                handleQuickMetadataStatus(document, "reviewed")
                              }
                              disabled={
                                (document.metadataStatus || "auto") ===
                                "reviewed"
                              }
                              className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-40"
                            >
                              Mark reviewed
                            </button>

                            <button
                              onClick={() =>
                                handleQuickMetadataStatus(
                                  document,
                                  "needs_review"
                                )
                              }
                              disabled={
                                (document.metadataStatus || "auto") ===
                                "needs_review"
                              }
                              className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-40"
                            >
                              Needs review
                            </button>

                            <button
                              onClick={() =>
                                handleQuickMetadataStatus(document, "auto")
                              }
                              disabled={
                                (document.metadataStatus || "auto") === "auto"
                              }
                              className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] disabled:opacity-40"
                            >
                              Reset auto
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--app-text)]">
                          {document.status}
                        </span>
                      </td>

                      <td className="py-4 pr-4 text-[var(--app-muted)]">
                        {document.totalChunks || 0}
                      </td>

                      <td className="py-4 pr-4 text-[var(--app-muted)]">
                        {formatFileSize(document.driveSize)}
                      </td>

                      <td className="py-4 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openMetadataEditor(document)}
                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)]"
                          >
                            <Edit3 size={14} />
                            Metadata
                          </button>

                          <button
                            onClick={() => handleReprocess(document)}
                            disabled={
                              busy ||
                              document.status === "processing" ||
                              document.status === "disabled" ||
                              document.fileType !== "pdf"
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-3 py-2 text-xs font-semibold text-[var(--brand-blue)] hover:bg-[var(--app-surface)] disabled:opacity-50"
                          >
                            {isThisDocumentReprocessing ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <RefreshCw size={14} />
                            )}
                            {isThisDocumentReprocessing
                              ? "Reprocessing..."
                              : "Reprocess"}
                          </button>

                          {document.status !== "disabled" ? (
                            <button
                              onClick={() => handleDisable(document._id)}
                              disabled={busy}
                              className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)] hover:text-[var(--brand-blue)] disabled:opacity-50"
                            >
                              Disable
                            </button>
                          ) : (
                            <span className="text-xs text-[var(--app-muted)]">
                              Disabled
                            </span>
                          )}
                        </div>
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
          onPrevious={() => goToPage(Math.max((pagination?.page || 1) - 1, 1))}
          onNext={() => goToPage((pagination?.page || 1) + 1)}
        />
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <h2 className="text-xl font-bold text-[var(--app-text)]">
          Recent ingestion logs
        </h2>

        <div className="mt-5 space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-[var(--app-muted)]">No logs yet.</p>
          ) : (
            logs.map((log) => (
              <div
                key={log._id}
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--app-text)]">
                    {log.action}
                  </p>

                  <span className="rounded-full border border-[var(--app-border)] px-3 py-1 text-xs font-semibold text-[var(--app-muted)]">
                    {log.status}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                  {log.message}
                </p>

                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {editingDocument && (
        <MetadataModal
          document={editingDocument}
          form={metadataForm}
          status={metadataStatus}
          suggestStatus={suggestStatus}
          suggestion={metadataSuggestion}
          onSuggest={handleSuggestMetadata}
          onApplySuggestion={applySuggestion}
          onChange={updateMetadataField}
          onClose={closeMetadataEditor}
          onSubmit={handleMetadataSubmit}
        />
      )}
    </div>
  );
}

function PaginationControls({ pagination, onPrevious, onNext }) {
  if (!pagination) return null;

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-[var(--app-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--app-muted)]">
        Showing page {pagination.page} of {pagination.totalPages}. Total
        records: {pagination.total}.
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

function MetadataModal({
  document,
  form,
  status,
  suggestStatus,
  suggestion,
  onSuggest,
  onApplySuggestion,
  onChange,
  onClose,
  onSubmit
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--brand-blue)]">
              Edit document metadata
            </p>

            <h2 className="mt-1 text-2xl font-bold text-[var(--app-text)]">
              {document.title}
            </h2>

            <p className="mt-1 text-sm text-[var(--app-muted)]">
              {document.fileName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl border border-[var(--app-border)] p-3 text-[var(--app-text)] hover:bg-[var(--brand-sky-soft)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-[var(--app-text)]">
                AI metadata suggestion
              </p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                The AI will use the filename and first extracted chunks. Review
                before saving.
              </p>
            </div>

            <button
              type="button"
              onClick={onSuggest}
              disabled={suggestStatus === "loading"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:text-[#052033]"
            >
              {suggestStatus === "loading" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {suggestStatus === "loading" ? "Suggesting..." : "Suggest metadata"}
            </button>
          </div>

          {suggestion && (
            <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--app-text)]">
                    Suggested metadata
                  </p>

                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                    Confidence: {suggestion.confidence || "low"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onApplySuggestion}
                  className="rounded-2xl border border-[var(--brand-sky-border)] bg-[var(--brand-sky-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)]"
                >
                  Apply suggestion
                </button>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <SuggestionItem
                  label="Title"
                  value={suggestion.canonicalTitle}
                />
                <SuggestionItem
                  label="Authors"
                  value={suggestion.authors?.join(", ")}
                />
                <SuggestionItem
                  label="Year"
                  value={suggestion.publicationYear}
                />
                <SuggestionItem
                  label="Publisher"
                  value={suggestion.publisher}
                />
                <SuggestionItem
                  label="Citation"
                  value={suggestion.citationLabel}
                />
                <SuggestionItem
                  label="Source type"
                  value={suggestion.sourceType}
                />
              </div>

              {suggestion.notes && (
                <p className="mt-3 text-xs leading-5 text-[var(--app-muted)]">
                  Notes: {suggestion.notes}
                </p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <Field
            label="Canonical title"
            value={form.canonicalTitle}
            onChange={(value) => onChange("canonicalTitle", value)}
            placeholder="Road to Results: Designing and Conducting Effective Development Evaluations"
          />

          <Field
            label="Authors"
            value={form.authorsText}
            onChange={(value) => onChange("authorsText", value)}
            placeholder="Linda G. Morra Imas; Ray C. Rist"
            help="Separate multiple authors with semicolons."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Publication year"
              value={form.publicationYear}
              onChange={(value) => onChange("publicationYear", value)}
              placeholder="2009"
              type="number"
            />

            <Field
              label="Publisher"
              value={form.publisher}
              onChange={(value) => onChange("publisher", value)}
              placeholder="World Bank"
            />
          </div>

          <Field
            label="Citation label"
            value={form.citationLabel}
            onChange={(value) => onChange("citationLabel", value)}
            placeholder="Morra Imas & Rist, 2009"
            help="This short label appears in source cards and citation diagnostics."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
                Source type
              </span>

              <select
                value={form.sourceType}
                onChange={(event) => onChange("sourceType", event.target.value)}
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
              >
                <option value="book">Book</option>
                <option value="manual">Manual</option>
                <option value="guide">Guide</option>
                <option value="report">Report</option>
                <option value="web">Web</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
                Metadata status
              </span>

              <select
                value={form.metadataStatus}
                onChange={(event) =>
                  onChange("metadataStatus", event.target.value)
                }
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
              >
                <option value="auto">Auto</option>
                <option value="needs_review">Needs review</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </label>
          </div>

          <label>
            <span className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
              Metadata notes
            </span>

            <textarea
              value={form.metadataNotes}
              onChange={(event) => onChange("metadataNotes", event.target.value)}
              rows={4}
              placeholder="Example: Corrected manually from the book cover/title page."
              className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
            />
          </label>

          <div className="flex flex-col gap-3 border-t border-[var(--app-border)] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[var(--app-border)] px-5 py-3 text-sm font-semibold text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-2xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:text-[#052033]"
            >
              {status === "loading" ? "Saving..." : "Save metadata"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SuggestionItem({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
      <p className="text-xs font-semibold text-[var(--app-muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--app-text)]">
        {value || "—"}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  help = "",
  type = "text"
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-[var(--app-text)]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-text)] outline-none"
      />

      {help && (
        <span className="mt-1 block text-xs text-[var(--app-muted)]">
          {help}
        </span>
      )}
    </label>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-sky-soft)] text-[var(--brand-blue)]">
        {icon}
      </div>

      <p className="text-sm text-[var(--app-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--app-text)]">{value}</p>
    </div>
  );
}

function formatMetadataStatus(status = "auto") {
  if (status === "needs_review") {
    return "Needs review";
  }

  if (status === "reviewed") {
    return "Reviewed";
  }

  return "Auto";
}

function formatFileSize(size = 0) {
  if (!size) return "—";

  const mb = size / (1024 * 1024);

  if (mb < 1) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${mb.toFixed(1)} MB`;
}