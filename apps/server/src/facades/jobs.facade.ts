import { randomUUID } from 'node:crypto';
import type { createJobsDal } from '../dals/jobs.dal.js';

/**
 * Builds persistent maintenance job processing with per-job leases so multiple workers can
 * cooperate.
 */
export function createJobsFacade(dal: ReturnType<typeof createJobsDal>) {
  return {
    /**
     * Ensures the durable maintenance job records and indexes exist before the worker starts.
     */
    prepare: () => dal.ensure(),
    /**
     * Claims one due maintenance job, removes expired records and completes only its own
     * lease. Cleanup is safe to retry after a crash.
     */
    async tick() {
      const owner = randomUUID();
      const job = await dal.claim(owner);
      if (!job) return;
      // Claim jobs individually so other workers can process different due jobs concurrently.
      // Cleanup is idempotent and can be retried when a crashed worker’s lease expires.
      await dal.cleanup();
      await dal.complete(job._id, owner);
    },
  };
}
