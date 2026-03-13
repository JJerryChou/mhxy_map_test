
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { dbPath } = require('./config');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");

    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Records table
    db.run(`CREATE TABLE IF NOT EXISTS records (
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
    db.run(`CREATE TABLE IF NOT EXISTS item_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_type TEXT NOT NULL,
        item_name TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Map settings table
    db.run(`CREATE TABLE IF NOT EXISTS map_settings (
        map_name TEXT PRIMARY KEY,
        image_url TEXT,
        max_x INTEGER,
        max_y INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create default admin user if not exists (admin/admin123)
});

module.exports = db;
