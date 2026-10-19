// Tiny pub/sub event bus (on/off/emit). Built in Step 1.2.

/**
 * A listener receives the payload passed to `emit`.
 * @typedef {(payload: *) => void} Listener
 */

/**
 * @typedef {Object} Bus
 * @property {(event: string, fn: Listener) => Listener} on
 *   Subscribe `fn` to `event`; returns `fn`.
 * @property {(event: string, fn: Listener) => boolean} off
 *   Unsubscribe `fn`; returns true when a listener was removed.
 * @property {(event: string, payload?: *) => void} emit
 *   Call every listener of `event` with `payload`.
 */

/**
 * Create an independent event bus (Step 1.2).
 * `emit` iterates a snapshot of the listener list, so a listener may safely
 * `off` itself (or others) while an event is being delivered. A throwing
 * listener propagates its error to the caller of `emit`.
 * @returns {Bus}
 */
export function createBus() {
  /** @type {Map<string, Listener[]>} */
  const listeners = new Map();

  /**
   * Subscribe `fn` to `event`; the same fn is stored only once per event.
   * @param {string} event
   * @param {Listener} fn
   * @returns {Listener} fn, for convenience
   */
  function on(event, fn) {
    const list = listeners.get(event);
    if (list) {
      if (!list.includes(fn)) list.push(fn);
    } else {
      listeners.set(event, [fn]);
    }
    return fn;
  }

  /**
   * Unsubscribe `fn` from `event`; no-op when it was not subscribed.
   * @param {string} event
   * @param {Listener} fn
   * @returns {boolean} true when `fn` was subscribed and has been removed
   */
  function off(event, fn) {
    const list = listeners.get(event);
    if (!list) return false;
    const i = list.indexOf(fn);
    if (i === -1) return false;
    list.splice(i, 1);
    if (list.length === 0) listeners.delete(event);
    return true;
  }

  /**
   * Call all listeners of `event` in subscription order with `payload`.
   * @param {string} event
   * @param {*} [payload]
   * @returns {void}
   */
  function emit(event, payload) {
    const list = listeners.get(event);
    if (!list) return;
    for (const fn of list.slice()) fn(payload);
  }

  return { on, off, emit };
}

/** App-wide shared bus; `core/` modules emit app events on it. */
export const bus = createBus();
