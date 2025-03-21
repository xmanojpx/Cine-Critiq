import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import MovieCard from "@/components/movies/movie-card";
import { apiRequest } from "@/lib/queryClient";
import { createList, addMovieToList, removeFromWatchlist } from "@/services/api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Film, List, PenSquare, UserCircle, Clock } from "lucide-react";
import { WatchlistItem, Movie, Review } from "@/types/movie";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Profile tab IDs
type ProfileTab = "watchlist" | "reviews" | "lists" | "settings";

// Schema for create list form
const createListSchema = z.object({
  name: z.string().min(3, "List name must be at least 3 characters"),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
});

type CreateListFormValues = z.infer<typeof createListSchema>;

export default function ProfilePage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get active tab from URL or default to "watchlist"
  const tabFromUrl = searchParams.get("tab") as ProfileTab | null;
  const [activeTab, setActiveTab] = useState<ProfileTab>(tabFromUrl || "watchlist");
  
  // Create list dialog state
  const [createListOpen, setCreateListOpen] = useState(false);
  
  // Create list form
  const form = useForm<CreateListFormValues>({
    resolver: zodResolver(createListSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: true,
    },
  });
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const newTab = value as ProfileTab;
    setActiveTab(newTab);
    
    const newSearchParams = new URLSearchParams(window.location.search);
    newSearchParams.set("tab", newTab);
    
    const newUrl = `/profile?${newSearchParams.toString()}`;
    window.history.pushState({}, "", newUrl);
  };
  
  // Fetch user's watchlist
  const {
    data: watchlist,
    isLoading: isWatchlistLoading,
    error: watchlistError,
  } = useQuery({
    queryKey: [`/api/users/${user?.id}/watchlist`],
    enabled: !!user && activeTab === "watchlist",
  });
  
  // Fetch user's reviews
  const {
    data: userReviews,
    isLoading: isReviewsLoading,
    error: reviewsError,
  } = useQuery({
    queryKey: [`/api/users/${user?.id}/reviews`],
    queryFn: () => fetch(`/api/movies/${user?.id}/reviews`).then(res => res.json()),
    enabled: !!user && activeTab === "reviews",
  });
  
  // Fetch user's lists
  const {
    data: userLists,
    isLoading: isListsLoading,
    error: listsError,
  } = useQuery({
    queryKey: [`/api/users/${user?.id}/lists`],
    enabled: !!user && activeTab === "lists",
  });
  
  // Remove from watchlist mutation
  const removeWatchlistMutation = useMutation({
    mutationFn: (movieId: number) => removeFromWatchlist(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/watchlist`] });
      toast({
        title: "Removed from watchlist",
        description: "Movie removed from your watchlist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove from watchlist",
        variant: "destructive",
      });
    },
  });
  
  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: (data: CreateListFormValues) => createList(data.name, data.description || null, data.isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/lists`] });
      setCreateListOpen(false);
      form.reset();
      toast({
        title: "List created",
        description: "Your new list has been created",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create list",
        variant: "destructive",
      });
    },
  });
  
  // Handle create list form submission
  const onCreateListSubmit = (data: CreateListFormValues) => {
    createListMutation.mutate(data);
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      },
    });
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-10">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to view your profile</p>
            <Button asChild>
              <Link href="/auth">Go to Login</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-10">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-muted">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} />
            ) : (
              <AvatarFallback className="text-3xl bg-primary/20">
                {getInitials(user.username)}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{user.username}</h1>
            <p className="text-muted-foreground mb-4">
              {user.bio || "No bio yet"}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center text-sm">
                <CalendarDays className="w-4 h-4 mr-1" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center text-sm">
                <Film className="w-4 h-4 mr-1" />
                <span>{watchlist?.length || 0} Movies in Watchlist</span>
              </div>
              <div className="flex items-center text-sm">
                <PenSquare className="w-4 h-4 mr-1" />
                <span>{userReviews?.length || 0} Reviews</span>
              </div>
              <div className="flex items-center text-sm">
                <List className="w-4 h-4 mr-1" />
                <span>{userLists?.length || 0} Lists</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile Content Tabs */}
        <Tabs defaultValue="watchlist" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-4 mb-8">
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="lists">Lists</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Watchlist Tab */}
          <TabsContent value="watchlist">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Watchlist</h2>
              <Link href="/search">
                <Button>Discover Movies</Button>
              </Link>
            </div>
            
            {isWatchlistLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex flex-col">
                    <Skeleton className="aspect-[2/3] w-full rounded-md mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : watchlistError ? (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium mb-2">Error Loading Watchlist</h3>
                <p className="text-muted-foreground">Please try again later</p>
              </div>
            ) : watchlist && watchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {watchlist.map((item: WatchlistItem) => (
                  <div key={item.id} className="relative group">
                    <MovieCard
                      id={item.movieId}
                      title={item.movie?.title || "Unknown Movie"}
                      posterPath={item.movie?.poster_path || null}
                      releaseDate={item.movie?.release_date || ""}
                      voteAverage={item.movie?.vote_average || 0}
                    />
                    <button
                      className="absolute top-2 right-2 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeWatchlistMutation.mutate(item.movieId)}
                      title="Remove from watchlist"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-lg">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Your watchlist is empty</h3>
                <p className="text-muted-foreground mb-6">
                  Start adding movies to keep track of what you want to watch
                </p>
                <Link href="/search">
                  <Button>Discover Movies</Button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Your Reviews</h2>
            </div>
            
            {isReviewsLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : reviewsError ? (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium mb-2">Error Loading Reviews</h3>
                <p className="text-muted-foreground">Please try again later</p>
              </div>
            ) : userReviews && userReviews.length > 0 ? (
              <div className="space-y-6">
                {userReviews.map((review: Review) => (
                  <div key={review.id} className="bg-muted/30 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <Link href={`/movie/${review.movieId}`}>
                        <div className="w-16 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                          <img
                            src={review.movie?.poster_path
                              ? `https://image.tmdb.org/t/p/w154${review.movie.poster_path}`
                              : "https://via.placeholder.com/154x231?text=No+Poster"
                            }
                            alt={review.movie?.title || "Movie poster"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <Link href={`/movie/${review.movieId}`}>
                            <h3 className="text-lg font-bold hover:text-primary">
                              {review.movie?.title || "Unknown Movie"}
                            </h3>
                          </Link>
                          <div className="flex items-center bg-muted px-2 py-1 rounded">
                            <span className="text-green-500 font-bold mr-1">{review.rating}</span>
                            <span className="text-green-500">★</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-3">
                          {review.content || "No written review."}
                        </p>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Reviewed on {formatDate(review.createdAt.toString())}</span>
                          <div className="flex gap-2">
                            <Link href={`/movie/${review.movieId}?rate=true`}>
                              <Button variant="ghost" size="sm">Edit</Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                apiRequest("DELETE", `/api/reviews/${review.id}`).then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/reviews`] });
                                  toast({
                                    title: "Review deleted",
                                    description: "Your review has been deleted",
                                  });
                                }).catch(error => {
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete review",
                                    variant: "destructive",
                                  });
                                });
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-lg">
                <PenSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No reviews yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start rating and reviewing movies to share your thoughts
                </p>
                <Link href="/search">
                  <Button>Discover Movies</Button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          {/* Lists Tab */}
          <TabsContent value="lists">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Lists</h2>
              <Dialog open={createListOpen} onOpenChange={setCreateListOpen}>
                <DialogTrigger asChild>
                  <Button>Create New List</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a New List</DialogTitle>
                    <DialogDescription>
                      Make a collection of movies to share with others or keep for yourself
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateListSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>List Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. My Favorite Sci-Fi Movies" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Add a short description for your list" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isPublic"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Public List</FormLabel>
                              <FormDescription>
                                Make this list visible to others
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreateListOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createListMutation.isPending}
                        >
                          {createListMutation.isPending ? "Creating..." : "Create List"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {isListsLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : listsError ? (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium mb-2">Error Loading Lists</h3>
                <p className="text-muted-foreground">Please try again later</p>
              </div>
            ) : userLists && userLists.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {userLists.map((list: any) => (
                  <div key={list.id} className="bg-muted/30 rounded-lg p-6">
                    <div className="flex justify-between mb-2">
                      <h3 className="text-lg font-bold">{list.name}</h3>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {list.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">
                      {list.description || "No description provided."}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {list.items?.length || 0} movies • Created {formatDate(list.createdAt)}
                      </span>
                      <div className="flex gap-2">
                        <Link href={`/list/${list.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Coming Soon",
                              description: "List editing will be available soon",
                            });
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-lg">
                <List className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No lists yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create lists to organize and share your favorite movies
                </p>
                <Button onClick={() => setCreateListOpen(true)}>Create Your First List</Button>
              </div>
            )}
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Account Settings</h2>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={user.username} disabled className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user.email} disabled className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      value={user.bio || ""}
                      placeholder="Tell us about yourself" 
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Profile editing will be available soon",
                      });
                    }}
                  >
                    Update Profile
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Account Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">Update your password periodically to keep your account secure</p>
                    </div>
                    <Button variant="outline"
                      onClick={() => {
                        toast({
                          title: "Coming Soon",
                          description: "Password changing will be available soon",
                        });
                      }}
                    >
                      Change
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all your data</p>
                    </div>
                    <Button variant="destructive"
                      onClick={() => {
                        toast({
                          title: "Coming Soon",
                          description: "Account deletion will be available soon",
                          variant: "destructive",
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <Button variant="outline" onClick={handleLogout}>
                      Log Out
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Appearance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
                    </div>
                    <Switch 
                      checked={true} 
                      disabled
                      aria-label="Toggle dark mode" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}
