import GenreCard from "./genre-card";
import { Skeleton } from "@/components/ui/skeleton";

interface Genre {
  id: number;
  name: string;
  backdropPath: string | null;
}

interface GenresSectionProps {
  genres: Genre[] | undefined;
  isLoading: boolean;
}

export default function GenresSection({ genres, isLoading }: GenresSectionProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Browse by Genre</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/2] rounded-lg" />
            ))
          : genres?.map((genre) => (
              <GenreCard
                key={genre.id}
                id={genre.id}
                name={genre.name}
                backdropPath={genre.backdropPath}
              />
            ))}
      </div>
    </section>
  );
}
