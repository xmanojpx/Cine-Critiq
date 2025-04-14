import * as tf from '@tensorflow/tfjs';
import { Movie, MovieDetails } from '../types';
import { extractContentFeatures, calculateContentSimilarity, ContentFeatures } from './content-analysis';

interface MovieFeatures {
  keywords: string[];
  genres: number[];
  directors: string[];  // Changed to array to support multiple directors
}

interface Recommendation {
  movie: Movie;
  score: number;
  explanation: string;
}

// Get directors from movie credits
function getDirectors(movie: MovieDetails): string[] {
  return movie.credits?.crew
    .filter(member => member.job.toLowerCase() === 'director')
    .map(director => director.name) || [];
}

// Extract keywords from movie overview
function extractKeywords(overview: string): string[] {
  if (!overview) return [];
  
  // Convert to lowercase and remove punctuation
  const text = overview.toLowerCase().replace(/[^\w\s]/g, '');
  
  // Split into words
  const words = text.split(/\s+/);
  
  // Remove stopwords and short words
  const stopwords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
    'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
    'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
    'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
    'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
    'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
    'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
    'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
    'give', 'day', 'most', 'us'
  ]);
  
  return words.filter(word => 
    word.length > 2 && !stopwords.has(word)
  );
}

// Extract features from movie data
function extractFeatures(movie: MovieDetails): MovieFeatures {
  return {
    keywords: extractKeywords(movie.overview || ''),
    genres: movie.genre_ids || [],
    directors: getDirectors(movie)
  };
}

// Calculate keyword similarity using Jaccard similarity
function calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Calculate director similarity using Jaccard similarity
function calculateDirectorSimilarity(directors1: string[], directors2: string[]): number {
  if (directors1.length === 0 || directors2.length === 0) return 0;
  
  const intersection = directors1.filter(d => directors2.includes(d)).length;
  const union = new Set([...directors1, ...directors2]).size;
  
  return intersection / union;
}

// Calculate similarity between two movies
function calculateSimilarity(a: MovieFeatures, b: MovieFeatures): number {
  // Content similarity based on keywords
  const keywordSimilarity = calculateKeywordSimilarity(a.keywords, b.keywords);
  
  // Genre similarity
  const genreSimilarity = calculateGenreSimilarity(a.genres, b.genres);
  
  // Director similarity using Jaccard similarity
  const directorSimilarity = calculateDirectorSimilarity(a.directors, b.directors);
  
  // Weighted combination of similarities
  const keywordWeight = 0.4;  // 40% weight for content
  const genreWeight = 0.2;    // 20% weight for genre
  const directorWeight = 0.4; // 40% weight for director - increased importance

  return (
    keywordWeight * keywordSimilarity +
    genreWeight * genreSimilarity +
    directorWeight * directorSimilarity
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
  inputMovies: MovieDetails[],
  similarMovies: MovieDetails[][]
): Promise<Recommendation[]> {
  // Process all similar movies
  const allSimilarMovies = similarMovies.flat();
  
  // Extract features for input movies
  const inputFeatures = inputMovies.map(movie => extractFeatures(movie));

  // Calculate similarity scores for each recommendation
  const movieScores = allSimilarMovies.map(movie => {
    const movieFeatures = extractFeatures(movie);

    // Calculate similarity with each input movie
    const similarities = inputFeatures.map(features => 
      calculateSimilarity(features, movieFeatures)
    );

    // Calculate average similarity
    const avgSimilarity = similarities.reduce((sum, score) => sum + score, 0) / similarities.length;

    // Find the most similar input movie
    const maxSimilarityIndex = similarities.indexOf(Math.max(...similarities));
    const mostSimilarMovie = inputMovies[maxSimilarityIndex];

    // Generate explanation
    const explanation = generateExplanation(movie, mostSimilarMovie, movieFeatures, inputFeatures[maxSimilarityIndex]);

    return {
      movie,
      score: avgSimilarity,
      explanation
    };
  });

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

function generateExplanation(
  recommendedMovie: MovieDetails, 
  similarMovie: MovieDetails,
  recommendedFeatures: MovieFeatures,
  similarFeatures: MovieFeatures
): string {
  const explanations = [];
  
  // Check for shared directors
  const sharedDirectors = recommendedFeatures.directors.filter(d => 
    similarFeatures.directors.includes(d)
  );
  
  if (sharedDirectors.length > 0) {
    if (sharedDirectors.length === 1) {
      explanations.push(`Directed by ${sharedDirectors[0]}, who also directed "${similarMovie.title}"`);
    } else {
      const directorList = sharedDirectors.join(' and ');
      explanations.push(`Shares directors (${directorList}) with "${similarMovie.title}"`);
    }
  }

  // Check for shared genres
  const sharedGenres = recommendedMovie.genre_ids?.filter(id => 
    similarMovie.genre_ids?.includes(id)
  ) || [];
  
  if (sharedGenres.length > 0) {
    explanations.push(`Shares ${sharedGenres.length} genre${sharedGenres.length > 1 ? 's' : ''} with "${similarMovie.title}"`);
  }

  // Check for shared keywords
  const recommendedKeywords = new Set(recommendedFeatures.keywords);
  const similarKeywords = new Set(similarFeatures.keywords);
  const sharedKeywords = Array.from(recommendedKeywords).filter(keyword => similarKeywords.has(keyword));
  
  if (sharedKeywords.length > 0) {
    const keywordSample = sharedKeywords.slice(0, 3).join(', ');
    explanations.push(`Similar themes: ${keywordSample}`);
  }
  
  if (recommendedMovie.vote_average && recommendedMovie.vote_average >= 7.5) {
    explanations.push('Highly rated by audiences');
  }
  
  if (explanations.length === 0) {
    return `Similar to "${similarMovie.title}" based on content and themes`;
  }
  
  return explanations.join(' • ');
} 