import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, ShoppingCart, User, Package, Menu, LogOut, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/hooks/useCart";
import SearchAutocomplete from "./SearchAutocomplete";
import LanguageToggle from "./LanguageToggle";
import logoImage from "@/assets/logo.jpg";

interface MobileNavbarProps {
  user: any;
  cartItemCount: number;
  onCartClick: () => void;
  onSearch?: (query: string) => void;
}

const MobileNavbar = ({ user, cartItemCount, onCartClick, onSearch }: MobileNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { addItem } = useCart();
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

  const handleSearchSelect = (item: any) => {
    // Add to cart or navigate to the category
    addItem({
      category: item.category,
      subCategory: item.id,
      subCategoryName: item.name,
      pricePerKg: item.price_per_kg,
      estimatedWeight: 1,
      notes: "",
    });
    toast.success(`${item.name} added to cart!`);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top Header - Mobile */}
      <header className="sticky top-0 z-50 bg-card border-b border-border md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="Scrapy5" 
              className="h-10 w-auto object-contain rounded-lg"
            />
          </Link>

          <div className="flex items-center gap-1">
            <LanguageToggle />
            
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
                    <img 
                      src={logoImage} 
                      alt="Scrapy5" 
                      className="h-10 w-auto object-contain rounded-lg"
                    />
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-2">
                  {user ? (
                    <>
                      <p className="text-sm text-muted-foreground px-3 mb-2">
                        {t("welcome")}, {user.email?.split("@")[0]}
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
                        {t("home")}
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
                        {t("placeOrder")}
                      </Link>
                      <Link
                        to="/track"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          isActive("/track") ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                      >
                        <Package className="h-5 w-5" />
                        {t("trackOrder")}
                      </Link>
                      <Link
                        to="/history"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          isActive("/history") ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                      >
                        <History className="h-5 w-5" />
                        {t("orderHistory")}
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 px-3"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5" />
                        {t("logout")}
                      </Button>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                    >
                      <User className="h-5 w-5" />
                      {t("login")} / Sign Up
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Search Bar with Autocomplete */}
        <div className="px-4 pb-3">
          <SearchAutocomplete
            onSelect={handleSearchSelect}
            placeholder={t("search")}
          />
        </div>
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
            <span className="text-xs">{t("home")}</span>
          </Link>
          
          <Link
            to="/track"
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2",
              isActive("/track") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">{t("orders")}</span>
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
            <span className="text-xs">{t("cart")}</span>
          </button>

          <Link
            to={user ? "/profile" : "/auth"}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2",
              isActive("/profile") || isActive("/auth") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">{user ? t("profile") : t("login")}</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default MobileNavbar;
