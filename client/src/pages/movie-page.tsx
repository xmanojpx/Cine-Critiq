import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { fetchMovieDetails, addReview, addToWatchlist, removeFromWatchlist } from "@/services/api";
import { getImageUrl } from "@/services/tmdb";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import MovieSection from "@/components/movies/movie-section";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  Clock,
  Plus,
  Check,
  Play,
  Calendar,
  DollarSign,
  BarChart3,
  Share2,
  List,
} from "lucide-react";

export default function MoviePage() {
  const { id } = useParams();
  const movieId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Fetch movie details
  const {
    data: movie,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/movies/${movieId}`],
    queryFn: () => fetchMovieDetails(movieId),
  });

  // Fetch user's watchlist to check if movie is in it
  const { data: watchlist } = useQuery({
    queryKey: [`/api/users/${user?.id}/watchlist`],
    queryFn: () => fetch(`/api/users/${user?.id}/watchlist`).then(res => res.json()),
    enabled: !!user,
  });

  // Check if movie is in watchlist
  useEffect(() => {
    if (watchlist && movieId) {
      const inWatchlist = watchlist.some((item: any) => item.movieId === movieId);
      setIsInWatchlist(inWatchlist);
    }
  }, [watchlist, movieId]);

  // Fetch existing user review
  const { data: movieReviews } = useQuery({
    queryKey: [`/api/movies/${movieId}/reviews`],
    queryFn: () => fetch(`/api/movies/${movieId}/reviews`).then(res => res.json()),
    enabled: !!movieId,
  });

  // Set review form values if user has already reviewed this movie
  useEffect(() => {
    if (movieReviews && user) {
      const userReview = movieReviews.find((review: any) => review.userId === user.id);
      if (userReview) {
        setRating(userReview.rating);
        setReviewText(userReview.content || "");
      }
    }
  }, [movieReviews, user]);

  // Add/update review mutation
  const reviewMutation = useMutation({
    mutationFn: () => addReview(movieId, rating, reviewText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/movies/${movieId}/reviews`] });
      toast({
        title: "Review submitted",
        description: "Your review has been saved successfully",
      });
      setShowRatingDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: () => addToWatchlist(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/watchlist`] });
      setIsInWatchlist(true);
      toast({
        title: "Added to watchlist",
        description: `${movie?.title} has been added to your watchlist`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to watchlist",
        variant: "destructive",
      });
    },
  });

  // Remove from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: () => removeFromWatchlist(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/watchlist`] });
      setIsInWatchlist(false);
      toast({
        title: "Removed from watchlist",
        description: `${movie?.title} has been removed from your watchlist`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove from watchlist",
        variant: "destructive",
      });
    },
  });

  const handleWatchlistToggle = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to manage your watchlist",
        variant: "destructive",
      });
      return;
    }

    if (isInWatchlist) {
      removeFromWatchlistMutation.mutate();
    } else {
      addToWatchlistMutation.mutate();
    }
  };

  const handleReviewSubmit = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to submit a review",
        variant: "destructive",
      });
      return;
    }

    reviewMutation.mutate();
  };

  // Format runtime from minutes to hours and minutes
  const formatRuntime = (minutes?: number) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format monetary values (budget, revenue)
  const formatMoney = (amount?: number) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  // Get director from crew
  const getDirector = () => {
    if (!movie?.credits?.crew) return null;
    return movie.credits.crew.find(person => person.job === "Director");
  };

  const director = getDirector();

  // Custom rating stars component
  const RatingStars = ({ value, onChange }: { value: number | null, onChange: (value: number) => void }) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-2xl ${
              (hoverValue !== null ? star <= hoverValue : star <= (value || 0))
                ? "text-yellow-500"
                : "text-muted"
            }`}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            onClick={() => onChange(star)}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // Default reviews for specific movies
  const defaultReviews: Record<number, any[]> = {
    155: [ // The Dark Knight
      {
        id: 1,
        userId: 1,
        movieId: 155,
        rating: 5,
        content: "Christopher Nolan's masterpiece redefines the superhero genre. Heath Ledger's Joker is one of the greatest performances in cinema history. The film's exploration of chaos and morality is both thrilling and thought-provoking.",
        authorName: "Alex Johnson",
        createdAt: new Date("2024-02-15"),
        user: { username: "Alex Johnson", avatar: null },
        movie: { title: "The Dark Knight", poster_path: "/qJ2tW6WMUDux911r6mFAha3VXxN.jpg" }
      },
      {
        id: 2,
        userId: 2,
        movieId: 155,
        rating: 5,
        content: "A perfect blend of action, drama, and psychological depth. The Dark Knight transcends the superhero genre to become a modern classic. Ledger's performance is hauntingly brilliant.",
        authorName: "Sarah Williams",
        createdAt: new Date("2024-02-10"),
        user: { username: "Sarah Williams", avatar: null },
        movie: { title: "The Dark Knight", poster_path: "/qJ2tW6WMUDux911r6mFAha3VXxN.jpg" }
      }
    ],
    238: [ // The Godfather
      {
        id: 3,
        userId: 3,
        movieId: 238,
        rating: 5,
        content: "A timeless classic that set the standard for all crime dramas. Marlon Brando and Al Pacino deliver unforgettable performances. The film's exploration of power, family, and morality is masterfully executed.",
        authorName: "Michael Chen",
        createdAt: new Date("2024-02-05"),
        user: { username: "Michael Chen", avatar: null },
        movie: { title: "The Godfather", poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg" }
      }
    ],
    550: [ // Fight Club
      {
        id: 4,
        userId: 4,
        movieId: 550,
        rating: 4.5,
        content: "David Fincher's dark and twisted masterpiece. The film's commentary on consumerism and masculinity is as relevant today as it was in 1999. Brad Pitt and Edward Norton deliver career-defining performances.",
        authorName: "Emma Davis",
        createdAt: new Date("2024-02-01"),
        user: { username: "Emma Davis", avatar: null },
        movie: { title: "Fight Club", poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" }
      }
    ],
    680: [ // Pulp Fiction
      {
        id: 5,
        userId: 5,
        movieId: 680,
        rating: 5,
        content: "Quentin Tarantino's non-linear storytelling masterpiece. The film's sharp dialogue, memorable characters, and unexpected twists make it one of the most influential films of the 90s.",
        authorName: "James Wilson",
        createdAt: new Date("2024-01-28"),
        user: { username: "James Wilson", avatar: null },
        movie: { title: "Pulp Fiction", poster_path: "/d5iIlFn5s0ImszYzBPb8JPJbDQI.jpg" }
      }
    ]
  };

  // Get reviews for the current movie
  const currentMovieReviews = movieId ? defaultReviews[movieId] || [] : [];

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-10">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Error Loading Movie</h2>
            <p className="text-muted-foreground mb-6">
              We encountered an error while loading this movie. Please try again later.
            </p>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Movie Header Section */}
        <div className="relative">
          {/* Backdrop Image */}
          <div className="h-[300px] md:h-[400px] lg:h-[500px] relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/50 z-10"></div>
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : movie?.backdrop_path ? (
              <img 
                src={getImageUrl(movie.backdrop_path, "original") ?? "https://via.placeholder.com/1280x720?text=No+Backdrop"} 
                alt={movie.title || "Movie backdrop"}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/1280x720?text=No+Backdrop";
                }}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No backdrop available</span>
              </div>
            )}
          </div>
          
          {/* Movie Info Overlay */}
          <div className="container mx-auto px-4">
            <div className="relative -mt-40 md:-mt-60 z-20 flex flex-col md:flex-row pb-6">
              {/* Poster */}
              <div className="w-32 md:w-64 mx-auto md:mx-0 flex-shrink-0">
                {isLoading ? (
                  <Skeleton className="w-full aspect-[2/3] rounded-md" />
                ) : (
                  <img 
                    src={movie?.poster_path 
                      ? getImageUrl(movie.poster_path, "w500") ?? "https://via.placeholder.com/500x750?text=No+Poster"
                      : "https://via.placeholder.com/500x750?text=No+Poster"
                    } 
                    alt={movie?.title || "Movie poster"}
                    className="w-full rounded-md shadow-lg"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/500x750?text=No+Poster";
                    }}
                  />
                )}
              </div>
              
              {/* Details */}
              <div className="md:ml-8 mt-6 md:mt-0 text-center md:text-left flex flex-col">
                {isLoading ? (
                  <>
                    <Skeleton className="h-10 w-3/4 mx-auto md:mx-0 mb-2" />
                    <Skeleton className="h-6 w-1/2 mx-auto md:mx-0 mb-4" />
                    <div className="flex justify-center md:justify-start space-x-4 mb-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-full md:w-3/4 mx-auto md:mx-0 mb-4" />
                    <Skeleton className="h-6 w-full md:w-3/4 mx-auto md:mx-0 mb-4" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center md:justify-start mb-1 text-sm">
                      <span className="text-muted-foreground">
                        {new Date(movie?.release_date || "").getFullYear()} • {movie?.runtime ? formatRuntime(movie.runtime) : "N/A"}
                      </span>
                    </div>
                    
                    <h1 className="text-2xl md:text-4xl font-bold mb-2">{movie?.title}</h1>
                    
                    {movie?.tagline && (
                      <p className="text-muted-foreground italic mb-4">{movie.tagline}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 mb-4 justify-center md:justify-start">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-green-500 font-bold">
                          {Math.round((movie?.vote_average ?? 0) * 10)}
                        </div>
                      </div>
                      
                      <button 
                        className={`w-10 h-10 rounded-full ${isInWatchlist ? 'bg-primary text-white' : 'bg-muted/70 hover:bg-primary/80 hover:text-white'} flex items-center justify-center transition-colors`}
                        onClick={handleWatchlistToggle}
                        title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                      >
                        {isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </button>
                      
                      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                        <DialogTrigger asChild>
                          <button 
                            className="w-10 h-10 rounded-full bg-muted/70 hover:bg-secondary hover:text-white flex items-center justify-center transition-colors"
                            title="Rate this movie"
                          >
                            <Star className="w-5 h-5" />
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rate & Review: {movie?.title}</DialogTitle>
                            <DialogDescription>
                              Share your thoughts about this movie with the community
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="py-4 space-y-4">
                            <div className="flex flex-col items-center space-y-2">
                              <p className="text-sm text-muted-foreground">Your Rating</p>
                              <RatingStars value={rating} onChange={setRating} />
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">Your Review (Optional)</p>
                              <Textarea 
                                placeholder="Write your thoughts about this movie..."
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                rows={5}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => setShowRatingDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleReviewSubmit}
                              disabled={!rating || reviewMutation.isPending}
                            >
                              {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <button 
                        className="w-10 h-10 rounded-full bg-muted/70 hover:bg-muted flex items-center justify-center transition-colors"
                        title="Add to list"
                      >
                        <List className="w-5 h-5" />
                      </button>
                      
                      <button 
                        className="w-10 h-10 rounded-full bg-muted/70 hover:bg-muted flex items-center justify-center transition-colors"
                        title="Share movie"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {movie?.genres && movie.genres.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                          {movie.genres.map((genre) => (
                            <Link key={genre.id} href={`/search?genre=${genre.id}`}>
                              <span className="bg-muted/70 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-muted/90">
                                {genre.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-3xl">
                      {movie?.overview}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      {director && (
                        <div>
                          <span className="text-muted-foreground font-medium">Director:</span>
                          <span className="ml-2">{director.name}</span>
                        </div>
                      )}
                      
                      {movie?.credits?.cast && movie.credits.cast.length > 0 && (
                        <div>
                          <span className="text-muted-foreground font-medium">Stars:</span>
                          <span className="ml-2">
                            {movie.credits.cast.slice(0, 3).map(actor => actor.name).join(", ")}
                            {movie.credits.cast.length > 3 && ", ..."}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Movie Content Tabs */}
        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="cast">Cast & Crew</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-8">
              {/* Movie Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-muted/30 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Calendar className="w-5 h-5 text-primary mr-2" />
                    <h3 className="text-lg font-medium">Release Date</h3>
                  </div>
                  <p className="text-muted-foreground">
                    {movie?.release_date 
                      ? new Date(movie.release_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : "N/A"
                    }
                  </p>
                </div>
                
                <div className="bg-muted/30 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Clock className="w-5 h-5 text-primary mr-2" />
                    <h3 className="text-lg font-medium">Runtime</h3>
                  </div>
                  <p className="text-muted-foreground">{movie?.runtime ? formatRuntime(movie.runtime) : "N/A"}</p>
                </div>
                
                <div className="bg-muted/30 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <DollarSign className="w-5 h-5 text-primary mr-2" />
                    <h3 className="text-lg font-medium">Budget</h3>
                  </div>
                  <p className="text-muted-foreground">{formatMoney(movie?.budget)}</p>
                </div>
                
                <div className="bg-muted/30 p-5 rounded-lg">
                  <div className="flex items-center mb-3">
                    <BarChart3 className="w-5 h-5 text-primary mr-2" />
                    <h3 className="text-lg font-medium">Revenue</h3>
                  </div>
                  <p className="text-muted-foreground">{formatMoney(movie?.revenue)}</p>
                </div>
              </div>
              
              {/* Similar Movies */}
              {movie?.similar?.results && movie.similar.results.length > 0 && (
                <MovieSection
                  title="Similar Movies"
                  movies={movie.similar.results.slice(0, 10)}
                  isLoading={isLoading}
                />
              )}
              
              {/* Recommended Movies */}
              {movie?.recommendations?.results && movie.recommendations.results.length > 0 && (
                <MovieSection
                  title="Recommendations"
                  movies={movie.recommendations.results.slice(0, 10)}
                  isLoading={isLoading}
                />
              )}
            </TabsContent>
            
            <TabsContent value="cast">
              {/* Cast Section */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Cast</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <Skeleton className="w-full aspect-square rounded-full mb-2" />
                          <Skeleton className="h-4 w-2/3 mb-1" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))
                    ) : (
                      movie?.credits?.cast?.slice(0, 12).map((actor) => (
                        <div key={actor.id} className="flex flex-col items-center text-center">
                          <div className="w-full aspect-square rounded-full overflow-hidden mb-2 bg-muted">
                            <img
                              src={actor.profile_path
                                ? getImageUrl(actor.profile_path, "w154") ?? "https://via.placeholder.com/185x185?text=No+Image"
                                : "https://via.placeholder.com/185x185?text=No+Image"
                              }
                              alt={actor.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "https://via.placeholder.com/185x185?text=No+Image";
                              }}
                            />
                          </div>
                          <h4 className="font-medium text-sm">{actor.name}</h4>
                          <p className="text-xs text-muted-foreground">{actor.character}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Crew Section */}
                <div>
                  <h2 className="text-2xl font-bold mb-6">Crew</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))
                    ) : (
                      movie?.credits?.crew?.filter(person => 
                        ["Director", "Producer", "Screenplay", "Story", "Writer", "Director of Photography"].includes(person.job)
                      ).slice(0, 8).map((crewMember) => (
                        <div key={`${crewMember.id}-${crewMember.job}`} className="bg-muted/30 p-4 rounded-lg">
                          <h4 className="font-medium">{crewMember.name}</h4>
                          <p className="text-sm text-muted-foreground">{crewMember.job}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews">
              {/* Reviews Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">User Reviews</h2>
                  <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                    <DialogTrigger asChild>
                      <Button>Write a Review</Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
                
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-40" />
                  ))
                ) : (movieReviews && movieReviews.length > 0) || currentMovieReviews.length > 0 ? (
                  <div className="space-y-6">
                    {movieReviews?.map((review: any) => (
                      <div key={review.id} className="bg-muted/30 rounded-lg p-6">
                        <div className="flex justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                              {review.user?.username?.[0].toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="font-medium">{review.user?.username || "User"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-green-500 mr-1">{review.rating}</span>
                            <Star className="w-4 h-4 text-green-500 fill-current" />
                          </div>
                        </div>
                        <p className="text-muted-foreground">{review.content || "No written review."}</p>
                      </div>
                    ))}
                    {currentMovieReviews.map((review) => (
                      <div key={review.id} className="bg-muted/30 rounded-lg p-6">
                        <div className="flex justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                              {review.user?.username?.[0].toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="font-medium">{review.user?.username || "User"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-green-500 mr-1">{review.rating}</span>
                            <Star className="w-4 h-4 text-green-500 fill-current" />
                          </div>
                        </div>
                        <p className="text-muted-foreground">{review.content || "No written review."}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-muted/30 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground mb-4">Be the first to review this movie!</p>
                    <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                      <DialogTrigger asChild>
                        <Button>Write a Review</Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}
