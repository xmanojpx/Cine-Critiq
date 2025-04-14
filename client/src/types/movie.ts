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
  genres?: Genre[];
  runtime?: number;
  tagline?: string;
  status?: string;
  revenue?: number;
  budget?: number;
}

export interface MovieDetails extends Movie {
  credits?: {
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
  recommendations?: {
    results: Movie[];
  };
  similar?: {
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

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Review {
  id: number;
  userId: number;
  movieId: number;
  rating: number | null;
  content: string | null;
  createdAt: Date;
  user?: {
    username: string;
    avatar: string | null;
  };
  movie?: {
    title: string;
    poster_path: string | null;
  };
}

export interface SearchResultsResponse {
  page: number;
  results: Movie[];
  total_results: number;
  total_pages: number;
}

export interface WatchlistItem {
  id: number;
  userId: number;
  movieId: number;
  createdAt: Date;
  movie?: Movie;
}

export interface UserList {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  items?: ListItem[];
}

export interface ListItem {
  id: number;
  listId: number;
  movieId: number;
  notes: string | null;
  order: number;
  createdAt: Date;
  movie?: Movie;
}
