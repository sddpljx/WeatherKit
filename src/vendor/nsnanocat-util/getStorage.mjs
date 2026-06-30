import { Lodash as _, Storage } from "./index.mjs";

function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
}

function merge(target, source) {
    if (!source || typeof source !== "object") return target;
    for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) target[key] = {};
            merge(target[key], value);
        } else {
            target[key] = value;
        }
    }
    return target;
}

function coerce(value, currentValue) {
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;
    if (value === "") return value;
    if ((value.startsWith("[") && value.endsWith("]")) || (value.startsWith("{") && value.endsWith("}"))) {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
    if (Array.isArray(currentValue)) return value.split(",").filter(Boolean);
    if (typeof currentValue === "number" && !Number.isNaN(Number(value))) return Number(value);
    return value;
}

function parseArguments(settings) {
    const argument = globalThis.$argument;
    if (!argument || typeof argument !== "string") return {};

    const result = {};
    const params = new URLSearchParams(argument);
    for (const [key, rawValue] of params.entries()) {
        const currentValue = _.get(settings, key);
        _.set(result, key, coerce(rawValue, currentValue));
    }
    return result;
}

export default function getStorage(name, platforms, database = {}) {
    const platformList = Array.isArray(platforms) ? platforms : [platforms];
    const Settings = {};
    const Caches = {};
    const Configs = {};

    merge(Settings, clone(database.Default?.Settings));
    merge(Caches, clone(database.Default?.Caches));
    merge(Configs, clone(database.Default?.Configs));

    for (const platform of platformList) {
        merge(Settings, clone(database[platform]?.Settings));
        merge(Caches, clone(database[platform]?.Caches));
        merge(Configs, clone(database[platform]?.Configs));
    }

    const storagePrefix = `@${name}.${platformList[0]}`;
    merge(Settings, Storage.getItem(`${storagePrefix}.Settings`));
    merge(Caches, Storage.getItem(`${storagePrefix}.Caches`));
    merge(Configs, Storage.getItem(`${storagePrefix}.Configs`));
    merge(Settings, parseArguments(Settings));

    return { Settings, Caches, Configs };
}
