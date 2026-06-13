/**
 * Save integrity tag: a lightweight, dependency-free fingerprint over the save
 * payload, so a save edited outside the game (localStorage tweak, hand-edited
 * export file) no longer matches and is rejected.
 *
 * HONEST SCOPE: this is a speed bump, not real security. The game is 100%
 * front-end and open source, so the salt and this very function ship in the
 * bundle: a determined player can re-sign a tampered save, and editing the live
 * in-memory state (devtools) is out of reach of any save-level check. The goal is
 * only to discourage casual cheating (the easy, common vector), not to be
 * tamper-proof. See docs/ARCHITECTURE.md section 9.
 */

/** cyrb53: a fast, well-distributed 53-bit non-cryptographic string hash. */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/** Baked-in pepper mixed into the fingerprint (not a secret: it ships in the bundle). */
const SALT = 'bbc::entropy-favours-the-prepared::1138'

/** Fingerprint of a payload, as a compact alphanumeric string. */
export function sign(payload: string): string {
  return cyrb53(SALT + payload, payload.length).toString(36)
}
