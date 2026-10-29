import { readConfig } from './config.js';
import { openDatabase } from './dals/database.js';
import { createAuthDal } from './dals/auth.dal.js';
import { createAdminDal } from './dals/admin.dal.js';
import { createAuthFacade } from './facades/auth.facade.js';
import { createAdminFacade } from './facades/admin.facade.js';
import { createEmail } from './adapters/email.js';
import { createOperationsDal } from './dals/operations.dal.js';
import { createOperationsFacade } from './facades/operations.facade.js';

export async function bootstrap() {
  const config = readConfig();
  const database = await openDatabase(config.MONGODB_URI);
  const authDal = createAuthDal(database);
  const auth = createAuthFacade(authDal, config);
  const admin = createAdminFacade(createAdminDal(database), authDal, auth, createEmail(config));
  const operations = createOperationsFacade(createOperationsDal(database), auth, config);
  await operations.prepare();
  return { config, database, auth, admin, operations };
}
