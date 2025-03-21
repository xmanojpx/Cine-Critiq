import { useState, useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
}

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchMovies = async () => {
      if (debouncedSearchTerm.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${debouncedSearchTerm}&page=1`);
        const data = await res.json();
        setResults(data.results.slice(0, 5));
      } catch (error) {
        console.error("Error searching movies:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchMovies();
  }, [debouncedSearchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowResults(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowResults(false);
    }
  };

  const formatYear = (dateString: string) => {
    return dateString ? new Date(dateString).getFullYear() : "";
  };

  return (
    <div className="relative" ref={searchRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search movies, directors, actors..."
            className="w-full px-4 py-2 bg-muted/30 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            value={searchTerm}
            onChange={handleSearch}
            onFocus={() => setShowResults(true)}
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (searchTerm.length > 1 || results.length > 0) && (
        <div className="absolute mt-1 w-full bg-background rounded-md shadow-lg border border-border z-20">
          {isSearching ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
          ) : results.length > 0 ? (
            <>
              {results.map((result) => (
                <a
                  key={result.id}
                  href={`/movie/${result.id}`}
                  className="block px-4 py-2 hover:bg-muted/30 flex items-center"
                  onClick={() => setShowResults(false)}
                >
                  <img
                    src={
                      result.poster_path
                        ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
                        : "https://via.placeholder.com/92x138?text=No+Poster"
                    }
                    alt={result.title}
                    className="w-8 h-12 object-cover rounded-sm mr-3"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-medium">{result.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatYear(result.release_date)}
                    </p>
                  </div>
                </a>
              ))}
              <div className="border-t border-border px-4 py-2">
                <button
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                    setShowResults(false);
                  }}
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  View all results
                </button>
              </div>
            </>
          ) : searchTerm.length > 1 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No results found for "{searchTerm}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
