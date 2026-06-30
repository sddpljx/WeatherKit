import { Storage } from "@nsnanocat/util";
import AirQuality from "../class/AirQuality.mjs";

const WEATHERKIT_CACHES_KEY = "@iRingo.WeatherKit.Caches";

export function getCachedAirQualityScaleVersion(Caches) {
    return Caches?.airQuality?.scaleVersion;
}

export function getAirQualityScaleVersionFromRequest($request) {
    const headers = $request?.headers;
    if (!headers || typeof headers !== "object") return undefined;

    const headerValues = Object.entries(headers).map(([key, value]) => `${key}: ${value}`);
    for (const headerValue of headerValues) {
        const scaleVersion = headerValue.match(/\b(?:scale[-_]?version|weatherkit[-_]?version)\D*(?<scaleVersion>\d{4})\b/i)?.groups?.scaleVersion;
        if (scaleVersion) return scaleVersion;
    }

    return undefined;
}

export function cacheAirQualityScaleVersion(Caches = {}, scale) {
    if (!scale) return undefined;

    const scaleVersion = AirQuality.GetVersionFromScale(scale);
    if (!scaleVersion) return undefined;

    Caches.airQuality = {
        ...Caches.airQuality,
        scaleVersion,
    };
    Storage.setItem(WEATHERKIT_CACHES_KEY, { ...Caches, airQuality: Caches.airQuality });
    return scaleVersion;
}
