// Defaults + settings load/save (localStorage, key isekai-space-cowboy.settings). Built in Step 1.2.

/**
 * localStorage key holding the settings JSON (02-SPECS §2).
 * @type {string}
 */
export const SETTINGS_KEY = "isekai-space-cowboy.settings";

/**
 * Distance presets (02-SPECS §3), in display order.
 * `floorS` is the minimum number of seconds any reply can take; the first
 * entry is the default.
 * @type {ReadonlyArray<{id: string, label: string, floorS: number}>}
 */
export const DISTANCES = [
  { id: "ftl", label: "Instant (FTL link)", floorS: 0 },
  { id: "inner", label: "Lunar orbit", floorS: 3 },
  { id: "mars", label: "Near Mars", floorS: 20 },
  { id: "belt", label: "Asteroid belt", floorS: 60 },
  { id: "outer", label: "Outer system", floorS: 180 },
];

/**
 * Default distance preset id: FTL (01-OVERVIEW "The wait system", 02-SPECS §3).
 * Note: the §2 example JSON shows `"distance": "inner"`, but §3's table and
 * 01-OVERVIEW explicitly mark `ftl` as the default decision; the decision wins.
 * @type {string}
 */
export const DEFAULT_DISTANCE = "ftl";

/**
 * Settings defaults, exactly per 02-SPECS §2.
 * @type {{
 *   userName: string,
 *   text: {baseUrl: string, apiKey: string, model: string, vision: boolean},
 *   image: {enabled: boolean, baseUrl: string, apiKey: string, model: string, size: string},
 *   tts: {enabled: boolean, baseUrl: string, apiKey: string, model: string, voice: string},
 *   video: {enabled: boolean, baseUrl: string, apiKey: string, model: string, seconds: number, size: string},
 *   distance: string,
 *   timeouts: {text: number, image: number, tts: number, video: number},
 * }}
 */
export const DEFAULT_SETTINGS = {
  userName: "Captain",
  text: { baseUrl: "", apiKey: "", model: "", vision: false },
  image: { enabled: false, baseUrl: "", apiKey: "", model: "", size: "512x512" },
  tts: { enabled: false, baseUrl: "", apiKey: "", model: "", voice: "" },
  video: { enabled: false, baseUrl: "", apiKey: "", model: "", seconds: 4, size: "512x512" },
  distance: DEFAULT_DISTANCE,
  timeouts: { text: 300, image: 300, tts: 120, video: 900 },
};

/**
 * Deep copy of a JSON-safe value (settings are plain data).
 * @template T
 * @param {T} value
 * @returns {T}
 */
function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

/**
 * Recursive overwrite merge: plain objects inside `dst` are merged key by key
 * with the matching objects in `src`; every other value (primitives, arrays)
 * from `src` wins as-is.
 * @param {Object} dst mutated
 * @param {Object} src
 * @returns {void}
 */
function mergeInto(dst, src) {
  for (const [key, value] of Object.entries(src)) {
    const current = dst[key];
    const srcIsPlainObject =
      value !== null && typeof value === "object" && !Array.isArray(value);
    const dstIsPlainObject =
      current !== null && typeof current === "object" && !Array.isArray(current);
    if (srcIsPlainObject && dstIsPlainObject) {
      mergeInto(current, value);
    } else {
      dst[key] = clone(value);
    }
  }
}

/**
 * Merge stored settings onto a fresh copy of {@link DEFAULT_SETTINGS}:
 * missing keys (including nested ones) get defaults, saved values win,
 * and unknown saved keys are kept untouched.
 * @param {*} saved parsed value from storage
 * @returns {Object} a complete settings object
 */
export function withDefaults(saved) {
  const out = clone(DEFAULT_SETTINGS);
  if (saved === null || typeof saved !== "object" || Array.isArray(saved)) {
    return out;
  }
  mergeInto(out, saved);
  return out;
}

/**
 * Load settings from storage; anything missing falls back to defaults.
 * No stored key or unparsable JSON both return plain defaults.
 * @param {Storage} [storage] injectable for tests; defaults to localStorage
 * @returns {Object} a fresh complete settings object
 */
export function loadSettings(storage = globalThis.localStorage) {
  let raw = null;
  try {
    raw = storage.getItem(SETTINGS_KEY);
  } catch (err) {
    console.warn("config: storage unreadable, using defaults", err);
    return clone(DEFAULT_SETTINGS);
  }
  if (raw === null) return clone(DEFAULT_SETTINGS);
  try {
    return withDefaults(JSON.parse(raw));
  } catch (err) {
    console.warn("config: stored settings are not valid JSON, using defaults", err);
    return clone(DEFAULT_SETTINGS);
  }
}

/**
 * Save settings as JSON under {@link SETTINGS_KEY}.
 * @param {Object} settings
 * @param {Storage} [storage] injectable for tests; defaults to localStorage
 * @returns {void}
 */
export function saveSettings(settings, storage = globalThis.localStorage) {
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * The name characters call the player; blank or whitespace falls back to
 * "Captain" (02-SPECS §2).
 * @param {Object} settings
 * @returns {string}
 */
export function effectiveUserName(settings) {
  const name = typeof settings.userName === "string" ? settings.userName.trim() : "";
  return name === "" ? "Captain" : name;
}

/**
 * Look up a distance preset by id (02-SPECS §3).
 * @param {string} id
 * @returns {{id: string, label: string, floorS: number}} the preset,
 *   or the default preset (`ftl`) when the id is unknown
 */
export function getDistance(id) {
  return DISTANCES.find((d) => d.id === id) ?? DISTANCES[0];
}
