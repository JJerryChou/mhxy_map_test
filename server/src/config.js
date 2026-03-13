const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const projectRoot = path.resolve(__dirname, '../..');
const serverRoot = path.resolve(__dirname, '..');

const resolveProjectPath = (targetPath, fallbackPath) => {
    if (!targetPath) return fallbackPath;
    return path.resolve(projectRoot, targetPath);
};

const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET || (!isProduction ? 'fantasy-westward-journey-secret-key' : '');

if (isProduction && !jwtSecret) {
    throw new Error('JWT_SECRET must be set when NODE_ENV=production.');
}

const dbPath = resolveProjectPath(process.env.DB_PATH, path.join(serverRoot, 'database.sqlite'));
const uploadsDir = resolveProjectPath(process.env.UPLOAD_DIR, path.join(serverRoot, 'uploads'));
const importsDir = path.join(uploadsDir, 'imports');
const mapUploadsDir = path.join(uploadsDir, 'maps');
const clientDistDir = resolveProjectPath(process.env.CLIENT_DIST_DIR, path.join(projectRoot, 'client', 'dist'));
const serveClient = process.env.SERVE_CLIENT !== 'false';
const corsOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || (!isProduction ? 'admin' : '');
const resetAdminPassword = process.env.RESET_ADMIN_PASSWORD === 'true';

module.exports = {
    adminPassword,
    adminUsername,
    clientDistDir,
    corsOrigins,
    dbPath,
    importsDir,
    isProduction,
    jwtSecret,
    mapUploadsDir,
    port,
    resetAdminPassword,
    serveClient,
    uploadsDir
};
