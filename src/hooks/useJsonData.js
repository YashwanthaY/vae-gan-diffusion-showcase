import { useState, useEffect } from 'react';

/**
 * Pure fetcher with pending fallback.
 * Emits console.warn on error/missing file and returns { data: null, pending: true }.
 */
export async function fetchJsonWithFallback(url) {
  if (!url) return { data: null, pending: true };
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    const data = await res.json();
    return { data, pending: false };
  } catch (err) {
    console.warn(`[useJsonData] pending — ${url}:`, err.message);
    return { data: null, pending: true };
  }
}

/**
 * Fetch a JSON file from `url`.
 * Returns { data, loading, pending }.
 * If the file is missing (4xx/5xx) or the network is unreachable:
 *   - pending = true, data = null, loading = false
 *   - A console.warn is emitted (never an uncaught error to the client).
 */
export default function useJsonData(url) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setPending(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPending(false);
    setData(null);

    fetchJsonWithFallback(url).then(({ data: json, pending: isPending }) => {
      if (!cancelled) {
        setData(json);
        setPending(isPending);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, pending };
}
