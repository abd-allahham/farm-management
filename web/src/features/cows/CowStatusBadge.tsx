import type { CowStatus } from './types';

// Active is the normal/default case — only the exception (slaughtered)
// gets a badge, so it doesn't clutter every row with a chip that's always
// the same.
export function CowStatusBadge({ status }: { status: CowStatus }) {
  if (status !== 'slaughtered') return null;

  return (
    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      Slaughtered
    </span>
  );
}
