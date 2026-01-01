import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, DollarSign, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const { isAdmin, loading } = useAdminAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalPartners: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (!isAdmin) return;

    const fetchStats = async () => {
      // Use user_roles table for role counts
      const { data: userRoles } = await supabase.from("user_roles").select("role");
      const { data: orders } = await supabase.from("orders").select("total_amount");

      if (userRoles && orders) {
        const customers = userRoles.filter((r) => r.role === "customer").length;
        const partners = userRoles.filter((r) => r.role === "partner").length;
        const revenue = orders.reduce(
          (sum, o) => sum + (o.total_amount ? parseFloat(o.total_amount.toString()) : 0),
          0
        );

        setStats({
          totalCustomers: customers,
          totalPartners: partners,
          totalOrders: orders.length,
          totalRevenue: revenue,
        });
      }
    };

    fetchStats();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                <p className="text-3xl font-bold">{stats.totalCustomers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Partners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-accent" />
                <p className="text-3xl font-bold">{stats.totalPartners}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-8 w-8 text-primary" />
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-success" />
                <p className="text-3xl font-bold">₹{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;