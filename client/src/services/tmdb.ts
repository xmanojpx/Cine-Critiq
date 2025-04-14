// TMDB Image URL utilities
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export type PosterSize = "w154" | "w342" | "w500" | "original";
export type BackdropSize = "w300" | "w780" | "w1280" | "original";

export const POSTER_SIZES: Record<string, PosterSize> = {
  SMALL: "w154",
  MEDIUM: "w342",
  LARGE: "w500",
  ORIGINAL: "original"
};

export const BACKDROP_SIZES: Record<string, BackdropSize> = {
  SMALL: "w300",
  MEDIUM: "w780",
  LARGE: "w1280",
  ORIGINAL: "original"
};

export const getImageUrl = (path: string | null, size: PosterSize | BackdropSize = "w342"): string | null => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}; 