const ACCESS_TOKEN_KEY = "club4me.accessToken";
const REFRESH_TOKEN_KEY = "club4me.refreshToken";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export const tokenStore = {
  get(): string | null {
    if (!canUseStorage()) {
      return null;
    }

    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
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

    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setRefresh(token: string): void {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  setSession(accessToken: string, refreshToken: string): void {
    this.set(accessToken);
    this.setRefresh(refreshToken);
  },
  clear(): void {
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
