import { readConfig } from './config.js';
import { openDatabase } from './dals/database.js';
import { createJobsDal } from './dals/jobs.dal.js';
import { createJobsFacade } from './facades/jobs.facade.js';
import { setTimeout } from 'node:timers/promises';
import { createOperationsDal } from './dals/operations.dal.js';
import { createOperationsWorker } from './facades/operations-worker.facade.js';

const database = await openDatabase(readConfig().MONGODB_URI);
const jobs = createJobsFacade(createJobsDal(database));
const operationsDal = createOperationsDal(database);
await operationsDal.prepare();
const operations = createOperationsWorker(operationsDal);
const abort = new AbortController();
process.on('SIGTERM', () => abort.abort());
process.on('SIGINT', () => abort.abort());
await jobs.prepare();
console.log(JSON.stringify({ event: 'worker_started' }));
try {
  while (!abort.signal.aborted) {
    try {
      await jobs.tick();
      await operations.tick();
    } catch {
      console.error(JSON.stringify({ event: 'job_failed' }));
    }
    await setTimeout(5000, undefined, { signal: abort.signal }).catch(() => {});
  }
} finally {
  await database.client.close();
}
