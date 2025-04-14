import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import SearchBar from "../search/search-bar";
import { Film } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/");
      },
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center">
            <Film className="w-8 h-8 text-primary" />
            <span className="font-medium text-xl ml-2 tracking-tight">CineCritiq</span>
          </Link>
        </div>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:block flex-grow max-w-xl mx-8">
          <SearchBar />
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-6">
          <Link href="/" className="hidden md:block hover:text-primary text-sm font-medium">
            Discover
          </Link>
          <Link href="/recommendations" className="hidden md:block hover:text-primary text-sm font-medium">
            Recommendations
          </Link>
          <Link href="/search?list=top_rated" className="hidden md:block hover:text-primary text-sm font-medium">
            Lists
          </Link>
          {user && (
            <Link href="/profile" className="hidden md:block hover:text-primary text-sm font-medium">
              Watchlist
            </Link>
          )}

          {/* User Profile / Login Button */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center focus:outline-none">
                  <Avatar className="w-8 h-8 border-2 border-transparent hover:border-primary">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} />
                    ) : (
                      <AvatarFallback className="bg-muted text-foreground">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile?tab=reviews")}>
                  My Reviews
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile?tab=settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth" className="text-sm font-medium px-3 py-2 rounded-md bg-primary text-white hover:bg-primary/90">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
