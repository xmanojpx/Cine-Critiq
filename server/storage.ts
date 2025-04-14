import { User as SharedUser, Review as SharedReview } from '@shared/schema';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import bcrypt from 'bcrypt';
import { tmdbApi } from './tmdb';
import { initDB } from './db';
import { Database } from 'sqlite3';

const MemoryStore = createMemoryStore(session);

export interface User extends SharedUser {
  id: number;
  createdAt: Date;
}

export interface Review extends SharedReview {
  id: number;
  createdAt: Date;
  movieTitle?: string;
  moviePosterPath?: string;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  updateUser(id: number, user: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<boolean>;
  deleteUser(id: number): Promise<boolean>;
  verifyPassword(user: User, password: string): Promise<boolean>;
  
  // Review operations
  getReviewById(id: number): Promise<Review | undefined>;
  getReviewsByMovieId(movieId: number): Promise<Review[]>;
  getUserReviews(userId: number): Promise<Review[]>;
  getReviewByUserAndMovie(userId: number, movieId: number): Promise<Review | undefined>;
  createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review>;
  updateReview(id: number, review: Partial<Omit<Review, 'id' | 'createdAt'>>): Promise<boolean>;
  deleteReview(id: number): Promise<boolean>;

  // Watchlist operations
  getWatchlistByUserId(userId: number): Promise<any[]>;
  getWatchlistItem(userId: number, movieId: number): Promise<any>;
  addToWatchlist(data: { userId: number; movieId: number }): Promise<any>;
  removeFromWatchlist(userId: number, movieId: number): Promise<boolean>;

  // User Lists operations
  getUserLists(userId: number): Promise<any[]>;
  createUserList(data: { userId: number; name: string; description?: string; isPublic?: boolean }): Promise<any>;
  getUserListById(id: number): Promise<any>;
  getListItems(listId: number): Promise<any[]>;
  addMovieToList(data: { listId: number; movieId: number; order: number; notes?: string }): Promise<any>;

  sessionStore: session.Store;
}

export class DBStorage implements IStorage {
  sessionStore: session.Store;
  private db: Awaited<ReturnType<typeof initDB>> | null = null;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h in ms
    });
  }

  private async getDB() {
    if (!this.db) {
      this.db = await initDB();
    }
    return this.db;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.getUserById(id);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const db = await this.getDB();
    const user = await db.get('SELECT * FROM users WHERE id = ?', id);
    return user ? { ...user, createdAt: new Date(user.createdAt) } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await this.getDB();
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    return user ? { ...user, createdAt: new Date(user.createdAt) } : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await this.getDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    return user ? { ...user, createdAt: new Date(user.createdAt) } : undefined;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const db = await this.getDB();
    const result = await db.run(
      'INSERT INTO users (username, email, password, avatar, bio) VALUES (?, ?, ?, ?, ?)',
      user.username,
      user.email,
      user.password,
      user.avatar,
      user.bio
    );
    const created = await this.getUserById(result.lastID!);
    if (!created) throw new Error('Failed to create user');
    return created;
  }

  async updateUser(id: number, user: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<boolean> {
    const db = await this.getDB();
    const updates: string[] = [];
    const values: any[] = [];

    if (user.username !== undefined) {
      updates.push('username = ?');
      values.push(user.username);
    }
    if (user.email !== undefined) {
      updates.push('email = ?');
      values.push(user.email);
    }
    if (user.password !== undefined) {
      updates.push('password = ?');
      values.push(user.password);
    }
    if (user.avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(user.avatar);
    }
    if (user.bio !== undefined) {
      updates.push('bio = ?');
      values.push(user.bio);
    }

    if (updates.length === 0) return true;

    values.push(id);
    const result = await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );
    return result.changes! > 0;
  }

  async deleteUser(id: number): Promise<boolean> {
    const db = await this.getDB();
    const result = await db.run('DELETE FROM users WHERE id = ?', id);
    return result.changes! > 0;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  // Review methods
  async getReviewById(id: number): Promise<Review | undefined> {
    const db = await this.getDB();
    const review = await db.get(
      `SELECT r.*, m.title as movieTitle, m.poster_path as moviePosterPath 
       FROM reviews r 
       LEFT JOIN movies m ON r.movieId = m.id 
       WHERE r.id = ?`,
      id
    );
    return review ? { ...review, createdAt: new Date(review.createdAt) } : undefined;
  }

  async getReviewsByMovieId(movieId: number): Promise<Review[]> {
    const db = await this.getDB();
    const reviews = await db.all(
      `SELECT r.*, m.title as movieTitle, m.poster_path as moviePosterPath 
       FROM reviews r 
       LEFT JOIN movies m ON r.movieId = m.id 
       WHERE r.movieId = ? 
       ORDER BY r.createdAt DESC`,
      movieId
    );
    return reviews.map(review => ({ ...review, createdAt: new Date(review.createdAt) }));
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    const db = await this.getDB();
    try {
      const reviews = await db.all<Review[]>(`
        SELECT r.*, m.title as movieTitle, m.poster_path as moviePosterPath 
        FROM reviews r
        LEFT JOIN movies m ON r.movieId = m.id
        WHERE r.userId = ?
        ORDER BY r.createdAt DESC
      `, userId);

      // If movie data is not in the database, fetch it from TMDB
      for (const review of reviews) {
        if (!review.movieTitle || !review.moviePosterPath) {
          try {
            const movie = await tmdbApi.getMovieById(review.movieId);
            if (movie) {
              // Update the movie data in the database
              await db.run(
                `INSERT OR REPLACE INTO movies (id, title, poster_path, backdrop_path, overview, release_date, vote_average, vote_count)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                movie.id,
                movie.title,
                movie.poster_path || undefined,
                movie.backdrop_path || undefined,
                movie.overview,
                movie.release_date,
                movie.vote_average,
                movie.vote_count
              );
              // Update the review with the movie data
              review.movieTitle = movie.title;
              review.moviePosterPath = movie.poster_path || undefined;
            }
          } catch (error) {
            console.error(`Error fetching movie ${review.movieId}:`, error);
          }
        }
      }

      return reviews.map(review => ({ ...review, createdAt: new Date(review.createdAt) }));
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw new Error('Failed to fetch user reviews');
    }
  }

  async getReviewByUserAndMovie(userId: number, movieId: number): Promise<Review | undefined> {
    const db = await this.getDB();
    const review = await db.get(
      'SELECT * FROM reviews WHERE userId = ? AND movieId = ?',
      userId,
      movieId
    );
    return review ? { ...review, createdAt: new Date(review.createdAt) } : undefined;
  }

  async createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const db = await this.getDB();
    const result = await db.run(
      'INSERT INTO reviews (userId, movieId, rating, content) VALUES (?, ?, ?, ?)',
      review.userId,
      review.movieId,
      review.rating,
      review.content
    );
    const created = await this.getReviewById(result.lastID!);
    if (!created) throw new Error('Failed to create review');
    return created;
  }

  async updateReview(id: number, review: Partial<Omit<Review, 'id' | 'createdAt'>>): Promise<boolean> {
    const db = await this.getDB();
    const updates: string[] = [];
    const values: any[] = [];

    if (review.rating !== undefined) {
      updates.push('rating = ?');
      values.push(review.rating);
    }
    if (review.content !== undefined) {
      updates.push('content = ?');
      values.push(review.content);
    }

    if (updates.length === 0) return true;

    values.push(id);
    const result = await db.run(
      `UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );
    return result.changes! > 0;
  }

  async deleteReview(id: number): Promise<boolean> {
    const db = await this.getDB();
    const result = await db.run('DELETE FROM reviews WHERE id = ?', id);
    return result.changes! > 0;
  }

  // Watchlist methods
  async getWatchlistByUserId(userId: number): Promise<any[]> {
    const db = await this.getDB();
    const items = await db.all(
      `SELECT w.*, m.title, m.poster_path, m.release_date
       FROM watchlist w
       LEFT JOIN movies m ON w.movieId = m.id
       WHERE w.userId = ?
       ORDER BY w.createdAt DESC`,
      userId
    );
    return items.map(item => ({ ...item, createdAt: new Date(item.createdAt) }));
  }

  async getWatchlistItem(userId: number, movieId: number): Promise<any> {
    const db = await this.getDB();
    return db.get(
      'SELECT * FROM watchlist WHERE userId = ? AND movieId = ?',
      userId,
      movieId
    );
  }

  async addToWatchlist(data: { userId: number; movieId: number }): Promise<any> {
    const db = await this.getDB();
    const result = await db.run(
      'INSERT INTO watchlist (userId, movieId) VALUES (?, ?)',
      data.userId,
      data.movieId
    );
    return this.getWatchlistItem(data.userId, data.movieId);
  }

  async removeFromWatchlist(userId: number, movieId: number): Promise<boolean> {
    const db = await this.getDB();
    const result = await db.run(
      'DELETE FROM watchlist WHERE userId = ? AND movieId = ?',
      userId,
      movieId
    );
    return result.changes! > 0;
  }

  // User Lists methods
  async getUserLists(userId: number): Promise<any[]> {
    const db = await this.getDB();
    const lists = await db.all(
      `SELECT l.*, COUNT(li.id) as itemCount
       FROM user_lists l
       LEFT JOIN list_items li ON l.id = li.listId
       WHERE l.userId = ?
       GROUP BY l.id
       ORDER BY l.createdAt DESC`,
      userId
    );
    return lists.map(list => ({ ...list, createdAt: new Date(list.createdAt) }));
  }

  async createUserList(data: { userId: number; name: string; description?: string; isPublic?: boolean }): Promise<any> {
    const db = await this.getDB();
    const result = await db.run(
      'INSERT INTO user_lists (userId, name, description, isPublic) VALUES (?, ?, ?, ?)',
      data.userId,
      data.name,
      data.description,
      data.isPublic ?? false
    );
    return this.getUserListById(result.lastID!);
  }

  async getUserListById(id: number): Promise<any> {
    const db = await this.getDB();
    const list = await db.get(
      `SELECT l.*, COUNT(li.id) as itemCount
       FROM user_lists l
       LEFT JOIN list_items li ON l.id = li.listId
       WHERE l.id = ?
       GROUP BY l.id`,
      id
    );
    return list ? { ...list, createdAt: new Date(list.createdAt) } : undefined;
  }

  async getListItems(listId: number): Promise<any[]> {
    const db = await this.getDB();
    const items = await db.all(
      `SELECT li.*, m.title, m.poster_path, m.release_date
       FROM list_items li
       LEFT JOIN movies m ON li.movieId = m.id
       WHERE li.listId = ?
       ORDER BY li.item_order ASC`,
      listId
    );
    return items.map(item => ({ ...item, createdAt: new Date(item.createdAt) }));
  }

  async addMovieToList(data: { listId: number; movieId: number; order: number; notes?: string }): Promise<any> {
    const db = await this.getDB();
    await db.run(
      'INSERT INTO list_items (listId, movieId, item_order, notes) VALUES (?, ?, ?, ?)',
      data.listId,
      data.movieId,
      data.order,
      data.notes
    );
    return this.getListItems(data.listId);
  }
}

export const storage = new DBStorage();
