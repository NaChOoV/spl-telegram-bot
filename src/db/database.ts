import { drizzle } from 'drizzle-orm/libsql';

import { migrate } from 'drizzle-orm/libsql/migrator';

import EnvConfig from '../config/enviroment';

const db = drizzle(`file:src/db/${EnvConfig.dbFileName}.sqlite`);

console.log('Migrating database...');
await migrate(db, { migrationsFolder: './drizzle' });

export default db;
