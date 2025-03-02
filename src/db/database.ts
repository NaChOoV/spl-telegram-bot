import { drizzle } from 'drizzle-orm/libsql';

import { migrate } from 'drizzle-orm/libsql/migrator';

import EnvConfig from '../config/enviroment';

const db = drizzle({
    connection: {
        url: EnvConfig.databaseUrl,
        authToken: EnvConfig.databaseToken,
    },
});

console.log('Success Database Migration...');
await migrate(db, { migrationsFolder: './drizzle' });

export default db;
