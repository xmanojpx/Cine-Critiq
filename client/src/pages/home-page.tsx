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
import { Movie } from "@/types/movie";

export default function HomePage() {
  // Fetch trending movies
  const { data: trendingMovies, isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/movies/trending"],
  });

  // Fetch movie genres with backdrop images
  const { data: genres, isLoading: genresLoading } = useQuery({
    queryKey: ["/api/genres"],
    select: (data: any[]) => {
      // Assign backdrop images to genres using popular movies from each genre
      const genreBackdrops: Record<number, string> = {
        28: "/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg", // Action - The Dark Knight
        12: "/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg", // Adventure - Raiders of the Lost Ark
        16: "/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg", // Animation - Spirited Away
        35: "/7jjwdoIVPJp7gcDo9uE1sVZi2Rs.jpg", // Comedy - Superbad
        80: "/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg", // Crime - The Godfather
        99: "/k2twTjSddgLc1oFFHVibfxp2kQV.jpg", // Documentary - Free Solo
        18: "/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg", // Drama - The Shawshank Redemption
        10751: "/3Rfvhy1Nl6sSGJwyjb0QiZzZYlB.jpg", // Family - E.T.
        14: "/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg", // Fantasy - Lord of the Rings
        36: "/zb6fM1CX41D9rF9hdgclu0peUmy.jpg", // History - Gladiator
        27: "/bXXer71bjbBIAyYStUuO6QheiNv.jpg", // Horror - The Exorcist (updated)
        10402: "/7dzngS8pLkGJpyeskCFcjPO9qLF.jpg", // Music - Whiplash
        9648: "/7PzJdsLGlR7oW4J0J5Xcd0pHGRg.jpg", // Mystery - Shutter Island (updated)
        10749: "/qom1SZSENdmHFNZBXbtJAU0WTlC.jpg", // Romance - The Notebook
        878: "/5bzPWQ2dFUl2aZKkp7ILJVVkRed.jpg", // Sci-Fi - Blade Runner 2049
        53: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg", // Thriller - Silence of the Lambs
        10752: "/bdD39MpSVhKjxarTxLSfX6baoMP.jpg", // War - Saving Private Ryan
        37: "/uK15I3sGd8AudO9z6J6vi0HH1UU.jpg", // Western - Once Upon a Time in the West
      };
      
      return data.map((genre) => ({
        ...genre,
        backdropPath: genreBackdrops[genre.id] || "/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg", // Fallback to Shawshank backdrop
      }));
    },
  });

  // Featured movie (using first trending movie)
  const featuredMovie = trendingMovies && Array.isArray(trendingMovies) && trendingMovies.length > 0 ? trendingMovies[0] : null;
  
  // Default reviews for popular movies
  const defaultReviews = [
    {
      id: 1,
      userId: 1,
      movieId: 155, // The Dark Knight
      movieTitle: "The Dark Knight",
      moviePosterPath: "/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg", // Updated Dark Knight poster
      rating: 5,
      content: "Christopher Nolan's masterpiece redefines the superhero genre. Heath Ledger's Joker is one of the greatest performances in cinema history. The film's exploration of chaos and morality is both thrilling and thought-provoking.",
      authorName: "Alex Johnson",
      createdAt: new Date("2024-02-15"),
    },
    {
      id: 2,
      userId: 2,
      movieId: 238, // The Godfather
      movieTitle: "The Godfather",
      moviePosterPath: "/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg", // Verified Godfather poster
      rating: 5,
      content: "A timeless classic that set the standard for all crime dramas. Marlon Brando and Al Pacino deliver unforgettable performances. The film's exploration of power, family, and morality is masterfully executed.",
      authorName: "Sarah Williams",
      createdAt: new Date("2024-02-10"),
    },
    {
      id: 3,
      userId: 3,
      movieId: 550, // Fight Club
      movieTitle: "Fight Club",
      moviePosterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", // Verified Fight Club poster
      rating: 4.5,
      content: "David Fincher's dark and twisted masterpiece. The film's commentary on consumerism and masculinity is as relevant today as it was in 1999. Brad Pitt and Edward Norton deliver career-defining performances.",
      authorName: "Michael Chen",
      createdAt: new Date("2024-02-05"),
    },
    {
      id: 4,
      userId: 4,
      movieId: 680, // Pulp Fiction
      movieTitle: "Pulp Fiction",
      moviePosterPath: "/plnlrtBUULT0rh3Xsjmpubiso3L.jpg", // Verified Pulp Fiction poster
      rating: 5,
      content: "Quentin Tarantino's non-linear storytelling masterpiece. The film's sharp dialogue, memorable characters, and unexpected twists make it one of the most influential films of the 90s.",
      authorName: "Emma Davis",
      createdAt: new Date("2024-02-01"),
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
          movies={trendingMovies as Movie[]} 
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
            genres={featuredMovie.genres || (Array.isArray(trendingMovies) && trendingMovies[0]?.genre_ids?.map((id: number) => ({ id, name: "Loading..." })))}
            isLoading={trendingLoading}
          />
        )}
        
        {/* Latest Reviews */}
        <ReviewsSection
          title="Latest Reviews"
          reviews={defaultReviews}
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
