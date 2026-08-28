import type { CowStatus } from './types';

// Always shown (not just for the "unusual" state) so a cow's status is
// explicit at a glance rather than implied by the absence of a badge.
export function CowStatusBadge({ status }: { status: CowStatus }) {
  if (status === 'slaughtered') {
    return (
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
        Slaughtered
      </span>
    );
  }
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
      Active
    </span>
  );
}
