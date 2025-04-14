import { Link } from "wouter";
import { Plus, Star } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
}

export default function MovieCard({ id, title, posterPath, releaseDate, voteAverage }: MovieCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const posterUrl = !imageError && posterPath 
    ? `https://image.tmdb.org/t/p/w500${posterPath}` 
    : 'https://via.placeholder.com/500x750?text=' + encodeURIComponent(title || 'No Poster');
    
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "N/A";
  const rating = Math.round(voteAverage * 10);
  
  const ratingColor = rating >= 70 ? "text-green-500" : rating >= 50 ? "text-yellow-500" : "text-red-500";
  
  const handleImageError = () => {
    setImageError(true);
  };

  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to add to watchlist");
      await apiRequest("POST", "/api/watchlist", { movieId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/watchlist`] });
      toast({
        title: "Added to watchlist",
        description: `${title} has been added to your watchlist`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to watchlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddToWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to add movies to your watchlist",
        variant: "destructive",
      });
      return;
    }
    
    addToWatchlistMutation.mutate();
  };
  
  const handleRateMovie = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to rate movies",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to movie page where rating can be done
    window.location.href = `/movie/${id}?rate=true`;
  };
  
  return (
    <Link href={`/movie/${id}`}>
      <div 
        className="movie-card group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-md aspect-[2/3] bg-muted">
          <img 
            src={posterUrl}
            alt={`${title} Poster`}
            className={`w-full h-full object-cover ${isHovered ? 'scale-105' : ''} transition-transform duration-300 ease-in-out`}
            loading="lazy"
            onError={handleImageError}
          />
          
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 w-full p-3">
                <div className="flex items-center space-x-2">
                  <button 
                    className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:bg-primary transition"
                    title="Add to Watchlist"
                    onClick={handleAddToWatchlist}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:bg-green-500 transition"
                    title="Rate this movie"
                    onClick={handleRateMovie}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute top-2 right-2">
            <div className="bg-background/80 rounded-md px-2 py-1 text-xs font-medium">
              <span className={ratingColor}>{rating}%</span>
            </div>
          </div>
        </div>
        
        <div className="mt-2">
          <h3 className="text-sm font-medium line-clamp-2">{title}</h3>
          <div className="flex items-center mt-1">
            <span className="text-xs text-muted-foreground">{year}</span>
            <div className={`ml-auto flex items-center ${ratingColor}`}>
              <Star className="w-3 h-3 mr-1" />
              <span className="text-xs">{rating}%</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
