import { MAX_CACHED_SCANS } from "../constants.js";
import type { CachedScan, ScanCache } from "../tools/contracts.js";

export const createScanCache = (maxEntries: number = MAX_CACHED_SCANS): ScanCache => {
  const entries = new Map<string, CachedScan>();
  return {
    get(directory) {
      const cached = entries.get(directory);
      if (cached !== undefined) {
        entries.delete(directory);
        entries.set(directory, cached);
      }
      return cached;
    },
    set(directory, cached) {
      entries.delete(directory);
      entries.set(directory, cached);
      if (entries.size > maxEntries) {
        const oldestKey = entries.keys().next().value;
        if (oldestKey !== undefined) entries.delete(oldestKey);
      }
    },
    size() {
      return entries.size;
    },
  };
};
