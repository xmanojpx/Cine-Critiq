import { Link, useLocation } from "wouter";
import { Home, Search, List, User, Sparkles } from "lucide-react";

export default function MobileNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") {
      return true;
    }
    return path !== "/" && location.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
      <div className="flex justify-around">
        <Link href="/" className={`flex flex-col items-center justify-center py-3 px-4 ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link href="/search" className={`flex flex-col items-center justify-center py-3 px-4 ${isActive('/search') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
          <Search className="w-6 h-6" />
          <span className="text-xs mt-1">Search</span>
        </Link>
        <Link href="/recommendations" className={`flex flex-col items-center justify-center py-3 px-4 ${isActive('/recommendations') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
          <Sparkles className="w-6 h-6" />
          <span className="text-xs mt-1">For You</span>
        </Link>
        <Link href="/profile" className={`flex flex-col items-center justify-center py-3 px-4 ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
          <User className="w-6 h-6" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
