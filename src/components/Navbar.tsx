import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Menu, LifeBuoy, Phone, Mail, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import LanguageToggle from "@/components/shop/LanguageToggle";
import logo from "@/assets/logo.jpg";

interface NavbarProps {
  role?: "customer" | "partner" | "admin";
}

const Navbar = ({ role = "customer" }: NavbarProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to logout");
    } else {
      toast.success("Logged out successfully");
      setIsOpen(false);
      navigate("/auth");
    }
  };

  const getLinks = () => {
    switch (role) {
      case "partner":
        return [
          { to: "/partner", label: "Dashboard" },
          { to: "/partner/orders", label: "Orders" },
        ];
      case "admin":
        return [
          { to: "/admin/dashboard", label: "Dashboard" },
          { to: "/admin/data", label: "Data Portal" },
          { to: "/admin/orders", label: "Orders" },
          { to: "/admin/customer-images", label: "Scrap Images" },
          { to: "/admin/prices", label: "Prices" },
          { to: "/admin/sub-categories", label: "Sub-Prices" },
          { to: "/admin/images", label: "Images" },
          { to: "/admin/sub-category-images", label: "Sub-Images" },
          { to: "/admin/banner", label: "Banner" },
        ];
      default:
        return [
          { to: "/", label: "Home" },
          { to: "/order", label: "Place Order" },
          { to: "/track", label: "Track Order" },
          { to: "/history", label: "History" },
          { to: "/profile", label: "Profile" },
        ];
    }
  };

  const links = getLinks();

  return (
    <nav className="border-b bg-background sticky top-0 z-50 shadow-soft">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Scrapy5 Logo" className="h-10 md:h-12 w-auto object-contain" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageToggle />
          {user ? (
            <>
              {links.map((link) => (
                <Link key={link.to} to={link.to}>
                  <Button variant="ghost" size="sm">{link.label}</Button>
                </Link>
              ))}
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button>Login</Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <img src={logo} alt="Scrapy5 Logo" className="h-10 w-auto object-contain" />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 space-y-2">
                {user ? (
                  <>
                    {links.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-3"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-3 py-2 rounded-lg bg-primary text-primary-foreground"
                  >
                    Login / Sign Up
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
