/**
 * Per-setlist song keys chosen by the person practising.
 *
 * A song's library default key never controls what a setlist shows: once a key is
 * picked for a setlist item it stays on that item. The choice is written to the
 * setlist row when the user may edit it, and always mirrored to this device so the
 * key is instant, survives reloads, and works offline (and for view-only users).
 */

const prefix = "setlist-key";
const keyOf = (setlistId: string, itemId: string) => `${prefix}-${setlistId}-${itemId}`;

export function getLocalSetlistKey(setlistId: string, itemId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(keyOf(setlistId, itemId));
  } catch {
    return null;
  }
}

export function setLocalSetlistKey(setlistId: string, itemId: string, key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyOf(setlistId, itemId), key);
    window.dispatchEvent(new CustomEvent("setlist-key-change", { detail: { setlistId, itemId, key } }));
  } catch {
    /* storage full or blocked — the server value still applies */
  }
}

/** Resolves the key to display for a setlist item: user choice wins over the library default. */
export function resolveSetlistKey(
  setlistId: string,
  itemId: string,
  storedKey?: string | null,
  defaultKey?: string | null,
): string {
  return getLocalSetlistKey(setlistId, itemId) || storedKey || defaultKey || "C";
}
