import { Movie, Genre } from '../types';

// Interface for content features
interface ContentFeatures {
  themeEmbedding: number[];
  genreEmbedding: number[];
  toneEmbedding: number[];
}

// Convert text to a simple numeric representation
function textToVector(text: string, size: number = 100): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(size).fill(0);
  
  words.forEach((word, i) => {
    const hash = Math.abs(hashCode(word)) % size;
    vector[hash] += 1;
  });
  
  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => magnitude === 0 ? 0 : val / magnitude);
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

// Extract content features using text vectorization
async function extractContentFeatures(movie: Movie): Promise<ContentFeatures> {
  // Process title and overview
  const titleVector = textToVector(movie.title || '', 100);
  const overviewVector = textToVector(movie.overview || '', 100);
  const genreText = (movie.genres || []).map(g => g.name).join(' ');
  const genreVector = textToVector(genreText, 100);
  
  return {
    themeEmbedding: titleVector,
    genreEmbedding: genreVector,
    toneEmbedding: overviewVector
  };
}

// Calculate content similarity between two movies
function calculateContentSimilarity(features1: ContentFeatures, features2: ContentFeatures): number {
  const themeSimilarity = cosineSimilarity(features1.themeEmbedding, features2.themeEmbedding);
  const genreSimilarity = cosineSimilarity(features1.genreEmbedding, features2.genreEmbedding);
  const toneSimilarity = cosineSimilarity(features1.toneEmbedding, features2.toneEmbedding);
  
  // Weighted average of similarities
  return (themeSimilarity * 0.4 + genreSimilarity * 0.4 + toneSimilarity * 0.2);
}

// Helper function to calculate cosine similarity
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }
  
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (norm1 * norm2);
}

export {
  ContentFeatures,
  extractContentFeatures,
  calculateContentSimilarity
}; 