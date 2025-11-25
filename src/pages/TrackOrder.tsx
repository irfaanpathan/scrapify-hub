import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Scale, DollarSign, CheckCircle } from "lucide-react";

const TrackOrder = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setOrders(data);
    };

    fetchOrders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${user.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Package className="h-5 w-5" />;
      case "assigned":
        return <Truck className="h-5 w-5" />;
      case "picked":
        return <Truck className="h-5 w-5" />;
      case "weighed":
        return <Scale className="h-5 w-5" />;
      case "paid":
        return <DollarSign className="h-5 w-5" />;
      case "completed":
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "assigned":
        return "bg-primary/10 text-primary border-primary/20";
      case "picked":
        return "bg-primary/10 text-primary border-primary/20";
      case "weighed":
        return "bg-accent/10 text-accent border-accent/20";
      case "paid":
        return "bg-success/10 text-success border-success/20";
      case "completed":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      paper: "Paper",
      plastic: "Plastic",
      metal: "Metal",
      ewaste: "E-Waste",
    };
    return names[category] || category;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Track Your Orders</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">No orders yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-soft hover:shadow-elevated transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{getCategoryName(order.category)}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Order ID: {order.id.slice(0, 8)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      <span className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        {order.status.toUpperCase()}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Address</p>
                      <p className="font-medium">{order.pickup_address}</p>
                    </div>
                    {order.estimated_weight && (
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Weight</p>
                        <p className="font-medium">{order.estimated_weight} kg</p>
                      </div>
                    )}
                    {order.actual_weight && (
                      <div>
                        <p className="text-sm text-muted-foreground">Actual Weight</p>
                        <p className="font-medium">{order.actual_weight} kg</p>
                      </div>
                    )}
                    {order.total_amount && (
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-medium text-primary text-lg">₹{order.total_amount}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Time</p>
                      <p className="font-medium">
                        {new Date(order.pickup_time).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Order Placed</p>
                      <p className="font-medium">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;