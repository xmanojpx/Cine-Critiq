import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ReviewCardProps {
  id: number;
  movieId: number;
  movieTitle: string;
  moviePosterPath: string | null;
  rating: number;
  content: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: Date;
}

export default function ReviewCard({
  id,
  movieId,
  movieTitle,
  moviePosterPath,
  rating,
  content,
  authorId,
  authorName,
  authorAvatar,
  createdAt,
}: ReviewCardProps) {
  const posterUrl = moviePosterPath
    ? `https://image.tmdb.org/t/p/w154${moviePosterPath}`
    : 'https://via.placeholder.com/154x231?text=No+Poster';
    
  const formattedDate = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  return (
    <div className="bg-muted/30 rounded-lg p-6 flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <Link href={`/movie/${movieId}`}>
          <div className="w-16 h-24 bg-muted rounded overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity">
            <img
              src={posterUrl}
              alt={movieTitle}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-2">
            <Link href={`/movie/${movieId}`}>
              <h3 className="text-lg font-bold hover:text-primary transition-colors">
                {movieTitle}
              </h3>
            </Link>
            <div className="flex items-center">
              <span className="text-green-500 font-bold text-lg">{rating.toFixed(1)}</span>
              <span className="text-green-500 ml-1">★</span>
            </div>
          </div>
          <p className="text-muted-foreground line-clamp-3">{content}</p>
        </div>
      </div>
      
      <div className="flex items-center text-sm text-muted-foreground mt-auto">
        <Link href={`/profile/${authorId}`}>
          <div className="flex items-center hover:text-primary transition-colors">
            <Avatar className="w-6 h-6 mr-2">
              {authorAvatar ? (
                <img src={authorAvatar} alt={authorName} />
              ) : (
                <AvatarFallback className="text-xs bg-muted">
                  {getInitials(authorName)}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="font-medium">{authorName}</span>
          </div>
        </Link>
        <span className="mx-2">•</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}
