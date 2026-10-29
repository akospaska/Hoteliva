import { bootstrap } from './bootstrap.js';
import { createApp } from './app.js';

const { config, database, auth, admin, operations } = await bootstrap();
const server = createApp(config, auth, admin, operations).listen(config.PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({ event: 'web_started', port: config.PORT }));
});
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => process.exit(1), 10000).unref();
  server.close(async () => {
    await database.client.close();
    clearTimeout(deadline);
  });
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
