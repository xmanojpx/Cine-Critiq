import axios, { AxiosError } from "axios";
import axiosRetry from 'axios-retry';

interface IAxiosRetryConfig {
  retries?: number;
  retryCondition?: (error: AxiosError) => boolean;
  retryDelay?: (retryCount: number) => number;
  shouldResetTimeout?: boolean;
}

const TMDB_API_KEY = process.env.TMDB_API_KEY || "82f1a07f55b2e1eecfabbd3294a7b603";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// Create Axios instance with retry configuration
const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'en-US',
    include_adult: false
  },
  timeout: 10000
});

// Configure retry behavior
axiosRetry(tmdbClient, {
  retries: 3,
  retryDelay: (retryCount: number) => {
    return retryCount * 1000; // Wait 1s, 2s, 3s between retries
  },
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response?.status && error.response?.status >= 500);
  }
} as IAxiosRetryConfig);

// Add response interceptor for error handling
tmdbClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    console.error('TMDB API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url
    });
    throw error;
  }
);

export const POSTER_SIZES = {
  SMALL: "w154",
  MEDIUM: "w342",
  LARGE: "w500",
  ORIGINAL: "original"
};

export const BACKDROP_SIZES = {
  SMALL: "w300",
  MEDIUM: "w780",
  LARGE: "w1280",
  ORIGINAL: "original"
};

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  status?: string;
  tagline?: string;
  revenue?: number;
  budget?: number;
  production_companies?: {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }[];
}

export interface MovieDetails extends Movie {
  credits: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }[];
  };
  recommendations: {
    results: Movie[];
  };
  similar: {
    results: Movie[];
  };
  videos?: {
    results: {
      id: string;
      key: string;
      site: string;
      type: string;
      name: string;
    }[];
  };
}

export interface Genre {
  id: number;
  name: string;
}

export interface SearchResult {
  page: number;
  results: Movie[];
  total_results: number;
  total_pages: number;
}

export const getImageUrl = (path: string | null, size = POSTER_SIZES.MEDIUM) => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Helper function to clean and validate credits data
const cleanCreditsData = (credits: any): { cast: any[]; crew: any[] } => {
  if (!credits || typeof credits !== 'object') {
    return { cast: [], crew: [] };
  }

  return {
    cast: Array.isArray(credits.cast) ? credits.cast.map((actor: any) => ({
      id: actor.id || 0,
      name: actor.name || 'Unknown',
      character: actor.character || 'Unknown',
      profile_path: actor.profile_path || null
    })) : [],
    crew: Array.isArray(credits.crew) ? credits.crew.map((member: any) => ({
      id: member.id || 0,
      name: member.name || 'Unknown',
      job: member.job || 'Unknown',
      department: member.department || 'Unknown',
      profile_path: member.profile_path || null
    })) : []
  };
};

// Helper function to validate and clean movie data
const cleanMovieData = (movie: any): Movie => {
  if (!movie || typeof movie !== 'object') {
    throw new Error('Invalid movie data received from TMDB API');
  }

  return {
    id: movie.id || 0,
    title: movie.title || 'Untitled',
    poster_path: movie.poster_path || null,
    backdrop_path: movie.backdrop_path || null,
    overview: movie.overview || '',
    release_date: movie.release_date || '',
    vote_average: typeof movie.vote_average === 'number' ? movie.vote_average : 0,
    vote_count: movie.vote_count || 0,
    genre_ids: Array.isArray(movie.genre_ids) ? movie.genre_ids : [],
    genres: Array.isArray(movie.genres) ? movie.genres : [],
    runtime: typeof movie.runtime === 'number' ? movie.runtime : null,
    status: movie.status || '',
    tagline: movie.tagline || '',
    revenue: typeof movie.revenue === 'number' ? movie.revenue : 0,
    budget: typeof movie.budget === 'number' ? movie.budget : 0,
    production_companies: Array.isArray(movie.production_companies) ? movie.production_companies : []
  };
};

export const tmdbApi = {
  getTrendingMovies: async (): Promise<Movie[]> => {
    try {
      const response = await tmdbClient.get("/trending/movie/week");
      return (response.data.results || []).map(cleanMovieData);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      throw error;
    }
  },

  getPopularMovies: async (): Promise<Movie[]> => {
    try {
      const response = await tmdbClient.get("/movie/popular");
      return (response.data.results || []).map(cleanMovieData);
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw error;
    }
  },

  getTopRatedMovies: async (): Promise<Movie[]> => {
    try {
      const response = await tmdbClient.get("/movie/top_rated");
      return (response.data.results || []).map(cleanMovieData);
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      throw error;
    }
  },

  getUpcomingMovies: async (): Promise<Movie[]> => {
    try {
      const response = await tmdbClient.get("/movie/upcoming");
      return (response.data.results || []).map(cleanMovieData);
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      throw error;
    }
  },

  getMovieById: async (id: number): Promise<MovieDetails> => {
    try {
      const response = await tmdbClient.get(`/movie/${id}`, {
        params: {
          append_to_response: 'credits,recommendations,similar,videos'
        }
      });
      return {
        ...cleanMovieData(response.data),
        credits: cleanCreditsData(response.data.credits),
        recommendations: response.data.recommendations || { results: [] },
        similar: response.data.similar || { results: [] },
        videos: response.data.videos || { results: [] }
      };
    } catch (error) {
      console.error(`Error fetching movie ${id}:`, error);
      throw error;
    }
  },

  getGenres: async (): Promise<Genre[]> => {
    const response = await tmdbClient.get("/genre/movie/list");
    return response.data.genres;
  },

  getMoviesByGenre: async (genreId: number, page = 1): Promise<SearchResult> => {
    const response = await tmdbClient.get("/discover/movie", {
      params: {
        with_genres: genreId,
        page
      }
    });
    return response.data;
  },

  searchMovies: async (query: string, page = 1): Promise<SearchResult> => {
    const response = await tmdbClient.get("/search/movie", {
      params: {
        query,
        page
      }
    });
    return response.data;
  },

  getMovieRecommendations: async (movieId: number): Promise<Movie[]> => {
    try {
      const response = await tmdbClient.get(`/movie/${movieId}/recommendations`);
      return (response.data.results || []).map(cleanMovieData);
    } catch (error) {
      console.error(`Error fetching recommendations for movie ${movieId}:`, error);
      throw error;
    }
  },

  getSimilarMovies: async (movieId: number): Promise<Movie[]> => {
    try {
      const response = await tmdbClient.get(`/movie/${movieId}/similar`);
      return (response.data.results || []).map(cleanMovieData);
    } catch (error) {
      console.error(`Error fetching similar movies for ${movieId}:`, error);
      throw error;
    }
  },

  getMovieKeywords: async (movieId: number): Promise<{ id: number; name: string; }[]> => {
    try {
      const response = await tmdbClient.get(`/movie/${movieId}/keywords`);
      return response.data.keywords || [];
    } catch (error) {
      console.error(`Error fetching keywords for movie ${movieId}:`, error);
      throw error;
    }
  },

  getMovieVideos: async (movieId: number) => {
    try {
      const response = await tmdbClient.get(`/movie/${movieId}/videos`);
      return response.data.results || [];
    } catch (error) {
      console.error(`Error fetching videos for movie ${movieId}:`, error);
      throw error;
    }
  }
};
