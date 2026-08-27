import { useAuth } from '../auth/AuthContext';

export function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-svh bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <span className="text-sm font-semibold text-slate-900">Farm Management</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{user?.displayName ?? user?.email}</span>
          <button
            onClick={() => void signOut()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">
          Signed in as <span className="font-medium text-slate-700">{user?.email}</span>. Yards,
          cows and vaccines management land in the next milestones.
        </p>
      </main>
    </div>
  );
}
