// Validates a redirect-target path pulled from a query string before it's
// ever handed to router.push()/NextResponse.redirect(). A bare "starts with
// /" check isn't enough — "//evil.com" and "/\evil.com" (browsers normalize
// a leading backslash to a slash) are both browser-relative-looking strings
// that actually navigate off-site, and "@evil.com/x" appended after an
// origin becomes a valid URL whose host is evil.com (URL userinfo syntax).
// Requiring a single leading "/" not followed by "/" or "\" blocks all of
// those while still allowing every real in-app path.
const SAFE_PATH_RE = /^\/(?!\/|\\)/;

export function safeRedirectPath(path: string | null | undefined, fallback = '/dashboard'): string {
  if (!path) return fallback;
  return SAFE_PATH_RE.test(path) ? path : fallback;
}
