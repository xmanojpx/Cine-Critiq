import { Link } from "wouter";

interface GenreCardProps {
  id: number;
  name: string;
  backdropPath: string | null;
}

export default function GenreCard({ id, name, backdropPath }: GenreCardProps) {
  const backdropUrl = backdropPath
    ? `https://image.tmdb.org/t/p/w500${backdropPath}`
    : 'https://via.placeholder.com/500x250?text=No+Image';
    
  return (
    <Link href={`/search?genre=${id}`}>
      <div className="aspect-[3/2] relative rounded-lg overflow-hidden group cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent z-10"></div>
        <img 
          src={backdropUrl} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 w-full p-3 z-20">
          <h3 className="font-medium">{name}</h3>
        </div>
      </div>
    </Link>
  );
}
