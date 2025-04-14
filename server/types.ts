export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
  genre_ids?: number[];
  genres?: Genre[];
}

export interface MovieDetails extends Movie {
  runtime?: number;
  status?: string;
  tagline?: string;
  original_language?: string;
  poster_path?: string;
  backdrop_path?: string;
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path?: string;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path?: string;
    }>;
  };
  recommendations?: Movie[];
  similar?: Movie[];
} 