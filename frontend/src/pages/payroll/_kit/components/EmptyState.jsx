export default function EmptyState({ emoji = "📭", message = "Nothing here yet." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <span style={{ fontSize: 32 }}>{emoji}</span>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
    </div>
  );
}
