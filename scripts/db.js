const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

const configDir = path.join(os.homedir(), '.config', 'rbaker');
const dbPath = path.join(configDir, 'rbaker.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    value TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY,
    task TEXT,
    interval TEXT,
    timeout INTEGER
  )`);
});

module.exports = db;
