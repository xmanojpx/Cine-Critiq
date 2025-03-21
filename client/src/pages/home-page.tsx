import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import MovieSection from "@/components/movies/movie-section";
import FeaturedMovie from "@/components/movies/featured-movie";
import ReviewsSection from "@/components/movies/reviews-section";
import GenresSection from "@/components/movies/genres-section";
import { Film, Play } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  // Fetch trending movies
  const { data: trendingMovies, isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/movies/trending"],
  });

  // Fetch movie genres with backdrop images
  const { data: genres, isLoading: genresLoading } = useQuery({
    queryKey: ["/api/genres"],
    select: (data) => {
      // Assign backdrop images to genres (in a real app, these would come from API)
      const genreBackdrops: Record<number, string> = {
        28: "/9PqD3wSIjntyJDBzMNuxuKHwpUD.jpg", // Action
        35: "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg", // Comedy
        18: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", // Drama
        878: "/A3ZbZsmsvNGdprRi2lKgGEeVLEH.jpg", // Science Fiction
        27: "/gPbM0MK8CP8A174rmUwGsADNYKD.jpg", // Horror
        16: "/lZa5EB6PVJBT5mxhgZS5ftqdAm6.jpg", // Animation
      };
      
      return data.map((genre: any) => ({
        ...genre,
        backdropPath: genreBackdrops[genre.id] || null,
      }));
    },
  });

  // Featured movie (using first trending movie)
  const featuredMovie = trendingMovies && trendingMovies.length > 0 ? trendingMovies[0] : null;
  
  // Mock reviews for home page display (in a real app, these would come from API)
  const mockReviews = [
    {
      id: 1,
      userId: 1,
      movieId: 906126,
      movieTitle: "Poor Things",
      moviePosterPath: "/tt6o5eFX0amQI6JkKbYPFbg89rV.jpg",
      rating: 4.5,
      content: "A visually stunning masterpiece with incredible performances. Emma Stone deserves all the accolades for bringing Bella Baxter to life in this bizarre yet beautiful film.",
      authorName: "Alex Johnson",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    },
    {
      id: 2,
      userId: 2,
      movieId: 693134,
      movieTitle: "Dune: Part Two",
      moviePosterPath: "/A3ZbZsmsvNGdprRi2lKgGEeVLEH.jpg",
      rating: 5.0,
      content: "An absolutely epic continuation that expands on everything that made the first film great. Villeneuve has created a sci-fi masterpiece that honors Herbert's vision while standing on its own.",
      authorName: "Maya Wilson",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    },
    {
      id: 3,
      userId: 3,
      movieId: 872585,
      movieTitle: "Oppenheimer",
      moviePosterPath: "/kuf6dutpsT0vSVehic3EZIqkOBt.jpg",
      rating: 4.0,
      content: "Nolan delivers a technically impressive film with an outstanding performance from Cillian Murphy. The non-linear storytelling sometimes works against the narrative, but overall a compelling historical drama.",
      authorName: "David Chen",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    },
    {
      id: 4,
      userId: 4,
      movieId: 961268,
      movieTitle: "Past Lives",
      moviePosterPath: "/m1fgGSLK0WvRpzM1AmMyT8YGUdZ.jpg",
      rating: 4.5,
      content: "A beautiful, quiet meditation on paths not taken and the concept of fate. Celine Song's directorial debut is remarkably assured, with performances that convey volumes through subtle expressions.",
      authorName: "Sophia Kim",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Hero Section */}
        <section className="mb-12 relative overflow-hidden">
          <div className="bg-gradient-to-r from-background via-background/90 to-background/80 absolute inset-0 z-10"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('https://image.tmdb.org/t/p/original/628Dep6AxEtDxjZoGP78TsOxYbK.jpg')] bg-cover bg-center"></div>
          
          <div className="relative z-20 py-16 md:py-24 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Discover & Review <span className="text-primary">Movies</span></h1>
              <p className="text-lg mb-6 text-muted-foreground max-w-md mx-auto md:mx-0">Join the community of film enthusiasts. Rate, review, and discover your next favorite movie.</p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
                <Link href="/search">
                  <button className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-md">
                    Get Started
                  </button>
                </Link>
                <button className="bg-muted/70 hover:bg-muted text-foreground font-medium py-2 px-6 rounded-md flex items-center justify-center">
                  <Play className="w-5 h-5 mr-2" />
                  How it Works
                </button>
              </div>
            </div>
            
            <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center md:justify-end">
              <div className="relative">
                {/* Stacked Movie Posters */}
                <div className="absolute -right-10 -top-6 transform rotate-6 shadow-xl">
                  <img src="https://image.tmdb.org/t/p/w342/6KErczPBROQty7QoIsaa6wJYXZi.jpg" alt="Movie Poster" className="w-32 md:w-40 h-auto rounded-md" />
                </div>
                <div className="absolute -left-10 -top-2 transform -rotate-6 shadow-xl">
                  <img src="https://image.tmdb.org/t/p/w342/7GwRpWMVNvhXzZb0YsxZVnKcGrj.jpg" alt="Movie Poster" className="w-32 md:w-40 h-auto rounded-md" />
                </div>
                <div className="relative z-10 shadow-xl">
                  <img src="https://image.tmdb.org/t/p/w342/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg" alt="Movie Poster" className="w-44 md:w-56 h-auto rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Trending Movies Section */}
        <MovieSection 
          title="Trending Movies" 
          movies={trendingMovies} 
          isLoading={trendingLoading}
          viewAllLink="/search?list=trending" 
        />
        
        {/* Featured Movie */}
        {featuredMovie && (
          <FeaturedMovie
            id={featuredMovie.id}
            title={featuredMovie.title}
            overview={featuredMovie.overview}
            backdropPath={featuredMovie.backdrop_path}
            posterPath={featuredMovie.poster_path}
            releaseDate={featuredMovie.release_date}
            voteAverage={featuredMovie.vote_average}
            genres={featuredMovie.genres || trendingMovies[0].genre_ids?.map((id: number) => ({ id, name: "Loading..." }))}
            isLoading={trendingLoading}
          />
        )}
        
        {/* Latest Reviews */}
        <ReviewsSection
          title="Latest Reviews"
          reviews={mockReviews}
          isLoading={false}
          viewAllLink="/search?tab=reviews"
        />
        
        {/* Genres Section */}
        <GenresSection
          genres={genres}
          isLoading={genresLoading}
        />
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}
