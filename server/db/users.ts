import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize users database
export async function initUsersDB() {
  const db = await open({
    filename: path.join(__dirname, 'users.db'),
    driver: sqlite3.Database
  });

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create admin user if it doesn't exist
  const adminExists = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', 'Manoj', 'admin@cinecritic.com');
  let adminId: number;
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('manoj2005', 10);
    const result = await db.run(
      'INSERT INTO users (username, email, password, bio) VALUES (?, ?, ?, ?)',
      'Manoj',
      'admin@cinecritic.com',
      hashedPassword,
      'Movie enthusiast and critic. Love analyzing films and sharing my thoughts with the community.'
    );
    adminId = result.lastID!;
  } else {
    adminId = adminExists.id;
    // Update existing admin user's name and bio
    await db.run(
      'UPDATE users SET username = ?, bio = ? WHERE id = ?',
      'Manoj',
      'Movie enthusiast and critic. Love analyzing films and sharing my thoughts with the community.',
      adminId
    );
  }

  return { db, adminId };
}

// Export a singleton database instance
let dbInstance: Awaited<ReturnType<typeof initUsersDB>> | null = null;

export async function getUsersDB() {
  if (!dbInstance) {
    dbInstance = await initUsersDB();
  }
  return dbInstance;
} 