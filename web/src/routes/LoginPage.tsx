import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useInstallPrompt } from '../lib/useInstallPrompt';
import { useIsStandalone } from '../lib/useIsStandalone';

export function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const { canPromptInstall, promptInstall, waitForInstallable } = useInstallPrompt();
  const isStandalone = useIsStandalone();
  const [error, setError] = useState<string | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [checkingInstall, setCheckingInstall] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError('Sign-in failed. Please try again.');
    }
  };

  const handleInstall = async () => {
    setShowInstallHelp(false);
    if (canPromptInstall) {
      await promptInstall();
      return;
    }
    // The install-eligibility check can still be running when the page has
    // just loaded — give it a moment before concluding it's unsupported.
    setCheckingInstall(true);
    const becameAvailable = await waitForInstallable();
    setCheckingInstall(false);
    if (becameAvailable) {
      await promptInstall();
    } else {
      setShowInstallHelp(true);
    }
  };

  return (
    <div className="grid min-h-svh place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-green-700" aria-hidden />
        <h1 className="text-xl font-semibold text-slate-900">Farm Management</h1>
        <p className="mt-1 text-sm text-slate-500">Cattle & vaccination tracking</p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleSignIn}
            className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800"
          >
            {isStandalone ? 'Login' : 'Continue in browser'}
          </button>
          {!isStandalone && (
            <button
              onClick={handleInstall}
              disabled={checkingInstall}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingInstall ? 'Checking…' : 'Download the app'}
            </button>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {!isStandalone && showInstallHelp && (
          <p className="mt-4 text-left text-xs text-slate-500">
            Your browser doesn't support one-tap install. On iPhone/iPad: tap the Share icon in
            Safari, then "Add to Home Screen". On Android/desktop Chrome: open the browser menu
            and choose "Install app".
          </p>
        )}
      </div>
    </div>
  );
}
