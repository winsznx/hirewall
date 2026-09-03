import { CopyButton } from "./CopyButton";

export function HashValue({
  value,
  label,
  full,
}: {
  value: string;
  label: string;
  full?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-canvas px-2 py-0.5 font-mono text-[12px] text-ink">
      <span aria-label={full ? `${label}: ${full}` : undefined}>{value}</span>
      <CopyButton value={full ?? value} label={label} />
    </span>
  );
}
