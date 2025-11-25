import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Leaf, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

interface NavbarProps {
  role?: "customer" | "partner" | "admin";
}

const Navbar = ({ role = "customer" }: NavbarProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

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
      navigate("/auth");
    }
  };

  const getRoleLinks = () => {
    switch (role) {
      case "partner":
        return (
          <>
            <Link to="/partner">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link to="/partner/orders">
              <Button variant="ghost">Orders</Button>
            </Link>
          </>
        );
      case "admin":
        return (
          <>
            <Link to="/admin">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link to="/admin/orders">
              <Button variant="ghost">Orders</Button>
            </Link>
            <Link to="/admin/prices">
              <Button variant="ghost">Prices</Button>
            </Link>
          </>
        );
      default:
        return (
          <>
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/order">
              <Button variant="ghost">Place Order</Button>
            </Link>
            <Link to="/track">
              <Button variant="ghost">Track Order</Button>
            </Link>
          </>
        );
    }
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50 shadow-soft">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-gradient-primary p-2 rounded-lg">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">SCRAPY5</span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {getRoleLinks()}
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
      </div>
    </nav>
  );
};

export default Navbar;