import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "@/services/tmdb";
import { useQuery } from "@tanstack/react-query";
import { fetchMovieDetails } from "@/services/api";

interface Review {
  id: number;
  userId: number;
  movieId: number;
  movieTitle: string;
  moviePosterPath: string | null;
  rating: number;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: Date;
}

interface ReviewCarouselProps {
  reviews: Review[];
  interval?: number;
}

export default function ReviewCarousel({ reviews, interval = 30000 }: ReviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const currentReview = reviews[currentIndex];

  // Fetch movie details including videos
  const { data: movieDetails } = useQuery({
    queryKey: ["/api/movies", currentReview.movieId],
    queryFn: () => fetchMovieDetails(currentReview.movieId),
  });

  // Get the first available trailer or clip
  const video = movieDetails?.videos?.results.find(
    (v: { site: string; type: string; key: string }) => 
      v.site === "YouTube" && (v.type === "Trailer" || v.type === "Clip")
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex((current) => (current + 1) % reviews.length);
        setIsFlipping(false);
        setShowVideo(false);
      }, 500); // Half a second for the flip animation
    }, interval);

    return () => clearInterval(timer);
  }, [reviews.length, interval]);

  if (!reviews.length) return null;

  const posterUrl = currentReview.moviePosterPath
    ? getImageUrl(currentReview.moviePosterPath, "w500") || "https://via.placeholder.com/500x750?text=No+Poster"
    : "https://via.placeholder.com/500x750?text=No+Poster";

  return (
    <div className="w-full bg-muted/30 rounded-lg overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentReview.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.5
          }}
          className="w-full"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 p-8">
            <div className="w-full md:w-1/3 aspect-[2/3] rounded-lg overflow-hidden relative">
              {showVideo && video ? (
                <motion.iframe
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={`https://www.youtube.com/embed/${video.key}?autoplay=1&mute=1&controls=0&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <motion.img
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={posterUrl}
                  alt={currentReview.movieTitle}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => video && setShowVideo(true)}
                />
              )}
              {!showVideo && video && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
                  onClick={() => setShowVideo(true)}
                >
                  <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
                    <svg 
                      className="w-8 h-8 text-white" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{currentReview.movieTitle}</h3>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-green-500 mr-2">
                    {currentReview.rating}
                  </span>
                  <span className="text-2xl text-green-500">★</span>
                </div>
              </div>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                {currentReview.content}
              </p>
              
              <div className="flex items-center text-sm text-muted-foreground mt-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                    {currentReview.authorName[0].toUpperCase()}
                  </div>
                  <span className="font-medium">{currentReview.authorName}</span>
                </div>
                <span className="mx-2">•</span>
                <span>
                  {new Date(currentReview.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      <div className="flex justify-center gap-2 p-4 bg-background/50">
        {reviews.map((_, index) => (
          <motion.button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-primary" : "bg-muted"
            }`}
            whileHover={{ scale: 1.2 }}
            onClick={() => {
              setCurrentIndex(index);
              setShowVideo(false);
            }}
          />
        ))}
      </div>
    </div>
  );
} 