import { Link } from "wouter";
import { Eye, Plus, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Director {
  id: number;
  name: string;
}

interface CastMember {
  id: number;
  name: string;
}

interface FeaturedMovieProps {
  id: number;
  title: string;
  overview: string;
  backdropPath: string | null;
  posterPath: string | null;
  releaseDate: string;
  runtime?: number;
  voteAverage: number;
  genres?: { id: number; name: string }[];
  director?: Director;
  cast?: CastMember[];
  isLoading?: boolean;
}

export default function FeaturedMovie({
  id,
  title,
  overview,
  backdropPath,
  posterPath,
  releaseDate,
  runtime,
  voteAverage,
  genres,
  director,
  cast,
  isLoading = false,
}: FeaturedMovieProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const backdropUrl = backdropPath
    ? `https://image.tmdb.org/t/p/original${backdropPath}`
    : 'https://via.placeholder.com/1280x720?text=No+Backdrop';
    
  const posterUrl = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : 'https://via.placeholder.com/500x750?text=No+Poster';
    
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "N/A";
  const rating = (voteAverage * 10).toFixed(0);
  
  // Format runtime from minutes to hours and minutes
  const formatRuntime = (minutes?: number) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
  
  const handleAddToWatchlist = () => {
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
  
  if (isLoading) {
    return (
      <section className="mb-12 bg-muted/30 rounded-xl overflow-hidden">
        <div className="relative">
          <Skeleton className="h-64 md:h-80 w-full" />
          
          <div className="relative z-20 px-6 py-8 md:p-10 flex flex-col md:flex-row -mt-32 md:-mt-48">
            <Skeleton className="w-32 md:w-48 h-48 md:h-72 flex-shrink-0 mx-auto md:mx-0 rounded-md" />
            
            <div className="md:ml-8 mt-6 md:mt-0 text-center md:text-left">
              <Skeleton className="h-8 w-48 mx-auto md:mx-0 mb-2" />
              <Skeleton className="h-6 w-64 mx-auto md:mx-0 mb-4" />
              <Skeleton className="h-10 w-10 mx-auto md:mx-0 mb-4 rounded-full" />
              <Skeleton className="h-4 w-3/4 mx-auto md:mx-0 mb-2" />
              <Skeleton className="h-4 w-full mx-auto md:mx-0 mb-6" />
              <Skeleton className="h-4 w-1/2 mx-auto md:mx-0 mb-2" />
              <Skeleton className="h-4 w-2/3 mx-auto md:mx-0 mb-6" />
              <Skeleton className="h-10 w-32 mx-auto md:mx-0 rounded-md" />
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="mb-12 bg-muted/30 rounded-xl overflow-hidden">
      <div className="relative">
        {/* Banner Image */}
        <div className="h-64 md:h-80 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10"></div>
          <img src={backdropUrl} alt={title} className="w-full h-full object-cover object-top" />
        </div>
        
        {/* Movie Content */}
        <div className="relative z-20 px-6 py-8 md:p-10 flex flex-col md:flex-row -mt-32 md:-mt-48">
          {/* Poster */}
          <div className="w-32 md:w-48 flex-shrink-0 mx-auto md:mx-0">
            <img src={posterUrl} alt={title} className="w-full rounded-md shadow-lg" />
          </div>
          
          {/* Details */}
          <div className="md:ml-8 mt-6 md:mt-0 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-2">
              {rating >= 80 && (
                <span className="bg-muted/70 text-green-500 px-2 py-1 text-xs font-bold rounded mr-2">TOP RATED</span>
              )}
              <span className="text-muted-foreground text-sm">
                {year} • {runtime ? formatRuntime(runtime) : "N/A"}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
            
            <div className="flex items-center space-x-4 mb-4 justify-center md:justify-start">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-muted/70 flex items-center justify-center text-green-500 font-medium text-lg">
                  {rating}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">User<br/>Score</span>
              </div>
              
              <button 
                className="w-10 h-10 rounded-full bg-muted/70 flex items-center justify-center hover:bg-primary transition"
                onClick={handleAddToWatchlist}
                title="Add to watchlist"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              <Link href={`/movie/${id}?rate=true`}>
                <button 
                  className="w-10 h-10 rounded-full bg-muted/70 flex items-center justify-center hover:bg-green-500 transition"
                  title="Rate movie"
                >
                  <Star className="w-5 h-5" />
                </button>
              </Link>
            </div>
            
            {genres && genres.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {genres.map((genre) => (
                    <Link key={genre.id} href={`/search?genre=${genre.id}`}>
                      <span className="bg-muted/70 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-muted/90">
                        {genre.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-muted-foreground mb-6 line-clamp-3 md:line-clamp-none">{overview}</p>
            
            <div className="space-y-3">
              {director && (
                <div>
                  <span className="text-muted-foreground font-medium">Director:</span>
                  <span className="ml-2">{director.name}</span>
                </div>
              )}
              
              {cast && cast.length > 0 && (
                <div>
                  <span className="text-muted-foreground font-medium">Stars:</span>
                  <span className="ml-2">{cast.slice(0, 3).map(c => c.name).join(", ")}</span>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <Link href={`/movie/${id}`} className="inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary/90 rounded-md text-white font-medium">
                <Eye className="w-5 h-5 mr-2" />
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
