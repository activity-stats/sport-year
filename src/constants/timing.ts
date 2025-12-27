/**
 * Timing constants for the application
 * Centralized timing values to avoid magic numbers
 */
export const TIMING = {
  // Download cleanup delay - time to wait before cleaning up download links
  DOWNLOAD_CLEANUP_DELAY_MS: 100,

  // Cache stale time - how long data is considered fresh (1 hour)
  CACHE_STALE_TIME_MS: 60 * 60 * 1000,

  // Cache garbage collection time - how long to keep unused data (24 hours)
  CACHE_GC_TIME_MS: 24 * 60 * 60 * 1000,

  // Retry delay - time to wait before retrying operations
  RETRY_DELAY_MS: 1000,
} as const;
