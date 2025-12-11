import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MobileNavbar from "@/components/shop/MobileNavbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, ArrowLeft, RotateCcw } from "lucide-react";
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
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (data) {
        setOrders(data);
        
        // Fetch order items for all orders
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
  }, [user]);

  const getCategoryName = (category: string) => {
    return CATEGORY_NAMES[category]?.[language] || CATEGORY_NAMES[category]?.en || category;
  };

  const handleReorder = async (orderId: string) => {
    const items = orderItems[orderId];
    if (!items || items.length === 0) {
      toast.error("No items found to reorder");
      return;
    }

    // Fetch current prices for the items
    const subCategoryNames = items.map((i) => i.sub_category);
    const { data: subCategories } = await supabase
      .from("sub_categories")
      .select("*")
      .in("name", subCategoryNames);

    if (!subCategories) {
      toast.error("Could not fetch current prices");
      return;
    }

    // Add items to cart with current prices
    items.forEach((item) => {
      const subCat = subCategories.find((s) => s.name === item.sub_category);
      if (subCat) {
        addItem({
          category: subCat.category,
          subCategory: subCat.id,
          subCategoryName: subCat.name,
          pricePerKg: subCat.price_per_kg,
          estimatedWeight: item.estimated_weight || 1,
          notes: "",
        });
      }
    });

    toast.success("Items added to cart!");
    navigate("/order");
  };

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

                  {/* Order Items */}
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

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
