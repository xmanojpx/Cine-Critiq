import axios from "axios";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "82f1a07f55b2e1eecfabbd3294a7b603";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

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

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY
  }
});

export const tmdbApi = {
  getTrendingMovies: async (): Promise<Movie[]> => {
    const response = await tmdbClient.get("/trending/movie/week");
    return response.data.results;
  },

  getPopularMovies: async (): Promise<Movie[]> => {
    const response = await tmdbClient.get("/movie/popular");
    return response.data.results;
  },

  getTopRatedMovies: async (): Promise<Movie[]> => {
    const response = await tmdbClient.get("/movie/top_rated");
    return response.data.results;
  },

  getUpcomingMovies: async (): Promise<Movie[]> => {
    const response = await tmdbClient.get("/movie/upcoming");
    return response.data.results;
  },

  getMovieById: async (id: number): Promise<MovieDetails> => {
    const response = await tmdbClient.get(`/movie/${id}`, {
      params: {
        append_to_response: "credits,recommendations,similar"
      }
    });
    return response.data;
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
  }
};
