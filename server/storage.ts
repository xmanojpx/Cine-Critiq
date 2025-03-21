import { users, type User, type InsertUser, 
  reviews, type Review, type InsertReview,
  watchlist, type WatchlistItem, type InsertWatchlistItem,
  userLists, type UserList, type InsertUserList,
  listItems, type ListItem, type InsertListItem  
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Review operations
  getReviewById(id: number): Promise<Review | undefined>;
  getReviewsByMovieId(movieId: number): Promise<Review[]>;
  getReviewsByUserId(userId: number): Promise<Review[]>;
  getReviewByUserAndMovie(userId: number, movieId: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: InsertReview): Promise<Review>;
  deleteReview(id: number): Promise<void>;
  
  // Watchlist operations
  getWatchlistByUserId(userId: number): Promise<WatchlistItem[]>;
  getWatchlistItem(userId: number, movieId: number): Promise<WatchlistItem | undefined>;
  addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(userId: number, movieId: number): Promise<void>;
  
  // User Lists operations
  getUserLists(userId: number): Promise<UserList[]>;
  getUserListById(id: number): Promise<UserList | undefined>;
  createUserList(list: InsertUserList): Promise<UserList>;
  updateUserList(id: number, list: Partial<InsertUserList>): Promise<UserList>;
  deleteUserList(id: number): Promise<void>;
  
  // List Items operations
  getListItems(listId: number): Promise<ListItem[]>;
  getListItem(id: number): Promise<ListItem | undefined>;
  addMovieToList(item: InsertListItem): Promise<ListItem>;
  updateListItem(id: number, item: Partial<InsertListItem>): Promise<ListItem>;
  removeMovieFromList(id: number): Promise<void>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reviews: Map<number, Review>;
  private watchlistItems: Map<number, WatchlistItem>;
  private userLists: Map<number, UserList>;
  private listItems: Map<number, ListItem>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private reviewIdCounter: number;
  private watchlistIdCounter: number;
  private userListIdCounter: number;
  private listItemIdCounter: number;

  constructor() {
    this.users = new Map();
    this.reviews = new Map();
    this.watchlistItems = new Map();
    this.userLists = new Map();
    this.listItems = new Map();
    
    this.userIdCounter = 1;
    this.reviewIdCounter = 1;
    this.watchlistIdCounter = 1;
    this.userListIdCounter = 1;
    this.listItemIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h in ms
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      avatar: null,
      bio: null,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  // Review methods
  async getReviewById(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }
  
  async getReviewsByMovieId(movieId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      review => review.movieId === movieId
    );
  }
  
  async getReviewsByUserId(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      review => review.userId === userId
    );
  }
  
  async getReviewByUserAndMovie(userId: number, movieId: number): Promise<Review | undefined> {
    return Array.from(this.reviews.values()).find(
      review => review.userId === userId && review.movieId === movieId
    );
  }
  
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const now = new Date();
    const review: Review = {
      ...insertReview,
      id,
      createdAt: now
    };
    this.reviews.set(id, review);
    return review;
  }
  
  async updateReview(id: number, updateData: InsertReview): Promise<Review> {
    const review = this.reviews.get(id);
    if (!review) {
      throw new Error(`Review with id ${id} not found`);
    }
    
    const updatedReview: Review = {
      ...review,
      ...updateData
    };
    
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }
  
  async deleteReview(id: number): Promise<void> {
    this.reviews.delete(id);
  }
  
  // Watchlist methods
  async getWatchlistByUserId(userId: number): Promise<WatchlistItem[]> {
    return Array.from(this.watchlistItems.values()).filter(
      item => item.userId === userId
    );
  }
  
  async getWatchlistItem(userId: number, movieId: number): Promise<WatchlistItem | undefined> {
    return Array.from(this.watchlistItems.values()).find(
      item => item.userId === userId && item.movieId === movieId
    );
  }
  
  async addToWatchlist(insertItem: InsertWatchlistItem): Promise<WatchlistItem> {
    const id = this.watchlistIdCounter++;
    const now = new Date();
    const watchlistItem: WatchlistItem = {
      ...insertItem,
      id,
      createdAt: now
    };
    this.watchlistItems.set(id, watchlistItem);
    return watchlistItem;
  }
  
  async removeFromWatchlist(userId: number, movieId: number): Promise<void> {
    const item = await this.getWatchlistItem(userId, movieId);
    if (item) {
      this.watchlistItems.delete(item.id);
    }
  }
  
  // User Lists methods
  async getUserLists(userId: number): Promise<UserList[]> {
    return Array.from(this.userLists.values()).filter(
      list => list.userId === userId
    );
  }
  
  async getUserListById(id: number): Promise<UserList | undefined> {
    return this.userLists.get(id);
  }
  
  async createUserList(insertList: InsertUserList): Promise<UserList> {
    const id = this.userListIdCounter++;
    const now = new Date();
    const list: UserList = {
      ...insertList,
      id,
      createdAt: now
    };
    this.userLists.set(id, list);
    return list;
  }
  
  async updateUserList(id: number, updateData: Partial<InsertUserList>): Promise<UserList> {
    const list = this.userLists.get(id);
    if (!list) {
      throw new Error(`List with id ${id} not found`);
    }
    
    const updatedList: UserList = {
      ...list,
      ...updateData
    };
    
    this.userLists.set(id, updatedList);
    return updatedList;
  }
  
  async deleteUserList(id: number): Promise<void> {
    this.userLists.delete(id);
    
    // Delete all associated list items
    for (const [itemId, item] of this.listItems.entries()) {
      if (item.listId === id) {
        this.listItems.delete(itemId);
      }
    }
  }
  
  // List Items methods
  async getListItems(listId: number): Promise<ListItem[]> {
    return Array.from(this.listItems.values())
      .filter(item => item.listId === listId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getListItem(id: number): Promise<ListItem | undefined> {
    return this.listItems.get(id);
  }
  
  async addMovieToList(insertItem: InsertListItem): Promise<ListItem> {
    const id = this.listItemIdCounter++;
    const now = new Date();
    const listItem: ListItem = {
      ...insertItem,
      id,
      createdAt: now
    };
    this.listItems.set(id, listItem);
    return listItem;
  }
  
  async updateListItem(id: number, updateData: Partial<InsertListItem>): Promise<ListItem> {
    const item = this.listItems.get(id);
    if (!item) {
      throw new Error(`List item with id ${id} not found`);
    }
    
    const updatedItem: ListItem = {
      ...item,
      ...updateData
    };
    
    this.listItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async removeMovieFromList(id: number): Promise<void> {
    this.listItems.delete(id);
  }
}

export const storage = new MemStorage();
