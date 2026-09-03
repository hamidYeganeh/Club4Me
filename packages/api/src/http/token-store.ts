const ACCESS_TOKEN_KEY = "club4me.accessToken";
const REFRESH_TOKEN_KEY = "club4me.refreshToken";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function writeSession(
  storage: Storage,
  accessToken: string,
  refreshToken: string,
): void {
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearSession(storage: Storage): void {
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}

export const tokenStore = {
  get(): string | null {
    if (!canUseStorage()) {
      return null;
    }

    return (
      window.localStorage.getItem(ACCESS_TOKEN_KEY) ??
      window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
    );
  },
  set(token: string): void {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  getRefresh(): string | null {
    if (!canUseStorage()) {
      return null;
    }

    return (
      window.localStorage.getItem(REFRESH_TOKEN_KEY) ??
      window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
    );
  },
  setRefresh(token: string): void {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  setSession(
    accessToken: string,
    refreshToken: string,
    persist = true,
  ): void {
    if (!canUseStorage()) {
      return;
    }

    const primary = persist ? window.localStorage : window.sessionStorage;
    const secondary = persist ? window.sessionStorage : window.localStorage;

    clearSession(secondary);
    writeSession(primary, accessToken, refreshToken);
  },
  clear(): void {
    if (!canUseStorage()) {
      return;
    }

    clearSession(window.localStorage);
    clearSession(window.sessionStorage);
  },
};
