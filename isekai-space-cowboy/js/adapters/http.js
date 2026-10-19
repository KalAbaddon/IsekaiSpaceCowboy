// Fetch wrapper with AbortController timeout and typed errors:
// {kind: "timeout" | "http" | "network", status?, message}. Built in Step 1.3.
// (The "cors?" kind from 03-STEPS Step 1.3 is not separable: the browser reports a
// CORS-blocked fetch exactly like a connection failure, so those arrive as "network"
// and the message says so.)

/**
 * Error thrown by {@link request}. Distinguishes failure kinds per
 * 03-STEPS.md Step 1.3.
 * @typedef {Error & {kind: "timeout" | "http" | "network", status?: number}} HttpError
 */

/**
 * Build an {@link HttpError}.
 * @param {"timeout" | "http" | "network"} kind
 * @param {string} message human-readable, includes the original error text
 * @param {number} [status] HTTP status, only for kind "http"
 * @returns {HttpError}
 */
function makeError(kind, message, status) {
  const err = /** @type {HttpError} */ (new Error(message));
  err.kind = kind;
  if (status !== undefined) err.status = status;
  return err;
}

/**
 * Perform one HTTP request (the shared plumbing every adapter uses).
 * Headers are sent exactly as passed — the Authorization header is the caller's
 * job (omit it when no API key is set, per 02-SPECS §2/§4).
 * @param {string} url
 * @param {{
 *   method?: string,
 *   headers?: Record<string, string>,
 *   body?: BodyInit,
 *   timeoutS?: number,
 *   expect?: "json" | "blob",
 * }} [options] `timeoutS` is the hard deadline in seconds (0/omitted = none);
 *   `expect` selects the return type (default "json").
 * @returns {Promise<*>} parsed JSON or a Blob
 * @throws {HttpError} kind "timeout" when the deadline passes, kind "http" for
 *   non-2xx responses (with `.status`), kind "network" when the request never
 *   got an answer (connection refused, DNS failure, offline, or a CORS block —
 *   the browser cannot tell those apart, see README)
 */
export async function request(url, options = {}) {
  const {
    method = "GET",
    headers = {},
    body,
    timeoutS,
    expect = "json",
  } = options;

  const controller = new AbortController();
  let timer = null;
  if (typeof timeoutS === "number" && timeoutS > 0) {
    timer = setTimeout(() => controller.abort(), timeoutS * 1000);
  }

  try {
    let res;
    try {
      res = await fetch(url, { method, headers, body, signal: controller.signal });
    } catch (err) {
      // fetch() rejects before any HTTP status arrived: either we aborted at
      // the deadline, or the request never got an answer at all (which is also
      // how browsers report CORS and mixed-content blocks).
      if (controller.signal.aborted) {
        throw makeError("timeout", `no answer within ${timeoutS} s from ${url}`);
      }
      throw makeError(
        "network",
        `no connection to ${url} — refused, offline, or blocked by CORS: ${err}`
      );
    }

    if (!res.ok) {
      throw makeError("http", `HTTP ${res.status} ${res.statusText} from ${url}`, res.status);
    }

    return expect === "blob" ? await res.blob() : await res.json();
  } catch (err) {
    if (err && err.kind) throw err; // our own typed error — pass through untouched
    // The deadline passing mid-body-read aborts the stream and lands here too.
    if (controller.signal.aborted) {
      throw makeError("timeout", `link went dead mid-response from ${url}`);
    }
    // e.g. a 200 response that is not valid JSON when expect === "json"
    throw makeError("network", `unreadable response from ${url}: ${err}`);
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}
