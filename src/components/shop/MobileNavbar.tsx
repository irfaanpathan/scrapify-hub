import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Search, ShoppingCart, User, Package, Menu, X, Leaf, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MobileNavbarProps {
  user: any;
  cartItemCount: number;
  onCartClick: () => void;
  onSearch?: (query: string) => void;
}

const MobileNavbar = ({ user, cartItemCount, onCartClick, onSearch }: MobileNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to logout");
    } else {
      toast.success("Logged out successfully");
      setIsMenuOpen(false);
      navigate("/auth");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top Header - Mobile */}
      <header className="sticky top-0 z-50 bg-card border-b border-border md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-primary p-1.5 rounded-lg">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">SCRAPY5</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
            
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="bg-gradient-primary p-2 rounded-lg">
                      <Leaf className="h-5 w-5 text-primary-foreground" />
                    </div>
                    SCRAPY5
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-2">
                  {user ? (
                    <>
                      <p className="text-sm text-muted-foreground px-3 mb-2">
                        Welcome, {user.email}
                      </p>
                      <Link
                        to="/"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          isActive("/") ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                      >
                        <Home className="h-5 w-5" />
                        Home
                      </Link>
                      <Link
                        to="/order"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          isActive("/order") ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                      >
                        <Package className="h-5 w-5" />
                        Place Order
                      </Link>
                      <Link
                        to="/track"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          isActive("/track") ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                      >
                        <Search className="h-5 w-5" />
                        Track Order
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 px-3"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                    >
                      <User className="h-5 w-5" />
                      Login / Sign Up
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search scrap items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-muted/50 border-0"
            />
          </div>
        </form>
      </header>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2",
              isActive("/") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Link>
          
          <Link
            to="/track"
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2",
              isActive("/track") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Orders</span>
          </Link>

          <button
            onClick={onCartClick}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-1 right-2 bg-primary text-primary-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
            <span className="text-xs">Cart</span>
          </button>

          <Link
            to={user ? "/order" : "/auth"}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2",
              isActive("/auth") || isActive("/order") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">{user ? "Profile" : "Login"}</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default MobileNavbar;
