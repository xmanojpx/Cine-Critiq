import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { tmdbApi } from "./tmdb";
import { insertReviewSchema, insertWatchlistSchema, insertUserListSchema, insertListItemSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Movie routes
  app.get("/api/movies/trending", async (req, res) => {
    try {
      const movies = await tmdbApi.getTrendingMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      res.status(500).json({ message: "Failed to fetch trending movies" });
    }
  });

  app.get("/api/movies/popular", async (req, res) => {
    try {
      const movies = await tmdbApi.getPopularMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching popular movies:", error);
      res.status(500).json({ message: "Failed to fetch popular movies" });
    }
  });

  app.get("/api/movies/top-rated", async (req, res) => {
    try {
      const movies = await tmdbApi.getTopRatedMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching top rated movies:", error);
      res.status(500).json({ message: "Failed to fetch top rated movies" });
    }
  });

  app.get("/api/movies/upcoming", async (req, res) => {
    try {
      const movies = await tmdbApi.getUpcomingMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching upcoming movies:", error);
      res.status(500).json({ message: "Failed to fetch upcoming movies" });
    }
  });

  app.get("/api/movies/:id", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      const movie = await tmdbApi.getMovieById(movieId);
      res.json(movie);
    } catch (error) {
      console.error(`Error fetching movie ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch movie details" });
    }
  });

  // Genres
  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await tmdbApi.getGenres();
      res.json(genres);
    } catch (error) {
      console.error("Error fetching genres:", error);
      res.status(500).json({ message: "Failed to fetch genres" });
    }
  });

  app.get("/api/genres/:id/movies", async (req, res) => {
    try {
      const genreId = parseInt(req.params.id);
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const movies = await tmdbApi.getMoviesByGenre(genreId, page);
      res.json(movies);
    } catch (error) {
      console.error(`Error fetching movies for genre ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch movies by genre" });
    }
  });

  // Search
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const results = await tmdbApi.searchMovies(query, page);
      res.json(results);
    } catch (error) {
      console.error(`Error searching movies:`, error);
      res.status(500).json({ message: "Failed to search movies" });
    }
  });

  // Reviews
  app.get("/api/movies/:id/reviews", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByMovieId(movieId);
      res.json(reviews);
    } catch (error) {
      console.error(`Error fetching reviews for movie ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to write a review" });
    }

    try {
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if user already reviewed this movie
      const existingReview = await storage.getReviewByUserAndMovie(req.user.id, validatedData.movieId);
      
      if (existingReview) {
        // Update existing review
        const updatedReview = await storage.updateReview(existingReview.id, validatedData);
        return res.json(updatedReview);
      }
      
      // Create new review
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.delete("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to delete a review" });
    }

    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReviewById(reviewId);
      
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      if (review.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own reviews" });
      }
      
      await storage.deleteReview(reviewId);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting review ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Watchlist
  app.get("/api/users/:id/watchlist", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const watchlist = await storage.getWatchlistByUserId(userId);
      res.json(watchlist);
    } catch (error) {
      console.error(`Error fetching watchlist for user ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to update your watchlist" });
    }

    try {
      const validatedData = insertWatchlistSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if movie is already in watchlist
      const existingItem = await storage.getWatchlistItem(req.user.id, validatedData.movieId);
      
      if (existingItem) {
        return res.status(400).json({ message: "Movie already in watchlist" });
      }
      
      const watchlistItem = await storage.addToWatchlist(validatedData);
      res.status(201).json(watchlistItem);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  app.delete("/api/watchlist/:movieId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to update your watchlist" });
    }

    try {
      const movieId = parseInt(req.params.movieId);
      await storage.removeFromWatchlist(req.user.id, movieId);
      res.status(204).send();
    } catch (error) {
      console.error(`Error removing from watchlist:`, error);
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // User Lists
  app.get("/api/users/:id/lists", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const lists = await storage.getUserLists(userId);
      res.json(lists);
    } catch (error) {
      console.error(`Error fetching lists for user ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch user lists" });
    }
  });

  app.post("/api/lists", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to create a list" });
    }

    try {
      const validatedData = insertUserListSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const list = await storage.createUserList(validatedData);
      res.status(201).json(list);
    } catch (error) {
      console.error("Error creating list:", error);
      res.status(500).json({ message: "Failed to create list" });
    }
  });

  app.post("/api/lists/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You must be logged in to update a list" });
    }

    try {
      const listId = parseInt(req.params.id);
      const list = await storage.getUserListById(listId);
      
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }
      
      if (list.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only modify your own lists" });
      }
      
      const validatedData = insertListItemSchema.parse({
        ...req.body,
        listId
      });
      
      // Get current count to set order
      const currentItems = await storage.getListItems(listId);
      if (!validatedData.order) {
        validatedData.order = currentItems.length + 1;
      }
      
      const listItem = await storage.addMovieToList(validatedData);
      res.status(201).json(listItem);
    } catch (error) {
      console.error("Error adding movie to list:", error);
      res.status(500).json({ message: "Failed to add movie to list" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
