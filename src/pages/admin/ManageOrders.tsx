import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ManageOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
    fetchPartners();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, customer:profiles!orders_customer_id_fkey(full_name), partner:profiles!orders_partner_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
  };

  const fetchPartners = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "partner");

    if (data) setPartners(data);
  };

  const handleAssignPartner = async (orderId: string, partnerId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ partner_id: partnerId, status: "assigned" })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to assign partner");
    } else {
      toast.success("Partner assigned successfully");
      fetchOrders();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/10 text-warning";
      case "assigned":
        return "bg-primary/10 text-primary";
      case "completed":
        return "bg-success/10 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Manage All Orders</h1>

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
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{order.customer?.full_name || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Partner</p>
                    <p className="font-medium">{order.partner?.full_name || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup Address</p>
                    <p className="font-medium">{order.pickup_address}</p>
                  </div>
                  {order.actual_weight && (
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-medium">{order.actual_weight} kg</p>
                    </div>
                  )}
                  {order.total_amount && (
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium text-primary">₹{order.total_amount}</p>
                    </div>
                  )}
                </div>

                {order.status === "pending" && partners.length > 0 && (
                  <div className="flex gap-2">
                    <Select onValueChange={(value) => handleAssignPartner(order.id, value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Assign to partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageOrders;