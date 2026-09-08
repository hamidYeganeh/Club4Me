const WELCOME_SEEN_KEY = "gym4me.welcome.seen";

export const WELCOME_PATH = "/welcome";
export const POST_WELCOME_PATH = "/discovery";
export const AUTH_PATH = "/auth";

export function hasSeenWelcome(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(WELCOME_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeSeen(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
  } catch {
    // Ignore quota / private-mode failures; routing still works for this session.
  }
}

export function isWelcomePath(pathname: string): boolean {
  return pathname === WELCOME_PATH || pathname.startsWith(`${WELCOME_PATH}/`);
}

export function isAuthPath(pathname: string): boolean {
  return pathname === AUTH_PATH || pathname.startsWith(`${AUTH_PATH}/`);
}

export function isRolePath(pathname: string): boolean {
  return (
    pathname === "/athlete" ||
    pathname.startsWith("/athlete/") ||
    pathname === "/coach" ||
    pathname.startsWith("/coach/")
  );
}

export function getAppRouteRedirect(
  pathname: string,
  { welcomeSeen, isAuthed }: { welcomeSeen: boolean; isAuthed: boolean },
): string | null {
  if (pathname === "/") {
    return welcomeSeen || isAuthed ? POST_WELCOME_PATH : WELCOME_PATH;
  }

  if (isWelcomePath(pathname)) {
    return welcomeSeen || isAuthed ? POST_WELCOME_PATH : null;
  }

  if (isAuthPath(pathname) || isRolePath(pathname)) {
    return null;
  }

  return null;
}
