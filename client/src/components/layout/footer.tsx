import { Link } from "wouter";
import { Film, Twitter, Instagram, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border py-8 md:py-12 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center mb-4">
              <Film className="w-8 h-8 text-primary" />
              <span className="font-bold text-xl ml-2">CineCritiq</span>
            </div>
            <p className="text-muted-foreground max-w-md">Your destination for discovering, reviewing, and discussing movies with fellow film enthusiasts.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-medium mb-4">Navigate</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/" className="hover:text-primary">Home</Link></li>
                <li><Link href="/search" className="hover:text-primary">Discover</Link></li>
                <li><Link href="/search?list=top_rated" className="hover:text-primary">Lists</Link></li>
                <li><Link href="/profile" className="hover:text-primary">Watchlist</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Categories</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/search?list=popular" className="hover:text-primary">Popular</Link></li>
                <li><Link href="/search?list=top_rated" className="hover:text-primary">Top Rated</Link></li>
                <li><Link href="/search?list=upcoming" className="hover:text-primary">Upcoming</Link></li>
                <li><Link href="/search?list=now_playing" className="hover:text-primary">Now Playing</Link></li>
              </ul>
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-medium mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">About Us</Link></li>
                <li><Link href="#" className="hover:text-primary">Contact</Link></li>
                <li><Link href="#" className="hover:text-primary">FAQ</Link></li>
                <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} CineCritiq. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-primary">
              <Twitter className="w-5 h-5" />
              <span className="sr-only">Twitter</span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary">
              <Instagram className="w-5 h-5" />
              <span className="sr-only">Instagram</span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary">
              <Facebook className="w-5 h-5" />
              <span className="sr-only">Facebook</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
