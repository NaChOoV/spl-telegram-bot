import EnvConfig from './src/config/enviroment';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'sqlite',
    dbCredentials: {
        url: `file:${EnvConfig.dbFileName}.sqlite`,
    },
});
