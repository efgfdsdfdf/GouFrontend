const KEY_ACCESS_TOKEN = "access_token";
const KEY_REFRESH_TOKEN = "refresh_token";
const KEY_USER_DATA = "user_data";
const KEY_USER_ID = "user_id";
const safeGet = (storage, key) => {
    try {
        return storage.getItem(key);
    }
    catch {
        return null;
    }
};
const safeSet = (storage, key, value) => {
    try {
        storage.setItem(key, value);
    }
    catch {
        // Ignore write failures in restricted contexts.
    }
};
const safeRemove = (storage, key) => {
    try {
        storage.removeItem(key);
    }
    catch {
        // Ignore remove failures in restricted contexts.
    }
};
export const authStorage = {
    migrateLegacySessionToLocal: () => {
        if (typeof window === "undefined")
            return;
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
    getItem: (key) => {
        if (typeof window === "undefined")
            return null;
        const localValue = safeGet(localStorage, key);
        if (localValue)
            return localValue;
        return safeGet(sessionStorage, key);
    },
    setItem: (key, value) => {
        if (typeof window === "undefined")
            return;
        safeSet(localStorage, key, value);
        safeSet(sessionStorage, key, value);
    },
    removeItem: (key) => {
        if (typeof window === "undefined")
            return;
        safeRemove(localStorage, key);
        safeRemove(sessionStorage, key);
    },
    clearAuth: () => {
        authStorage.removeItem(KEY_ACCESS_TOKEN);
        authStorage.removeItem(KEY_REFRESH_TOKEN);
        authStorage.removeItem(KEY_USER_DATA);
        authStorage.removeItem(KEY_USER_ID);
    },
};
