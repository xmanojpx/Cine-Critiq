import { pgTable, text, serial, integer, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  movieId: integer("movie_id").notNull(),
  rating: doublePrecision("rating"),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  movieId: integer("movie_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userLists = pgTable("user_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const listItems = pgTable("list_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull().references(() => userLists.id),
  movieId: integer("movie_id").notNull(),
  notes: text("notes"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  avatar: true,
  bio: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  movieId: true,
  rating: true,
  content: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlist).pick({
  userId: true,
  movieId: true,
});

export const insertUserListSchema = createInsertSchema(userLists).pick({
  userId: true,
  name: true,
  description: true,
  isPublic: true,
});

export const insertListItemSchema = createInsertSchema(listItems).pick({
  listId: true,
  movieId: true,
  notes: true,
  order: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type WatchlistItem = typeof watchlist.$inferSelect;
export type UserList = typeof userLists.$inferSelect;
export type ListItem = typeof listItems.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistSchema>;
export type InsertUserList = z.infer<typeof insertUserListSchema>;
export type InsertListItem = z.infer<typeof insertListItemSchema>;
