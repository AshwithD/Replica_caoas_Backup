export default function Pagination({ currentPage, totalPages, pageSize, totalCount, onPageChange, noun = "items" }) {
  if (!totalPages || totalPages <= 1) return null;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 text-xs"
      style={{ borderTop: "1px solid var(--border-3)", color: "var(--text-muted)" }}
    >
      <span>
        {start}-{end} of {totalCount} {noun}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-md px-2 py-1 disabled:opacity-40"
          style={{ border: "1px solid var(--border-3)" }}
        >
          Prev
        </button>
        <span>
          {currentPage} / {totalPages}
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-md px-2 py-1 disabled:opacity-40"
          style={{ border: "1px solid var(--border-3)" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
