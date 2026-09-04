const ACCESS_TOKEN_KEY = "gym4me.accessToken";
const REFRESH_TOKEN_KEY = "gym4me.refreshToken";

type AsyncTokenPersistence = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

let asyncPersistence: AsyncTokenPersistence | undefined;
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export async function configureTokenPersistence(
  persistence: AsyncTokenPersistence,
): Promise<void> {
  asyncPersistence = persistence;
  const [secureAccess, secureRefresh] = await Promise.all([
    persistence.getItem(ACCESS_TOKEN_KEY),
    persistence.getItem(REFRESH_TOKEN_KEY),
  ]);
  const legacyAccess = canUseStorage()
    ? (window.localStorage.getItem(ACCESS_TOKEN_KEY) ??
      window.sessionStorage.getItem(ACCESS_TOKEN_KEY))
    : null;
  const legacyRefresh = canUseStorage()
    ? (window.localStorage.getItem(REFRESH_TOKEN_KEY) ??
      window.sessionStorage.getItem(REFRESH_TOKEN_KEY))
    : null;
  memoryAccessToken = secureAccess ?? legacyAccess;
  memoryRefreshToken = secureRefresh ?? legacyRefresh;
  if (!secureAccess && legacyAccess) {
    await persistence.setItem(ACCESS_TOKEN_KEY, legacyAccess);
  }
  if (!secureRefresh && legacyRefresh) {
    await persistence.setItem(REFRESH_TOKEN_KEY, legacyRefresh);
  }
  if (canUseStorage()) {
    clearSession(window.localStorage);
    clearSession(window.sessionStorage);
  }
}

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
    if (asyncPersistence) return memoryAccessToken;
    if (!canUseStorage()) {
      return null;
    }

    return (
      window.localStorage.getItem(ACCESS_TOKEN_KEY) ??
      window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
    );
  },
  set(token: string): void {
    if (asyncPersistence) {
      memoryAccessToken = token;
      void asyncPersistence.setItem(ACCESS_TOKEN_KEY, token);
      return;
    }
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  getRefresh(): string | null {
    if (asyncPersistence) return memoryRefreshToken;
    if (!canUseStorage()) {
      return null;
    }

    return (
      window.localStorage.getItem(REFRESH_TOKEN_KEY) ??
      window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
    );
  },
  setRefresh(token: string): void {
    if (asyncPersistence) {
      memoryRefreshToken = token;
      void asyncPersistence.setItem(REFRESH_TOKEN_KEY, token);
      return;
    }
    if (!canUseStorage()) {
      return;
    }

    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  setSession(accessToken: string, refreshToken: string, persist = true): void {
    if (asyncPersistence) {
      memoryAccessToken = accessToken;
      memoryRefreshToken = refreshToken;
      void Promise.all([
        asyncPersistence.setItem(ACCESS_TOKEN_KEY, accessToken),
        asyncPersistence.setItem(REFRESH_TOKEN_KEY, refreshToken),
      ]);
      return;
    }
    if (!canUseStorage()) {
      return;
    }

    const primary = persist ? window.localStorage : window.sessionStorage;
    const secondary = persist ? window.sessionStorage : window.localStorage;

    clearSession(secondary);
    writeSession(primary, accessToken, refreshToken);
  },
  clear(): void {
    if (asyncPersistence) {
      memoryAccessToken = null;
      memoryRefreshToken = null;
      void Promise.all([
        asyncPersistence.removeItem(ACCESS_TOKEN_KEY),
        asyncPersistence.removeItem(REFRESH_TOKEN_KEY),
      ]);
      return;
    }
    if (!canUseStorage()) {
      return;
    }

    clearSession(window.localStorage);
    clearSession(window.sessionStorage);
  },
};
