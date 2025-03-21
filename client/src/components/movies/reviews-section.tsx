import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import ReviewCard from "./review-card";
import { Skeleton } from "@/components/ui/skeleton";

interface Review {
  id: number;
  userId: number;
  movieId: number;
  movieTitle: string;
  moviePosterPath: string | null;
  rating: number;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: Date;
}

interface ReviewsSectionProps {
  title: string;
  reviews: Review[] | undefined;
  isLoading: boolean;
  viewAllLink?: string;
}

export default function ReviewsSection({ title, reviews, isLoading, viewAllLink }: ReviewsSectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
            More Reviews
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted/30 rounded-lg p-5 flex">
                <Skeleton className="w-16 h-24 rounded-md mr-4" />
                <div className="flex-grow space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-10" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center pt-2">
                    <Skeleton className="h-5 w-5 rounded-full mr-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))
          : reviews?.map((review) => (
              <ReviewCard
                key={review.id}
                id={review.id}
                movieId={review.movieId}
                movieTitle={review.movieTitle}
                moviePosterPath={review.moviePosterPath}
                rating={review.rating}
                content={review.content}
                authorId={review.userId}
                authorName={review.authorName}
                authorAvatar={review.authorAvatar}
                createdAt={review.createdAt}
              />
            ))}
      </div>
      
      {reviews && reviews.length === 0 && !isLoading && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No reviews yet.</p>
        </div>
      )}
    </section>
  );
}
