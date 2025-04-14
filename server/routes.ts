import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { tmdbApi } from "./tmdb";
import { insertReviewSchema, insertWatchlistSchema, insertUserListSchema, insertListItemSchema } from "@shared/schema";
import axios from "axios";
import { combineRecommendations } from "./ml/recommendation";
import { Request, Response, NextFunction } from "express";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to retry failed requests
async function retryRequest<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && axios.isAxiosError(error)) {
      console.error(`Request failed, retrying (${retries} attempts remaining):`, {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message
      });
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
}

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Public routes that don't require authentication
  const publicPaths = [
    '/',              // Root path
    '/index.html',    // Main HTML file
    '/static',        // Static files
    '/assets',        // Assets
    '/api/movies',    // Movie endpoints
    '/api/genres',    // Genre endpoints
    '/api/search',    // Search endpoint
    '/api/login',     // Login
    '/api/register'   // Registration
  ];

  // Check if the request path starts with any of the public paths
  if (publicPaths.some(path => req.path === path || req.path.startsWith(path))) {
    return next();
  }

  // For protected routes, check authentication
  if (req.isAuthenticated()) {
    return next();
  }

  res.sendStatus(401);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Apply authentication middleware to all routes
  app.use(requireAuth);

  // Movie routes
  app.get("/api/movies/trending", async (req, res) => {
    try {
      console.log("Fetching trending movies...");
      const movies = await retryRequest(() => tmdbApi.getTrendingMovies());
      console.log(`Successfully fetched ${movies.length} trending movies`);
      res.json(movies);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      res.status(500).json({ 
        message: "Failed to fetch trending movies",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/movies/popular", async (req, res) => {
    try {
      console.log("Fetching popular movies...");
      const movies = await retryRequest(() => tmdbApi.getPopularMovies());
      console.log(`Successfully fetched ${movies.length} popular movies`);
      res.json(movies);
    } catch (error) {
      console.error("Error fetching popular movies:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      res.status(500).json({ 
        message: "Failed to fetch popular movies",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/movies/top-rated", async (req, res) => {
    try {
      console.log("Fetching top rated movies...");
      const movies = await retryRequest(() => tmdbApi.getTopRatedMovies());
      console.log(`Successfully fetched ${movies.length} top rated movies`);
      res.json(movies);
    } catch (error) {
      console.error("Error fetching top rated movies:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      res.status(500).json({ 
        message: "Failed to fetch top rated movies",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/movies/upcoming", async (req, res) => {
    try {
      console.log("Fetching upcoming movies...");
      const movies = await retryRequest(() => tmdbApi.getUpcomingMovies());
      console.log(`Successfully fetched ${movies.length} upcoming movies`);
      res.json(movies);
    } catch (error) {
      console.error("Error fetching upcoming movies:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      res.status(500).json({ 
        message: "Failed to fetch upcoming movies",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/movies/:id", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      console.log(`Fetching movie details for ID: ${movieId}`);
      const movie = await retryRequest(() => tmdbApi.getMovieById(movieId));
      console.log(`Successfully fetched movie: ${movie.title}`);
      res.json(movie);
    } catch (error) {
      console.error(`Error fetching movie ${req.params.id}:`, error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      res.status(500).json({ 
        message: "Failed to fetch movie details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Recommendations routes
  app.get("/api/movies/:id/recommendations", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      const recommendations = await retryRequest(() => tmdbApi.getMovieRecommendations(movieId));
      res.json(recommendations);
    } catch (error) {
      console.error(`Error fetching recommendations for movie ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch movie recommendations",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/movies/:id/similar", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      const similarMovies = await retryRequest(() => tmdbApi.getSimilarMovies(movieId));
      res.json(similarMovies);
    } catch (error) {
      console.error(`Error fetching similar movies for ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch similar movies",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/movies/:id/keywords", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      const keywords = await retryRequest(() => tmdbApi.getMovieKeywords(movieId));
      res.json(keywords);
    } catch (error) {
      console.error(`Error fetching keywords for movie ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to fetch movie keywords",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ML-based recommendations endpoint
  app.post("/api/recommendations/ml", async (req, res) => {
    try {
      const { movieIds } = req.body;
      if (!Array.isArray(movieIds) || movieIds.length === 0) {
        return res.status(400).json({ message: "Please provide at least one movie ID" });
      }

      // Validate movie IDs
      if (!movieIds.every(id => typeof id === 'number' && !isNaN(id))) {
        return res.status(400).json({ message: "Invalid movie IDs provided" });
      }

      // Fetch details for all input movies
      const moviesDetails = await Promise.all(
        movieIds.map(id => retryRequest(() => tmdbApi.getMovieById(id)))
      );

      // Convert MovieDetails to Movie type by picking only Movie properties
      const movies = moviesDetails.map(details => ({
        id: details.id,
        title: details.title,
        overview: details.overview,
        poster_path: details.poster_path || undefined,
        backdrop_path: details.backdrop_path || undefined,
        release_date: details.release_date,
        vote_average: details.vote_average,
        vote_count: details.vote_count,
        original_language: details.original_language,
        genre_ids: details.genres?.map(g => g.id),
        genres: details.genres
      }));

      // Get similar movies for each input movie
      const similarMovies = await Promise.all(
        movieIds.map(id => retryRequest(() => tmdbApi.getSimilarMovies(id)))
      );

      // Combine and process recommendations
      const recommendations = await combineRecommendations(movies, similarMovies);
      
      if (!Array.isArray(recommendations)) {
        throw new Error("Recommendations is not an array");
      }
      
      // Transform recommendations to match client expectations
      const transformedRecommendations = recommendations.map(rec => ({
        movie: rec.movie,
        explanation: rec.explanation
      }));
      
      res.json(transformedRecommendations);
    } catch (error) {
      console.error("Error generating ML recommendations:", error);
      res.status(500).json({ 
        message: "Failed to generate recommendations",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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

  app.get("/api/users/:id/reviews", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const reviews = await storage.getUserReviews(userId);
      
      // Fetch movie details for each review
      const reviewsWithMovies = await Promise.all(
        reviews.map(async (review) => {
          const movie = await tmdbApi.getMovieById(review.movieId);
          return {
            ...review,
            movie: {
              id: movie.id,
              title: movie.title,
              posterPath: movie.poster_path,
              releaseDate: movie.release_date
            }
          };
        })
      );
      
      res.json(reviewsWithMovies);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
