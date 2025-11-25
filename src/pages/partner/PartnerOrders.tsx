import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, CheckCircle, Package } from "lucide-react";

const PartnerOrders = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [actualWeight, setActualWeight] = useState("");

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
        .or(`partner_id.eq.${user.id},status.eq.pending`)
        .order("created_at", { ascending: false });

      if (data) setOrders(data);
    };

    fetchOrders();
  }, [user]);

  const handleAcceptOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ partner_id: user.id, status: "assigned" })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to accept order");
    } else {
      toast.success("Order accepted!");
      setOrders(orders.filter((o) => o.id !== orderId));
    }
  };

  const handlePickupComplete = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "picked" })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Pickup marked complete");
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: "picked" } : o)));
    }
  };

  const handleWeightUpdate = async (orderId: string) => {
    if (!actualWeight) {
      toast.error("Please enter the actual weight");
      return;
    }

    // Fetch current price for the category
    const order = orders.find((o) => o.id === orderId);
    const { data: priceData } = await supabase
      .from("scrap_prices")
      .select("price_per_kg")
      .eq("category", order.category)
      .single();

    const totalAmount = parseFloat(actualWeight) * parseFloat(priceData?.price_per_kg?.toString() || "0");

    const { error } = await supabase
      .from("orders")
      .update({
        actual_weight: parseFloat(actualWeight),
        total_amount: totalAmount,
        status: "weighed",
      })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update weight");
    } else {
      toast.success("Weight updated successfully");
      setSelectedOrder(null);
      setActualWeight("");
      setOrders(
        orders.map((o) =>
          o.id === orderId
            ? { ...o, actual_weight: parseFloat(actualWeight), total_amount: totalAmount, status: "weighed" }
            : o
        )
      );
    }
  };

  const handleMarkPaid = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to mark as completed");
    } else {
      toast.success("Order completed!");
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: "completed" } : o)));
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
      <Navbar role="partner" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Available Orders</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">No orders available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-soft">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{getCategoryName(order.category)}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Order ID: {order.id.slice(0, 8)}
                      </p>
                    </div>
                    <Badge
                      className={
                        order.status === "pending"
                          ? "bg-warning/10 text-warning"
                          : "bg-primary/10 text-primary"
                      }
                    >
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Address</p>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {order.pickup_address}
                      </p>
                    </div>
                    {order.estimated_weight && (
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Weight</p>
                        <p className="font-medium">{order.estimated_weight} kg</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Time</p>
                      <p className="font-medium">{new Date(order.pickup_time).toLocaleString()}</p>
                    </div>
                  </div>

                  {order.status === "pending" && (
                    <Button onClick={() => handleAcceptOrder(order.id)} className="w-full">
                      Accept Order
                    </Button>
                  )}

                  {order.status === "assigned" && (
                    <Button onClick={() => handlePickupComplete(order.id)} className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Picked Up
                    </Button>
                  )}

                  {order.status === "picked" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`weight-${order.id}`}>Enter Actual Weight (kg)</Label>
                        <Input
                          id={`weight-${order.id}`}
                          type="number"
                          step="0.1"
                          value={selectedOrder?.id === order.id ? actualWeight : ""}
                          onChange={(e) => {
                            setSelectedOrder(order);
                            setActualWeight(e.target.value);
                          }}
                          placeholder="e.g., 5.5"
                        />
                      </div>
                      <Button
                        onClick={() => handleWeightUpdate(order.id)}
                        className="w-full"
                        disabled={!actualWeight}
                      >
                        Update Weight
                      </Button>
                    </div>
                  )}

                  {order.status === "weighed" && (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Actual Weight</p>
                          <p className="font-medium">{order.actual_weight} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="font-medium text-primary text-lg">₹{order.total_amount}</p>
                        </div>
                      </div>
                      <Button onClick={() => handleMarkPaid(order.id)} className="w-full">
                        Mark as Completed
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerOrders;