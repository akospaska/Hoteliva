import { bootstrap } from '../bootstrap.js';

const { admin, database } = await bootstrap();
try {
  await admin.bootstrap(process.env.BOOTSTRAP_EMAIL ?? '', process.env.BOOTSTRAP_PASSWORD ?? '');
  console.log(JSON.stringify({ event: 'platform_admin_created' }));
} finally {
  await database.client.close();
}
