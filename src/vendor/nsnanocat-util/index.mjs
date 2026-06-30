const root = globalThis;

const levels = {
    OFF: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
};

function normalizeLevel(level) {
    if (typeof level === "number") return level;
    return levels[String(level ?? "INFO").toUpperCase()] ?? levels.INFO;
}

function formatArgs(args) {
    return args.map(value => (typeof value === "string" ? value : JSON.stringify(value))).join(" ");
}

export const Console = {
    logLevel: "INFO",
    log(...args) {
        console.log(formatArgs(args));
    },
    debug(...args) {
        if (normalizeLevel(this.logLevel) >= levels.DEBUG) console.log(formatArgs(args));
    },
    info(...args) {
        if (normalizeLevel(this.logLevel) >= levels.INFO) console.log(formatArgs(args));
    },
    warn(...args) {
        if (normalizeLevel(this.logLevel) >= levels.WARN) console.warn(formatArgs(args));
    },
    error(...args) {
        if (normalizeLevel(this.logLevel) >= levels.ERROR) console.error(formatArgs(args));
    },
};

function pathParts(path) {
    if (Array.isArray(path)) return path;
    return String(path)
        .replace(/\[(\d+)\]/g, ".$1")
        .split(".")
        .filter(Boolean);
}

export const Lodash = {
    get(object, path, defaultValue = undefined) {
        let cursor = object;
        for (const part of pathParts(path)) {
            if (cursor == null) return defaultValue;
            cursor = cursor[part];
        }
        return cursor === undefined ? defaultValue : cursor;
    },
    set(object, path, value) {
        const parts = pathParts(path);
        let cursor = object;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (cursor[part] == null || typeof cursor[part] !== "object") cursor[part] = {};
            cursor = cursor[part];
        }
        cursor[parts[parts.length - 1]] = value;
        return object;
    },
};

function parseStored(value) {
    if (value == null) return undefined;
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

function stringifyStored(value) {
    return typeof value === "string" ? value : JSON.stringify(value);
}

export const Storage = {
    getItem(key) {
        if (root.$persistentStore?.read) return parseStored(root.$persistentStore.read(key));
        if (root.$prefs?.valueForKey) return parseStored(root.$prefs.valueForKey(key));
        if (root.localStorage?.getItem) return parseStored(root.localStorage.getItem(key));
        return undefined;
    },
    setItem(key, value) {
        const stored = stringifyStored(value);
        if (root.$persistentStore?.write) return root.$persistentStore.write(stored, key);
        if (root.$prefs?.setValueForKey) return root.$prefs.setValueForKey(stored, key);
        if (root.localStorage?.setItem) {
            root.localStorage.setItem(key, stored);
            return true;
        }
        return false;
    },
};

export const $app = detectApp();

function detectApp() {
    const env = root.$environment;
    if (env?.["quantumult-x"]) return "Quantumult X";
    if (env?.["surge-version"] || env?.surge) return "Surge";
    if (env?.["stash-version"] || env?.stash) return "Stash";
    if (env?.["loon-version"] || env?.loon) return "Loon";
    if (env?.egern) return "Egern";
    if (root.$task && root.$prefs) return "Quantumult X";
    if (root.$persistentStore && root.$httpClient) return "Surge";
    return "Node";
}

export function done(value = {}) {
    if (typeof root.$done === "function") return root.$done(value);
    return value;
}

function normalizeHeaders(headers) {
    if (!headers) return {};
    if (typeof headers.entries === "function") return Object.fromEntries(headers.entries());
    return headers;
}

function normalizeRequest(request) {
    if (typeof request === "string") return { url: request };
    return request ?? {};
}

export async function fetch(request) {
    const normalized = normalizeRequest(request);
    const url = normalized.url ?? normalized.href;
    const method = normalized.method ?? "GET";
    const headers = normalized.headers ?? {};
    const body = normalized.body;

    if (root.$task?.fetch) {
        return root.$task.fetch({ ...normalized, url, method, headers, body });
    }

    if (root.$httpClient) {
        return new Promise((resolve, reject) => {
            const client = method.toUpperCase() === "GET" ? root.$httpClient.get : root.$httpClient.post;
            client.call(root.$httpClient, { ...normalized, url, method, headers, body }, (error, response, data) => {
                if (error) reject(error);
                else resolve({ ...response, body: data, headers: response?.headers ?? {} });
            });
        });
    }

    if (typeof root.fetch === "function") {
        const response = await root.fetch(url, { method, headers, body });
        const responseBody = await response.text();
        return {
            status: response.status,
            statusCode: response.status,
            headers: normalizeHeaders(response.headers),
            body: responseBody,
        };
    }

    throw new Error("No fetch implementation is available in this runtime.");
}

export const time = {
    now() {
        return Date.now();
    },
};
