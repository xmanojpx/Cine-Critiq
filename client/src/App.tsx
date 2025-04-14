import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import MoviePage from "@/pages/movie-page";
import ProfilePage from "@/pages/profile-page";
import SearchPage from "@/pages/search-page";
import RecommendationsPage from "@/pages/recommendations-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/movie/:id" component={MoviePage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/recommendations" component={RecommendationsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
