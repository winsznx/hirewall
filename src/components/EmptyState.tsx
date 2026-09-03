export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10">
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? <p className="max-w-md text-sm text-ink-muted">{description}</p> : null}
      {action}
    </div>
  );
}
