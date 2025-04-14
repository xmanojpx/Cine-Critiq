import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import MovieCard from "@/components/movies/movie-card";
import { Movie } from "@/types/movie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, X, Film } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Recommendation {
  movie: Movie;
  explanation: string;
}

export default function RecommendationsPage() {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Search movies
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["/api/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to search movies");
      const data = await response.json();
      return data.results as Movie[];
    },
    enabled: searchQuery.length > 2
  });

  // Get recommendations
  const { mutate: getRecommendations, isPending: isLoadingRecommendations } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/recommendations/ml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieIds: selectedMovies.map(m => m.id) })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get recommendations");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setRecommendations(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddMovie = (movie: Movie) => {
    if (selectedMovies.some(m => m.id === movie.id)) {
      toast({
        title: "Movie already added",
        description: "This movie is already in your selection.",
        variant: "destructive"
      });
      return;
    }
    setSelectedMovies([...selectedMovies, movie]);
    setSearchQuery("");
  };

  const handleRemoveMovie = (movieId: number) => {
    setSelectedMovies(selectedMovies.filter(m => m.id !== movieId));
  };

  const handleGetRecommendations = () => {
    if (selectedMovies.length === 0) {
      toast({
        title: "No movies selected",
        description: "Please select at least one movie to get recommendations.",
        variant: "destructive"
      });
      return;
    }
    getRecommendations();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Movie Recommendations</h1>
          
          {/* Movie Selection */}
          <div className="space-y-6 mb-8">
            <div className="space-y-4">
              <Label>Search and select movies you like</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Search Results */}
              {searchQuery.length > 2 && (
                <Card className="relative">
                  <ScrollArea className="h-[300px]">
                    <CardContent className="p-2">
                      {isSearching ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : searchResults?.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No movies found
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {searchResults?.map((movie) => (
                            <div
                              key={movie.id}
                              className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                              onClick={() => handleAddMovie(movie)}
                            >
                              <div className="flex items-center space-x-3">
                                {movie.poster_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-12 h-16 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                                    <Film className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{movie.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {movie.release_date?.split("-")[0]}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </ScrollArea>
                </Card>
              )}
            </div>

            {/* Selected Movies */}
            <div className="space-y-2">
              <Label>Selected Movies</Label>
              <div className="flex flex-wrap gap-2">
                {selectedMovies.map((movie) => (
                  <Badge
                    key={movie.id}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{movie.title}</span>
                    <button
                      onClick={() => handleRemoveMovie(movie.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedMovies.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No movies selected yet
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleGetRecommendations}
              disabled={selectedMovies.length === 0 || isLoadingRecommendations}
              className="w-full"
            >
              {isLoadingRecommendations ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Recommendations...
                </>
              ) : (
                "Get Recommendations"
              )}
            </Button>
          </div>

          {/* Recommendations Results */}
          {recommendations.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Recommended Movies</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map(({ movie, explanation }) => (
                  <div key={movie.id} className="relative group">
                    <div className="absolute -top-2 left-2 right-2 bg-background/95 p-2 rounded-t-lg text-sm text-muted-foreground z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      {explanation}
                    </div>
                    <MovieCard
                      id={movie.id}
                      title={movie.title}
                      posterPath={movie.poster_path}
                      releaseDate={movie.release_date}
                      voteAverage={movie.vote_average}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileNavigation />
      <Footer />
    </div>
  );
} 