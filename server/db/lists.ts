import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize lists database
export async function initListsDB() {
  const db = await open({
    filename: path.join(__dirname, 'lists.db'),
    driver: sqlite3.Database
  });

  // Create watchlist table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      movieId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, movieId)
    )
  `);

  // Create user_lists table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      isPublic BOOLEAN DEFAULT FALSE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create list_items table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listId INTEGER NOT NULL,
      movieId INTEGER NOT NULL,
      item_order INTEGER NOT NULL,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listId) REFERENCES user_lists(id) ON DELETE CASCADE
    )
  `);

  return db;
}

// Export a singleton database instance
let dbInstance: Awaited<ReturnType<typeof initListsDB>> | null = null;

export async function getListsDB() {
  if (!dbInstance) {
    dbInstance = await initListsDB();
  }
  return dbInstance;
} 