import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAdminAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/admin-login");
          return;
        }

        setUser(session.user);

        // Check if user has admin role in user_roles table
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error("Error checking admin role:", error);
          toast.error("Error verifying admin access");
          navigate("/admin-login");
          return;
        }

        if (!roleData) {
          toast.error("Access denied. Admin privileges required.");
          navigate("/admin-login");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error in admin auth check:", error);
        toast.error("Authentication error");
        navigate("/admin-login");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  return { user, isAdmin, loading };
};
