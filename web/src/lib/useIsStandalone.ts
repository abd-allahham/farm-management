import { useEffect, useState } from 'react';

// True when the app is running as the installed PWA rather than in a
// regular browser tab: `display-mode: standalone` covers Chrome/Edge/Android,
// `navigator.standalone` covers Safari/iOS which doesn't support that media
// query.
function detectStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone === true;
}

export function useIsStandalone() {
  const [isStandalone, setIsStandalone] = useState(detectStandalone);

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)');
    const onChange = () => setIsStandalone(detectStandalone());
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isStandalone;
}
