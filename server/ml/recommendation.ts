import * as tf from '@tensorflow/tfjs';
import { Movie, Genre } from '../types';
import { extractContentFeatures, calculateContentSimilarity, ContentFeatures } from './content-analysis';

interface MovieFeatures extends ContentFeatures {
  language: string;
  genres: number[];
}

interface Recommendation {
  movie: Movie;
  score: number;
  explanation: string;
}

// Extract features from movie data
function extractFeatures(movie: Movie, contentFeatures: ContentFeatures): MovieFeatures {
  return {
    ...contentFeatures,
    language: movie.original_language || 'en',
    genres: movie.genre_ids || []
  };
}

// Calculate similarity between two movies
function calculateSimilarity(
  a: MovieFeatures, 
  b: MovieFeatures, 
  inputLanguage: string
): number {
  // Content similarity (summary, theme, tone)
  const contentSimilarity = calculateContentSimilarity(a, b);
  
  // Genre similarity
  const genreSimilarity = calculateGenreSimilarity(a.genres, b.genres);
  
  // Language similarity (boost for same language)
  const languageSimilarity = a.language === b.language ? 1 : 0;
  
  // Weighted combination of similarities
  // Higher weight for content and language if input is non-English
  const isNonEnglish = inputLanguage !== 'en';
  const contentWeight = isNonEnglish ? 0.5 : 0.6;
  const genreWeight = 0.3;
  const languageWeight = isNonEnglish ? 0.2 : 0.1;

  return (
    contentWeight * contentSimilarity +
    genreWeight * genreSimilarity +
    languageWeight * languageSimilarity
  );
}

// Calculate genre similarity using Jaccard similarity
function calculateGenreSimilarity(genres1: number[], genres2: number[]): number {
  if (genres1.length === 0 || genres2.length === 0) return 0;
  
  const intersection = genres1.filter(id => genres2.includes(id)).length;
  const union = new Set([...genres1, ...genres2]).size;
  
  return intersection / union;
}

export async function combineRecommendations(
  inputMovies: Movie[],
  similarMovies: Movie[][]
): Promise<Recommendation[]> {
  // Initialize TensorFlow.js
  tf.setBackend('cpu');

  // Extract content features for input movies
  const inputFeatures = await Promise.all(
    inputMovies.map(async movie => {
      const contentFeatures = await extractContentFeatures(movie);
      return extractFeatures(movie, contentFeatures);
    })
  );

  // Get the primary language from input movies
  const inputLanguage = inputMovies[0]?.original_language || 'en';

  // Process all similar movies
  const allSimilarMovies = similarMovies.flat();
  
  // Calculate similarity scores for each recommendation
  const movieScores = await Promise.all(
    allSimilarMovies.map(async movie => {
      const contentFeatures = await extractContentFeatures(movie);
      const movieFeatures = extractFeatures(movie, contentFeatures);

      // Calculate similarity with each input movie
      const similarities = inputFeatures.map(features => 
        calculateSimilarity(features, movieFeatures, inputLanguage)
      );

      // Calculate average similarity
      const avgSimilarity = similarities.reduce((sum, score) => sum + score, 0) / similarities.length;

      // Find the most similar input movie
      const maxSimilarityIndex = similarities.indexOf(Math.max(...similarities));
      const mostSimilarMovie = inputMovies[maxSimilarityIndex];

      // Generate explanation
      const explanation = generateExplanation(movie, mostSimilarMovie, avgSimilarity);

      return {
        movie,
        score: avgSimilarity,
        explanation
      };
    })
  );

  // Sort by similarity score and remove duplicates
  const uniqueMovies = new Map<number, Recommendation>();
  movieScores
    .sort((a, b) => b.score - a.score)
    .forEach(rec => {
      if (!uniqueMovies.has(rec.movie.id)) {
        uniqueMovies.set(rec.movie.id, rec);
      }
    });

  // Return top 5 recommendations
  return Array.from(uniqueMovies.values()).slice(0, 5);
}

function generateExplanation(recommendedMovie: Movie, similarMovie: Movie, similarity: number): string {
  const sharedGenres = recommendedMovie.genre_ids?.filter(id => 
    similarMovie.genre_ids?.includes(id)
  ) || [];

  const explanations = [];
  
  if (sharedGenres.length > 0) {
    explanations.push(`Shares ${sharedGenres.length} genre${sharedGenres.length > 1 ? 's' : ''} with "${similarMovie.title}"`);
  }
  
  if (recommendedMovie.original_language === similarMovie.original_language) {
    explanations.push(`Same language as "${similarMovie.title}"`);
  }
  
  if (recommendedMovie.vote_average && recommendedMovie.vote_average >= 7.5) {
    explanations.push('Highly rated by audiences');
  }
  
  if (explanations.length === 0) {
    return `Similar to "${similarMovie.title}" based on content and themes`;
  }
  
  return explanations.join(' • ');
} 