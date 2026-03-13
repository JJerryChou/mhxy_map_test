const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const appDataDir = process.env.APP_DATA_DIR || '/www/wwwroot/129.204.56.112_data';
const secretFile = path.join(appDataDir, '.jwt-secret');

const ensureJwtSecret = () => {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

    fs.mkdirSync(appDataDir, { recursive: true });

    if (fs.existsSync(secretFile)) {
        const existingSecret = fs.readFileSync(secretFile, 'utf8').trim();
        if (existingSecret) {
            process.env.JWT_SECRET = existingSecret;
            return existingSecret;
        }
    }

    const generatedSecret = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(secretFile, `${generatedSecret}\n`, { mode: 0o600 });
    process.env.JWT_SECRET = generatedSecret;
    console.log(`Generated JWT secret at ${secretFile}`);
    return generatedSecret;
};

process.chdir(projectRoot);
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000';
process.env.APP_DATA_DIR = appDataDir;
process.env.SERVE_CLIENT = process.env.SERVE_CLIENT || 'true';
ensureJwtSecret();

require('./server/index.js');
