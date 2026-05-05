import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MobileNavbar from "@/components/shop/MobileNavbar";
import OrderTimeline from "@/components/shop/OrderTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Calendar,
  ArrowLeft,
  RotateCcw,
  FileText,
  User,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

const CATEGORY_NAMES: Record<string, Record<string, string>> = {
  paper: { en: "Paper", hi: "कागज़" },
  plastic: { en: "Plastic", hi: "प्लास्टिक" },
  metal: { en: "Metal", hi: "धातु" },
  ewaste: { en: "E-Waste", hi: "ई-कचरा" },
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { items, addItem } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
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

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (data) {
        setOrders(data);

        const orderIds = data.map((o) => o.id);
        if (orderIds.length > 0) {
          const { data: itemsData } = await supabase
            .from("order_items")
            .select("*")
            .in("order_id", orderIds);

          if (itemsData) {
            const itemsByOrder: Record<string, any[]> = {};
            itemsData.forEach((item) => {
              if (!itemsByOrder[item.order_id]) {
                itemsByOrder[item.order_id] = [];
              }
              itemsByOrder[item.order_id].push(item);
            });
            setOrderItems(itemsByOrder);
          }
        }
      }
    };

    fetchOrders();

    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const getCategoryName = (category: string) => {
    return CATEGORY_NAMES[category]?.[language] || CATEGORY_NAMES[category]?.en || category;
  };

  const openBill = async (order: any) => {
    setSelectedOrder(order);
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
      toast.error(err.message || "Failed to load bill");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleReorder = async (orderId: string) => {
    const previousOrder = orders.find((o) => o.id === orderId);
    const items = orderItems[orderId];
    if (!previousOrder || !items || items.length === 0) {
      toast.error("No items found to reorder");
      return;
    }

    if (!user) {
      toast.error("Please sign in to reorder");
      return;
    }

    const subCategoryNames = items.map((i) => i.sub_category);
    const { data: subCategories } = await supabase
      .from("sub_categories")
      .select("*")
      .in("name", subCategoryNames);

    if (!subCategories || subCategories.length === 0) {
      toast.error("Could not fetch current prices");
      return;
    }

    const reorderToast = toast.loading("Placing your reorder...");

    try {
      const primaryCategory = (subCategories[0]?.category ||
        previousOrder.category) as "paper" | "plastic" | "metal" | "ewaste";

      // Reuse previous address; pickup time = same time tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          category: primaryCategory,
          pickup_address: previousOrder.pickup_address,
          pickup_time: tomorrow.toISOString(),
          status: "pending" as const,
        })
        .select()
        .single();

      if (orderError || !newOrder) throw orderError;

      const newItems = items
        .map((item) => {
          const subCat = subCategories.find((s) => s.name === item.sub_category);
          if (!subCat) return null;
          return {
            order_id: newOrder.id,
            category: subCat.category,
            sub_category: subCat.name,
            estimated_weight: item.estimated_weight || 1,
            price_per_kg: subCat.price_per_kg,
            notes: null,
          };
        })
        .filter(Boolean) as any[];

      if (newItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(newItems);
        if (itemsError) throw itemsError;
      }

      toast.dismiss(reorderToast);
      toast.success("Reorder placed using your previous address!");
      navigate(`/order-confirmation?orderId=${newOrder.id}`);
    } catch (err: any) {
      toast.dismiss(reorderToast);
      toast.error(err.message || "Failed to place reorder");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <MobileNavbar
        user={user}
        cartItemCount={items.length}
        onCartClick={() => setIsCartOpen(true)}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{t("orderHistory")}</h1>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">No completed orders yet</p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{getCategoryName(order.category)}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {t("completed")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        ₹{order.total_amount || order.final_price || 0}
                      </p>
                    </div>
                  </div>

                  {orderItems[order.id] && orderItems[order.id].length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-3 mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Items:</p>
                      <div className="space-y-1">
                        {orderItems[order.id].map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.sub_category}</span>
                            <span className="text-muted-foreground">
                              {item.actual_weight || item.estimated_weight} kg × ₹{item.price_per_kg}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBill(order)}
                        className="gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        View Bill
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReorder(order.id)}
                        className="gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {t("reorder")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bill / Invoice Dialog (matches Completed Orders design) */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setOrderDetails({ items: [], images: [], payment: null });
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Order Bill
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && `#${selectedOrder.id.slice(0, 8)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
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
                    <p className="text-sm font-medium">{selectedOrder.pickup_address}</p>
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
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completed Date</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedOrder.updated_at).toLocaleString()}
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
                    <p className="font-medium">{getCategoryName(selectedOrder.category)}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOrder.actual_weight || selectedOrder.estimated_weight || 0} kg
                    </p>
                  </div>
                )}
              </div>

              {/* Total + Payment */}
              <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold text-primary">
                    ₹{selectedOrder.total_amount || selectedOrder.final_price || 0}
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

              {/* Status / Delivery */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Delivery Status</h3>
                <OrderTimeline
                  status={selectedOrder.status}
                  createdAt={selectedOrder.created_at}
                  updatedAt={selectedOrder.updated_at}
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
              {selectedOrder.notes && (
                <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
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

export default OrderHistory;
