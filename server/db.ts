import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// Initialize database
export async function initDB() {
  const db = await open({
    filename: path.join(__dirname, 'cinecritic.db'),
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
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (movieId) REFERENCES movies(id) ON DELETE CASCADE
    )
  `);

  // Create watchlist table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      movieId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
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

  // Create admin user if it doesn't exist
  const adminExists = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', 'admin', 'admin@cinecritic.com');
  let adminId: number;
  
  if (!adminExists) {
    const hashedPassword = await hashPassword('manoj2005');
    const result = await db.run(
      'INSERT INTO users (username, email, password, bio) VALUES (?, ?, ?, ?)',
      'admin',
      'admin@cinecritic.com',
      hashedPassword,
      'Movie enthusiast and critic. Love analyzing films and sharing my thoughts with the community.'
    );
    adminId = result.lastID!;
  } else {
    adminId = adminExists.id;
    // Update existing admin user's bio
    await db.run(
      'UPDATE users SET bio = ? WHERE id = ?',
      'Movie enthusiast and critic. Love analyzing films and sharing my thoughts with the community.',
      adminId
    );
  }

  // Add default reviews for popular movies
  const defaultReviews = [
    {
      movieId: 155, // The Dark Knight
      rating: 5,
      content: "Christopher Nolan's masterpiece that redefined the superhero genre. Heath Ledger's Joker is one of the greatest performances in cinema history. The film's complex themes, stunning visuals, and gripping narrative make it a modern classic.",
      movieTitle: "The Dark Knight",
      moviePosterPath: "/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg"
    },
    {
      movieId: 238, // The Godfather
      rating: 5,
      content: "A timeless epic that explores family, power, and morality. Marlon Brando and Al Pacino deliver unforgettable performances. The film's cinematography and score are as iconic as its characters.",
      movieTitle: "The Godfather",
      moviePosterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"
    },
    {
      movieId: 550, // Fight Club
      rating: 4,
      content: "A mind-bending exploration of consumerism and identity. David Fincher's direction is masterful, and the twist ending remains one of the most shocking in cinema. The film's themes about masculinity and society are more relevant than ever.",
      movieTitle: "Fight Club",
      moviePosterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
    },
    {
      movieId: 680, // Pulp Fiction
      rating: 5,
      content: "Quentin Tarantino's non-linear masterpiece that revolutionized independent cinema. The dialogue is razor-sharp, the characters are unforgettable, and the soundtrack is perfect. A film that rewards multiple viewings.",
      movieTitle: "Pulp Fiction",
      moviePosterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg"
    },
    {
      movieId: 11, // Star Wars: Episode IV - A New Hope
      rating: 5,
      content: "The film that launched one of the greatest franchises in history. George Lucas created a rich universe filled with memorable characters and groundbreaking special effects. The Force will be with you, always.",
      movieTitle: "Star Wars: Episode IV - A New Hope",
      moviePosterPath: "/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg"
    },
    {
      movieId: 122, // The Lord of the Rings: The Return of the King
      rating: 5,
      content: "A perfect conclusion to an epic trilogy. Peter Jackson's adaptation of Tolkien's masterpiece is a triumph of filmmaking. The battle scenes are breathtaking, and the emotional payoff is deeply satisfying.",
      movieTitle: "The Lord of the Rings: The Return of the King",
      moviePosterPath: "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg"
    },
    {
      movieId: 299534, // Avengers: Endgame
      rating: 4,
      content: "A satisfying conclusion to the Infinity Saga. The film's emotional moments hit hard, and the final battle is spectacular. While it's not perfect, it's a remarkable achievement in blockbuster filmmaking.",
      movieTitle: "Avengers: Endgame",
      moviePosterPath: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg"
    },
    {
      movieId: 299536, // Avengers: Infinity War
      rating: 5,
      content: "A bold and ambitious crossover event that actually delivers. Thanos is one of the best villains in recent memory, and the film's ending is genuinely shocking. The Russo brothers balance multiple characters and storylines with remarkable skill.",
      movieTitle: "Avengers: Infinity War",
      moviePosterPath: "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg"
    }
  ];

  // Check if reviews already exist for these movies
  for (const review of defaultReviews) {
    // Add movie data to movies table if it doesn't exist
    const existingMovie = await db.get(
      'SELECT * FROM movies WHERE id = ?',
      review.movieId
    );

    if (!existingMovie) {
      await db.run(
        'INSERT INTO movies (id, title, poster_path) VALUES (?, ?, ?)',
        review.movieId,
        review.movieTitle,
        review.moviePosterPath
      );
    }

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
    } else {
      // Update existing review to ensure it's linked to the admin account
      await db.run(
        'UPDATE reviews SET userId = ? WHERE id = ?',
        adminId,
        existingReview.id
      );
    }
  }

  return db;
}

// Export a singleton database instance
let dbInstance: Awaited<ReturnType<typeof initDB>> | null = null;

export async function getDB() {
  if (!dbInstance) {
    dbInstance = await initDB();
  }
  return dbInstance;
} 