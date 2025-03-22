import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Movie } from "@/types/movie";
import MovieCard from "@/components/movies/movie-card";
import SearchBar from "@/components/search/search-bar";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState("movies");
  const [activeList, setActiveList] = useState(searchParams.get("list") || "trending");
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get("genre") || "");
  const [searchInputValue, setSearchInputValue] = useState(searchParams.get("q") || "");

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    
    if (activeList && !searchQuery) {
      params.set("list", activeList);
    }
    
    if (selectedGenre && selectedGenre !== "all") {
      params.set("genre", selectedGenre);
    }
    
    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }
    
    const newSearch = params.toString() ? `?${params.toString()}` : "";
    
    // Only update if different to avoid loops
    if (location !== `/search${newSearch}`) {
      setLocation(`/search${newSearch}`, { replace: true });
    }
  }, [searchQuery, activeList, selectedGenre, currentPage, setLocation]);

  // Fetch genres for filter dropdown
  const { data: genres, isLoading: isGenresLoading } = useQuery({
    queryKey: ["/api/genres"],
  });

  // Fetch movies based on current filters
  const {
    data: moviesData,
    isLoading: isMoviesLoading,
    error,
  } = useQuery({
    queryKey: [
      searchQuery
        ? `/api/search?q=${encodeURIComponent(searchQuery)}&page=${currentPage}`
        : selectedGenre
        ? `/api/genres/${selectedGenre}/movies?page=${currentPage}`
        : `/api/movies/${activeList}?page=${currentPage}`,
    ],
  });

  // Update total pages when data changes
  useEffect(() => {
    if (moviesData) {
      if ('total_pages' in moviesData) {
        setTotalPages(moviesData.total_pages > 100 ? 100 : moviesData.total_pages); // TMDb API limits to 500 pages but we limit to 100
      } else {
        setTotalPages(1);
      }
    }
  }, [moviesData]);

  // Extract movies from response
  const movies: Movie[] = moviesData?.results || moviesData || [];

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInputValue);
    setCurrentPage(1);
    setActiveList("");
    setSelectedGenre("");
  };

  // Handle list selection
  const handleListChange = (value: string) => {
    setActiveList(value);
    setSelectedGenre("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Handle genre selection
  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
    setActiveList("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  // Get page title based on current filters
  const getPageTitle = () => {
    if (searchQuery) {
      return `Search Results: "${searchQuery}"`;
    }
    
    if (selectedGenre && genres) {
      const genreName = genres.find((g: any) => g.id.toString() === selectedGenre)?.name;
      return genreName ? `${genreName} Movies` : "Genre Movies";
    }
    
    switch (activeList) {
      case "trending":
        return "Trending Movies";
      case "popular":
        return "Popular Movies";
      case "top_rated":
        return "Top Rated Movies";
      case "upcoming":
        return "Upcoming Movies";
      default:
        return "Discover Movies";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">{getPageTitle()}</h1>
          
          {/* Filter and Search Controls */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <form onSubmit={handleSearch} className="flex-1 flex space-x-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search movies..."
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit" className="shrink-0">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
            
            <div className="flex space-x-2">
              <Select value={activeList} onValueChange={handleListChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select List" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="top_rated">Top Rated</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedGenre} onValueChange={handleGenreChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select Genre" />
                </SelectTrigger>
                <SelectContent>
                  {isGenresLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="all">All Genres</SelectItem>
                      {genres?.map((genre: any) => (
                        <SelectItem key={genre.id} value={genre.id.toString()}>
                          {genre.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Content Tabs */}
        <Tabs defaultValue="movies" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full max-w-md grid grid-cols-2 mb-8">
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="movies">
            {error ? (
              <div className="text-center py-10">
                <h2 className="text-xl font-medium mb-2">Error Loading Data</h2>
                <p className="text-muted-foreground mb-4">Failed to load movies. Please try again later.</p>
                <Button asChild>
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            ) : isMoviesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <Skeleton className="aspect-[2/3] w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : movies.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {movies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      id={movie.id}
                      title={movie.title}
                      posterPath={movie.poster_path}
                      releaseDate={movie.release_date}
                      voteAverage={movie.vote_average}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-10 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        // Show pages around current page
                        let pageNum = currentPage;
                        if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        if (pageNum <= 0 || pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-9 h-9 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {currentPage < totalPages - 2 && (
                        <>
                          <span className="text-muted-foreground">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(totalPages)}
                            className="w-9 h-9 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <h2 className="text-xl font-medium mb-2">No Results Found</h2>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No movies matching "${searchQuery}"` 
                    : "No movies found with the current filters"}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reviews">
            <div className="text-center py-16">
              <h2 className="text-xl font-medium mb-2">Coming Soon</h2>
              <p className="text-muted-foreground mb-4">
                We're working on a dedicated reviews section. Check back soon!
              </p>
              <Button onClick={() => setActiveTab("movies")}>
                Browse Movies
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}
