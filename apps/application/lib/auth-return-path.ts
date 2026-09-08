import type { AccountUser } from "@api/account";
import { getPostAuthPath, SET_PASSWORD_PATH } from "./post-auth-path";

const KEY = "gym4me.auth.return";
const MAX_AGE = 30 * 60_000;

export function safeReturnPath(value: string | null): string | null {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value)
  )
    return null;
  const url = new URL(value, "https://app.invalid");
  if (
    url.origin !== "https://app.invalid" ||
    (/^\/(auth|welcome)(\/|$)/.test(url.pathname) &&
      !/^\/auth\/roles\/(coach|owner|requests)$/.test(url.pathname))
  )
    return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function rememberAuthReturnPath(path: string): void {
  const safe = safeReturnPath(path);
  if (!safe || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ path: safe, savedAt: Date.now() }),
    );
  } catch {
    /* Storage is optional. */
  }
}

export function completeAuthenticationPath(
  user: Pick<AccountUser, "hasPassword" | "roles">,
  defaultPath?: string,
): string {
  const postAuthPath = getPostAuthPath(user);
  const fallback =
    postAuthPath === SET_PASSWORD_PATH
      ? postAuthPath
      : (defaultPath ?? postAuthPath);
  if (fallback === SET_PASSWORD_PATH || typeof window === "undefined")
    return fallback;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(KEY) ?? "null");
    window.sessionStorage.removeItem(KEY);
    if (saved && Date.now() - saved.savedAt < MAX_AGE)
      return safeReturnPath(saved.path) ?? fallback;
  } catch {
    /* A corrupt/disabled store must not block login. */
  }
  return fallback;
}
