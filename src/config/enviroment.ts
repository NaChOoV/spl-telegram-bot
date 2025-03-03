const EnvConfig = {
    timeZone: process.env.TIME_ZONE || 'GMT-3',
    databaseUrl: process.env.TURSO_DATABASE_URL || '',
    databaseToken: process.env.TURSO_AUTH_TOKEN || '',
    botToken: process.env.BOT_TOKEN || '',
    accessWssUrl: process.env.ACCESS_WSS_URL || '',
    accessBaseUrl: process.env.ACCESS_BASE_URL || '',
    accessAuthString: process.env.ACCESS_AUTH_STRING || '',
    sourceBaseUrl: process.env.SOURCE_BASE_URL || '',
    sourceUsername: process.env.SOURCE_USERNAME || '',
    sourcePassword: process.env.SOURCE_PASSWORD || '',
};

export default EnvConfig;
