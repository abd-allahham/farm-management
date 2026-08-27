export function NeedsConfigPage() {
  return (
    <div className="grid min-h-svh place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-lg font-semibold text-slate-900">Firebase isn't configured yet</h1>
        <p className="mt-2 text-sm text-slate-500">
          Copy <code className="rounded bg-slate-100 px-1 py-0.5">web/.env.example</code> to{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5">web/.env</code> and fill in your
          Firebase project's config values (Project settings → General → Your apps), then restart
          the dev server.
        </p>
      </div>
    </div>
  );
}
