import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, Calendar, Package, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface OrderItem {
  id: string;
  category: string;
  sub_category: string;
  estimated_weight: number | null;
  price_per_kg: number;
}

interface Order {
  id: string;
  pickup_address: string;
  pickup_time: string;
  status: string;
  created_at: string;
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(true);

  useEffect(() => {
    // Auto-dismiss the full-screen success animation after a few seconds
    const timer = setTimeout(() => setShowSuccessOverlay(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        navigate("/");
        return;
      }

      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (orderError) throw orderError;
        setOrder(orderData);

        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);

        if (itemsError) throw itemsError;
        setOrderItems(itemsData || []);
      } catch (error) {
        console.error("Error fetching order:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate]);

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      if (item.estimated_weight) {
        return total + item.estimated_weight * item.price_per_kg;
      }
      return total;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Full-screen Success Animation */}
      {showSuccessOverlay && order && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowSuccessOverlay(false)}
          role="dialog"
          aria-label="Order placed successfully"
        >
          <div className="text-center px-6 animate-scale-in">
            <div className="relative inline-flex items-center justify-center mb-6">
              <span className="absolute inline-flex h-32 w-32 rounded-full bg-success/20 animate-ping" />
              <span className="absolute inline-flex h-24 w-24 rounded-full bg-success/30" />
              <div className="relative inline-flex items-center justify-center h-28 w-28 rounded-full bg-success shadow-2xl">
                <CheckCircle className="h-16 w-16 text-success-foreground" strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Order Successfully Placed
            </h2>
            <p className="text-base md:text-lg text-foreground/80 mb-2">
              Thank you! Your scrap pickup request has been submitted successfully.
            </p>
            <p className="text-sm font-mono text-primary">
              Order ID: #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground mt-6">Tap anywhere to continue</p>
          </div>
        </div>
      )}

      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-muted-foreground">
            Thank you for your order. We'll contact you soon.
          </p>
        </div>

        {/* Order Bill Card */}
        <Card className="shadow-elevated mb-6">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Order Summary</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Order ID: #{order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <span className="px-3 py-1 bg-warning/10 text-warning text-sm font-medium rounded-full capitalize">
                {order.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">Items</h3>
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {item.sub_category}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.category} • ₹{item.price_per_kg}/kg
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {item.estimated_weight ? (
                      <>
                        <p className="font-semibold text-foreground">
                          ₹{(item.estimated_weight * item.price_per_kg).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.estimated_weight} kg
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Weight TBD</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center py-2">
              <span className="text-lg font-semibold">Estimated Total</span>
              <span className="text-2xl font-bold text-primary">
                ₹{calculateTotal().toFixed(2)}
              </span>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <p className="text-xs text-warning-foreground">
                ⚠️ Final price may vary during doorstep inspection by our partner.
              </p>
            </div>

            <Separator />

            {/* Pickup Details */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                Pickup Details
              </h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {order.pickup_address}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Scheduled Date
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.pickup_time).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </Button>
          <Button className="flex-1 gap-2" onClick={() => navigate("/track")}>
            Track Order
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
