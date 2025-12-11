import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MobileNavbar from "@/components/shop/MobileNavbar";
import OrderTimeline from "@/components/shop/OrderTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, ChevronDown, ChevronUp, MapPin, Clock, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/hooks/useCart";

const CATEGORY_NAMES: Record<string, Record<string, string>> = {
  paper: { en: "Paper", hi: "कागज़" },
  plastic: { en: "Plastic", hi: "प्लास्टिक" },
  metal: { en: "Metal", hi: "धातु" },
  ewaste: { en: "E-Waste", hi: "ई-कचरा" },
};

const TrackOrder = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { items } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "assigned":
      case "picked":
        return "bg-primary/10 text-primary border-primary/20";
      case "weighed":
        return "bg-accent/10 text-accent border-accent/20";
      case "paid":
      case "completed":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryName = (category: string) => {
    return CATEGORY_NAMES[category]?.[language] || CATEGORY_NAMES[category]?.en || category;
  };

  const activeOrders = orders.filter((o) => o.status !== "completed");
  const completedOrders = orders.filter((o) => o.status === "completed");

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile Navbar */}
      <MobileNavbar
        user={user}
        cartItemCount={items.length}
        onCartClick={() => setIsCartOpen(true)}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">{t("trackYourOrders")}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">{t("noOrders")}</p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Active Orders ({activeOrders.length})
                </h2>
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <Card key={order.id} className="shadow-soft overflow-hidden">
                      <Collapsible
                        open={expandedOrder === order.id}
                        onOpenChange={(open) => setExpandedOrder(open ? order.id : null)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="text-lg">
                                    {getCategoryName(order.category)}
                                  </CardTitle>
                                  <Badge className={getStatusColor(order.status)}>
                                    {t(order.status)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  #{order.id.slice(0, 8)}
                                </p>
                              </div>
                              {expandedOrder === order.id ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            {/* Timeline */}
                            <OrderTimeline
                              status={order.status}
                              createdAt={order.created_at}
                              updatedAt={order.updated_at}
                            />

                            {/* Order Details */}
                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-xs text-muted-foreground">{t("pickupAddress")}</p>
                                  <p className="text-sm font-medium">{order.pickup_address}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-xs text-muted-foreground">{t("pickupTime")}</p>
                                  <p className="text-sm font-medium">
                                    {new Date(order.pickup_time).toLocaleDateString()}{" "}
                                    {new Date(order.pickup_time).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                              {order.estimated_weight && (
                                <div>
                                  <p className="text-xs text-muted-foreground">{t("estimatedWeight")}</p>
                                  <p className="text-sm font-medium">{order.estimated_weight} {t("kg")}</p>
                                </div>
                              )}
                              {order.total_amount && (
                                <div>
                                  <p className="text-xs text-muted-foreground">{t("totalAmount")}</p>
                                  <p className="text-lg font-bold text-primary">₹{order.total_amount}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
                  Completed Orders ({completedOrders.length})
                </h2>
                <div className="space-y-3">
                  {completedOrders.slice(0, 5).map((order) => (
                    <Card key={order.id} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{getCategoryName(order.category)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              ₹{order.total_amount || order.final_price || 0}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {t("completed")}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {completedOrders.length > 5 && (
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => navigate("/history")}
                    >
                      View All History →
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
