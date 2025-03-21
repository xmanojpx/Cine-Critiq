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
    ? `https://image.tmdb.org/t/p/w185${moviePosterPath}`
    : 'https://via.placeholder.com/185x278?text=No+Poster';
    
  const formattedDate = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  return (
    <div className="bg-muted/30 rounded-lg p-5 flex">
      <div className="flex-shrink-0 mr-4">
        <Link href={`/movie/${movieId}`}>
          <div className="w-16 h-24 rounded-md overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity">
            <img src={posterUrl} alt={movieTitle} className="w-full h-full object-cover" />
          </div>
        </Link>
      </div>
      
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-2">
          <Link href={`/movie/${movieId}`}>
            <h3 className="font-medium hover:text-primary cursor-pointer">{movieTitle}</h3>
          </Link>
          <div className="flex items-center">
            <div className="text-green-500 font-medium">{rating.toFixed(1)}</div>
            <div className="text-green-500 ml-1">★</div>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-3 mb-3">{content}</p>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Link href={`/profile/${authorId}`}>
            <div className="flex items-center hover:text-primary cursor-pointer">
              <Avatar className="w-5 h-5 mr-2">
                {authorAvatar ? (
                  <img src={authorAvatar} alt={authorName} />
                ) : (
                  <AvatarFallback className="text-[10px] bg-muted">
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
    </div>
  );
}
