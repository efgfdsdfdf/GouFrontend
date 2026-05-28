const KEY_ACCESS_TOKEN = "access_token";
const KEY_REFRESH_TOKEN = "refresh_token";
const KEY_USER_DATA = "user_data";
const KEY_USER_ID = "user_id";
const KEY_SESSION_LOCKED = "session_locked";

const safeGet = (storage: Storage, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (storage: Storage, key: string, value: string): void => {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore write failures in restricted contexts.
  }
};

const safeRemove = (storage: Storage, key: string): void => {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore remove failures in restricted contexts.
  }
};

export const authStorage = {
  migrateLegacySessionToLocal: () => {
    if (typeof window === "undefined") return;

    const keys = [KEY_ACCESS_TOKEN, KEY_REFRESH_TOKEN, KEY_USER_DATA, KEY_USER_ID];
    for (const key of keys) {
      const localValue = safeGet(localStorage, key);
      if (!localValue) {
        const sessionValue = safeGet(sessionStorage, key);
        if (sessionValue) {
          safeSet(localStorage, key, sessionValue);
        }
      }
      safeRemove(sessionStorage, key);
    }
  },
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    const localValue = safeGet(localStorage, key);
    if (localValue) return localValue;
    return safeGet(sessionStorage, key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    safeSet(localStorage, key, value);
    safeSet(sessionStorage, key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    safeRemove(localStorage, key);
    safeRemove(sessionStorage, key);
  },
  clearAuth: (): void => {
    authStorage.removeItem(KEY_ACCESS_TOKEN);
    authStorage.removeItem(KEY_REFRESH_TOKEN);
    authStorage.removeItem(KEY_USER_DATA);
    authStorage.removeItem(KEY_USER_ID);
    authStorage.removeItem(KEY_SESSION_LOCKED);
  },
};

