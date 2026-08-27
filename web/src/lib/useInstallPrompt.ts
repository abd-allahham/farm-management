import { useEffect, useRef, useState } from 'react';

// Chrome/Edge/Android fire `beforeinstallprompt` and let us trigger the
// native install dialog programmatically. Safari (iOS/macOS) never fires
// this event — there, "install" means the user's own Share > Add to Home
// Screen action, so callers should fall back to instructions.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  // Resolvers waiting on waitForInstallable(), notified as soon as the
  // event lands so a pending click doesn't have to poll.
  const waitersRef = useRef<Array<() => void>>([]);
  const [canPromptInstall, setCanPromptInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      setCanPromptInstall(true);
      waitersRef.current.forEach((resolve) => resolve());
      waitersRef.current = [];
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    const evt = deferredRef.current;
    if (!evt) return false;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    deferredRef.current = null;
    setCanPromptInstall(false);
    return outcome === 'accepted';
  };

  // Chrome evaluates installability (service worker activation, manifest
  // checks) asynchronously after the page loads, so `beforeinstallprompt`
  // can arrive a beat after our first render. Rather than telling the user
  // their browser is unsupported the instant they click, wait briefly in
  // case the event is just about to land — this is what fixes the "works
  // on the second click" issue.
  const waitForInstallable = (timeoutMs = 1500): Promise<boolean> => {
    if (deferredRef.current) return Promise.resolve(true);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeoutMs);
      waitersRef.current.push(() => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  };

  return { canPromptInstall, promptInstall, waitForInstallable };
}
