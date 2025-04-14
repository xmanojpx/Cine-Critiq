import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewCarousel from "./review-carousel";

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

      {isLoading ? (
        <Skeleton className="w-full h-[400px] rounded-lg" />
      ) : reviews && reviews.length > 0 ? (
        <ReviewCarousel reviews={reviews} />
      ) : (
        <div className="text-center py-10 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">No reviews yet.</p>
        </div>
      )}
    </section>
  );
}
