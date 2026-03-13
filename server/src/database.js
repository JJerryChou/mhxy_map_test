
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { dbPath } = require('./config');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new sqlite3.Database(dbPath);

const runStatement = (sql) =>
    new Promise((resolve, reject) => {
        db.run(sql, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });

const allRows = (sql) =>
    new Promise((resolve, reject) => {
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });

const ensureMapSettingsColumns = async () => {
    const columns = await allRows('PRAGMA table_info(map_settings)');
    const columnNames = new Set(columns.map((column) => column.name));

    if (!columnNames.has('max_x')) {
        await runStatement('ALTER TABLE map_settings ADD COLUMN max_x INTEGER');
        console.log('Added missing column map_settings.max_x');
    }

    if (!columnNames.has('max_y')) {
        await runStatement('ALTER TABLE map_settings ADD COLUMN max_y INTEGER');
        console.log('Added missing column map_settings.max_y');
    }
};

db.ready = (async () => {
    await runStatement('PRAGMA foreign_keys = ON');

    // Users table
    await runStatement(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Records table
    await runStatement(`CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        dig_time TEXT,
        map_name TEXT,
        coord_x INTEGER,
        coord_y INTEGER,
        trigger_event TEXT,
        item_name TEXT,
        output_price TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Item Prices table
    await runStatement(`CREATE TABLE IF NOT EXISTS item_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_type TEXT NOT NULL,
        item_name TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Map settings table
    await runStatement(`CREATE TABLE IF NOT EXISTS map_settings (
        map_name TEXT PRIMARY KEY,
        image_url TEXT,
        max_x INTEGER,
        max_y INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await ensureMapSettingsColumns();

    // Create default admin user if not exists (admin/admin123)
})().catch((err) => {
    console.error('Failed to initialize database schema:', err.message);
    throw err;
});

module.exports = db;
