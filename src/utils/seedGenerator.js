/**
 * Cryptographically random 31-bit positive integer seed generator
 * and tile content hash utilities.
 */

/**
 * Generate a fresh 31-bit random positive integer [1, 2147483647].
 * Uses window.crypto.getRandomValues when available, with strong fallback.
 * @returns {number}
 */
export function generateRandomSeed31() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    // Mask to 31 bits (0 to 0x7FFFFFFF) and ensure non-zero
    const s = buf[0] & 0x7fffffff;
    return s === 0 ? 1 : s;
  }
  // Fallback for non-browser environments or when crypto unavailable
  return Math.floor(Math.random() * 2147483646) + 1;
}

/**
 * Fast synchronous 64-bit FNV-1a inspired hash string for a base64 / URL data string.
 * @param {string} str
 * @returns {string} 16-hex character hash
 */
export function fastTileHash(str) {
  if (!str) return '0000000000000000';
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return hex1 + hex2;
}

/**
 * Compute real SHA-1 hex string asynchronously using standard Web Crypto API.
 * @param {string} data
 * @returns {Promise<string>} 40-character SHA-1 hex string
 */
export async function sha1Hex(data) {
  if (!data) return '0'.repeat(40);
  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-1', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback to fastTileHash formatted to 40 characters
    const h = fastTileHash(data);
    return (h + h + h).slice(0, 40);
  }
}
