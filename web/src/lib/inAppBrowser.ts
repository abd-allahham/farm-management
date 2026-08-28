// Embedded WebView browsers (opening a link from inside another app) are
// well known to break Google's OAuth sign-in flow — they restrict
// sessionStorage/cookies in ways that break Firebase Auth's popup/redirect
// state tracking. That's exactly what "missing initial state" errors mean:
// not a bug in this app, a platform limitation of the embedding app's
// browser. Detect it so LoginPage can warn before the user even tries.
const IN_APP_BROWSER_PATTERNS = [
  /FBAN|FBAV/i, // Facebook
  /Instagram/i,
  /\bWhatsApp\b/i,
  /\bLine\//i,
  /MicroMessenger/i, // WeChat
  /TikTok|musical_ly/i,
  /Twitter/i,
  /Snapchat/i,
];

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return IN_APP_BROWSER_PATTERNS.some((pattern) => pattern.test(navigator.userAgent));
}

// Firebase throws this specific error inside restricted-storage
// environments — in-app browsers being the overwhelmingly common case, even
// when the user-agent sniffing above doesn't catch a particular app/version.
export function isMissingInitialStateError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'string' && code.includes('missing-initial-state')) return true;
  const message = (err as { message?: unknown }).message;
  return typeof message === 'string' && message.includes('missing initial state');
}
