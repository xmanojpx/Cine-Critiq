import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize movies database
export async function initMoviesDB() {
  const db = await open({
    filename: path.join(__dirname, 'movies.db'),
    driver: sqlite3.Database
  });

  // Create movies table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      poster_path TEXT,
      backdrop_path TEXT,
      overview TEXT,
      release_date TEXT,
      vote_average REAL,
      vote_count INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create reviews table with foreign key to users
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      movieId INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (movieId) REFERENCES movies(id) ON DELETE CASCADE
    )
  `);

  // Add default reviews for popular movies
  const defaultReviews = [
    {
      movieId: 155, // The Dark Knight
      rating: 5,
      content: "Christopher Nolan's masterpiece that redefined the superhero genre. Heath Ledger's Joker is one of the greatest performances in cinema history. The film's complex themes, stunning visuals, and gripping narrative make it a modern classic."
    },
    {
      movieId: 238, // The Godfather
      rating: 5,
      content: "A timeless epic that explores family, power, and morality. Marlon Brando and Al Pacino deliver unforgettable performances. The film's cinematography and score are as iconic as its characters."
    },
    {
      movieId: 550, // Fight Club
      rating: 4,
      content: "A mind-bending exploration of consumerism and identity. David Fincher's direction is masterful, and the twist ending remains one of the most shocking in cinema. The film's themes about masculinity and society are more relevant than ever."
    },
    {
      movieId: 680, // Pulp Fiction
      rating: 5,
      content: "Quentin Tarantino's non-linear masterpiece that revolutionized independent cinema. The dialogue is razor-sharp, the characters are unforgettable, and the soundtrack is perfect. A film that rewards multiple viewings."
    }
  ];

  // Get admin user ID from users database
  const { adminId } = await import('./users').then(m => m.getUsersDB());

  // Add default reviews
  for (const review of defaultReviews) {
    const existingReview = await db.get(
      'SELECT * FROM reviews WHERE userId = ? AND movieId = ?',
      adminId,
      review.movieId
    );

    if (!existingReview) {
      await db.run(
        'INSERT INTO reviews (userId, movieId, rating, content) VALUES (?, ?, ?, ?)',
        adminId,
        review.movieId,
        review.rating,
        review.content
      );
    }
  }

  return db;
}

// Export a singleton database instance
let dbInstance: Awaited<ReturnType<typeof initMoviesDB>> | null = null;

export async function getMoviesDB() {
  if (!dbInstance) {
    dbInstance = await initMoviesDB();
  }
  return dbInstance;
} 