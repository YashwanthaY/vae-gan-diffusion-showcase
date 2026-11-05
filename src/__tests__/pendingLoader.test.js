/**
 * Unit tests for useJsonData / fetchJsonWithFallback "pending" behaviour.
 * Verifies pending=true and warning without uncaught exceptions on missing file or network failure.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchJsonWithFallback } from '../hooks/useJsonData.js';

describe('fetchJsonWithFallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sets pending=true when server returns 404', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404 }));
    
    const res = await fetchJsonWithFallback('/data/json/missing.json');
    expect(res.pending).toBe(true);
    expect(res.data).toBe(null);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useJsonData] pending'),
      expect.stringContaining('HTTP 404')
    );
  });

  it('sets pending=true when fetch throws (network offline)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    const res = await fetchJsonWithFallback('/data/json/missing.json');
    expect(res.pending).toBe(true);
    expect(res.data).toBe(null);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useJsonData] pending'),
      expect.stringContaining('Network error')
    );
  });

  it('returns data when fetch succeeds', async () => {
    const mockData = { fid: { mean: 11.32 } };
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockData) }));

    const res = await fetchJsonWithFallback('/data/json/prdc.json');
    expect(res.pending).toBe(false);
    expect(res.data).toEqual(mockData);
  });

  it('returns pending=true immediately for null url', async () => {
    const res = await fetchJsonWithFallback(null);
    expect(res.pending).toBe(true);
    expect(res.data).toBe(null);
  });
});
