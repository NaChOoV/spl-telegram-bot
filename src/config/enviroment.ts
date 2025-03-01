const EnvConfig = {
    dbFileName: process.env.DB_FILE_NAME || 'mydb',
    botToken: process.env.BOT_TOKEN || '',
    accessWssUrl: process.env.ACCESS_WSS_URL || '',
    accessBaseUrl: process.env.ACCESS_BASE_URL || '',
    accessAuthString: process.env.ACCESS_AUTH_STRING || '',
    sourceBaseUrl: process.env.SOURCE_BASE_URL || '',
    sourceUsername: process.env.SOURCE_USERNAME || '',
    sourcePassword: process.env.SOURCE_PASSWORD || '',
};

export default EnvConfig;
