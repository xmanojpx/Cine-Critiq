import { Movie, MovieDetails, Genre, SearchResultsResponse } from "@/types/movie";
import { apiRequest } from "@/lib/queryClient";

// Movie endpoints
export const fetchTrendingMovies = async (): Promise<Movie[]> => {
  const response = await fetch("/api/movies/trending");
  if (!response.ok) {
    throw new Error("Failed to fetch trending movies");
  }
  return response.json();
};

export const fetchPopularMovies = async (): Promise<Movie[]> => {
  const response = await fetch("/api/movies/popular");
  if (!response.ok) {
    throw new Error("Failed to fetch popular movies");
  }
  return response.json();
};

export const fetchTopRatedMovies = async (): Promise<Movie[]> => {
  const response = await fetch("/api/movies/top-rated");
  if (!response.ok) {
    throw new Error("Failed to fetch top rated movies");
  }
  return response.json();
};

export const fetchUpcomingMovies = async (): Promise<Movie[]> => {
  const response = await fetch("/api/movies/upcoming");
  if (!response.ok) {
    throw new Error("Failed to fetch upcoming movies");
  }
  return response.json();
};

export const fetchMovieDetails = async (id: number): Promise<MovieDetails> => {
  const response = await fetch(`/api/movies/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch details for movie ${id}`);
  }
  return response.json();
};

// Genre endpoints
export const fetchGenres = async (): Promise<Genre[]> => {
  const response = await fetch("/api/genres");
  if (!response.ok) {
    throw new Error("Failed to fetch genres");
  }
  return response.json();
};

export const fetchMoviesByGenre = async (genreId: number, page = 1): Promise<SearchResultsResponse> => {
  const response = await fetch(`/api/genres/${genreId}/movies?page=${page}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch movies for genre ${genreId}`);
  }
  return response.json();
};

// Search endpoint
export const searchMovies = async (query: string, page = 1): Promise<SearchResultsResponse> => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}`);
  if (!response.ok) {
    throw new Error("Failed to search movies");
  }
  return response.json();
};

// Reviews endpoints
export const fetchMovieReviews = async (movieId: number): Promise<any[]> => {
  const response = await fetch(`/api/movies/${movieId}/reviews`);
  if (!response.ok) {
    throw new Error(`Failed to fetch reviews for movie ${movieId}`);
  }
  return response.json();
};

export const addReview = async (movieId: number, rating: number | null, content: string | null): Promise<any> => {
  const response = await apiRequest("POST", "/api/reviews", {
    movieId,
    rating,
    content
  });
  return response.json();
};

export const deleteReview = async (reviewId: number): Promise<void> => {
  await apiRequest("DELETE", `/api/reviews/${reviewId}`);
};

// Watchlist endpoints
export const fetchUserWatchlist = async (userId: number): Promise<any[]> => {
  const response = await fetch(`/api/users/${userId}/watchlist`);
  if (!response.ok) {
    throw new Error(`Failed to fetch watchlist for user ${userId}`);
  }
  return response.json();
};

export const addToWatchlist = async (movieId: number): Promise<any> => {
  const response = await apiRequest("POST", "/api/watchlist", { movieId });
  return response.json();
};

export const removeFromWatchlist = async (movieId: number): Promise<void> => {
  await apiRequest("DELETE", `/api/watchlist/${movieId}`);
};

// User lists endpoints
export const fetchUserLists = async (userId: number): Promise<any[]> => {
  const response = await fetch(`/api/users/${userId}/lists`);
  if (!response.ok) {
    throw new Error(`Failed to fetch lists for user ${userId}`);
  }
  return response.json();
};

export const createList = async (name: string, description: string | null, isPublic: boolean): Promise<any> => {
  const response = await apiRequest("POST", "/api/lists", {
    name,
    description,
    isPublic
  });
  return response.json();
};

export const addMovieToList = async (listId: number, movieId: number, notes: string | null): Promise<any> => {
  const response = await apiRequest("POST", `/api/lists/${listId}/items`, {
    movieId,
    notes,
    order: 0 // Server will calculate the correct order
  });
  return response.json();
};
