import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

export type DB = Database<sqlite3.Database, sqlite3.Statement>;

export async function initDb(): Promise<DB> {
  const db = await open<sqlite3.Database, sqlite3.Statement>({
    filename: "registry.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY,
      owner TEXT,
      description TEXT,
      registeredAt INTEGER
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assetId INTEGER,
      fromOwner TEXT,
      toOwner TEXT,
      timestamp INTEGER
    );
  `);

  return db;
}
