import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MobileNavbar from "@/components/shop/MobileNavbar";
import OrderTimeline from "@/components/shop/OrderTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Package,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  RefreshCw,
  User,
  Phone,
  CreditCard,
  FileText,
  Calendar,
  CheckCircle,
} from "lucide-react";
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
  const [profile, setProfile] = useState<any>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCompleted, setSelectedCompleted] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    items: any[];
    images: any[];
    payment: any | null;
  }>({ items: [], images: [], payment: null });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const fetchOrders = useCallback(
    async (showToast = false) => {
      if (!user) return;
      try {
        if (showToast) setRefreshing(true);
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setOrders(data || []);
        if (showToast) {
          toast({ title: "Refreshed", description: "Latest orders loaded." });
        }
      } catch (err: any) {
        toast({
          title: "Failed to refresh",
          description: err.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    fetchOrders();

    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));

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
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrders]);

  const handleRefresh = () => fetchOrders(true);

  const openCompletedDetails = async (order: any) => {
    setSelectedCompleted(order);
    setDetailsLoading(true);
    setOrderDetails({ items: [], images: [], payment: null });
    try {
      const [itemsRes, imagesRes, paymentRes] = await Promise.all([
        supabase.from("order_items").select("*").eq("order_id", order.id),
        supabase.from("order_images").select("*").eq("order_id", order.id),
        supabase.from("payments").select("*").eq("order_id", order.id).maybeSingle(),
      ]);
      setOrderDetails({
        items: itemsRes.data || [],
        images: imagesRes.data || [],
        payment: paymentRes.data || null,
      });
    } catch (err: any) {
      toast({
        title: "Failed to load details",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

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
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : orders.length === 0 ? (
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
                    <Card
                      key={order.id}
                      className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openCompletedDetails(order)}
                    >
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

      {/* Completed Order Details Dialog */}
      <Dialog
        open={!!selectedCompleted}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCompleted(null);
            setOrderDetails({ items: [], images: [], payment: null });
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              {selectedCompleted && `#${selectedCompleted.id.slice(0, 8)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedCompleted && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium">
                      {profile?.full_name || "Not Available"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">
                      {profile?.phone || "Not Available"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Address</p>
                    <p className="text-sm font-medium">{selectedCompleted.pickup_address}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Order Date</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedCompleted.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completed Date</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedCompleted.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Items</h3>
                {detailsLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : orderDetails.items.length > 0 ? (
                  <div className="space-y-2">
                    {orderDetails.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 bg-muted/30 rounded"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.sub_category}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.actual_weight || item.estimated_weight || 0} kg × ₹
                            {item.price_per_kg}/kg
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          ₹{item.final_price || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 bg-muted/30 rounded text-sm">
                    <p className="font-medium">{getCategoryName(selectedCompleted.category)}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCompleted.actual_weight || selectedCompleted.estimated_weight || 0} kg
                    </p>
                  </div>
                )}
              </div>

              {/* Total + Payment */}
              <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold text-primary">
                    ₹{selectedCompleted.total_amount || selectedCompleted.final_price || 0}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <p className="text-sm font-medium capitalize">
                      {orderDetails.payment?.payment_method || "Cash"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {orderDetails.payment?.payment_status || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Status Timeline</h3>
                <OrderTimeline
                  status={selectedCompleted.status}
                  createdAt={selectedCompleted.created_at}
                  updatedAt={selectedCompleted.updated_at}
                />
              </div>

              {/* Images */}
              {detailsLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                orderDetails.images.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Uploaded Images</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {orderDetails.images.map((img) => (
                        <a
                          key={img.id}
                          href={img.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square rounded-md overflow-hidden border hover:opacity-80 transition"
                        >
                          <img
                            src={img.image_url}
                            alt="Order upload"
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Notes */}
              {selectedCompleted.notes && (
                <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{selectedCompleted.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackOrder;
