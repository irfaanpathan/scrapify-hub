import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Edit2, Save, X, ImageIcon, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AdminOrderTimeline, { ORDER_STEPS } from "@/components/admin/AdminOrderTimeline";

type StatusFilter = "all" | "pending" | "in_progress" | "completed";

const ManageOrders = () => {
  const { isAdmin, loading } = useAdminAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [orderImages, setOrderImages] = useState<Record<string, string[]>>({});
  const [galleryImages, setGalleryImages] = useState<string[] | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [editingPrice, setEditingPrice] = useState<{ orderId: string; itemId: string } | null>(null);
  const [newFinalPrice, setNewFinalPrice] = useState("");
  const [editingOrderPrice, setEditingOrderPrice] = useState<string | null>(null);
  const [newOrderFinalPrice, setNewOrderFinalPrice] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      fetchPartners();
    }
  }, [isAdmin]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, customer:profiles!orders_customer_id_fkey(full_name, phone), partner:profiles!orders_partner_id_fkey(full_name, phone)")
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data);
      // Fetch order items + images for each order
      data.forEach((order) => {
        fetchOrderItems(order.id);
        fetchOrderImages(order.id);
      });
    }
  };

  const fetchOrderImages = async (orderId: string) => {
    const { data } = await supabase
      .from("order_images")
      .select("image_url")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    if (data) {
      setOrderImages((prev) => ({ ...prev, [orderId]: data.map((d) => d.image_url) }));
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (data) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    }
  };

  const fetchPartners = async () => {
    // Get partners from user_roles table and join with profiles
    const { data: partnerRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "partner");

    if (partnerRoles && partnerRoles.length > 0) {
      const partnerIds = partnerRoles.map((r) => r.user_id);
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", partnerIds);

      if (data) setPartners(data);
    }
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

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as any })
      .eq("id", orderId);

    setUpdatingStatus(null);
    if (error) {
      toast.error("Failed to update status");
    } else {
      const stepLabel = ORDER_STEPS.find((s) => s.key === newStatus)?.label || newStatus;
      toast.success(`Status updated to ${stepLabel}`);
      fetchOrders();
    }
  };

  const handleUpdateItemFinalPrice = async (orderId: string, itemId: string) => {
    const price = parseFloat(newFinalPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const { error } = await supabase
      .from("order_items")
      .update({ final_price: price })
      .eq("id", itemId);

    if (error) {
      toast.error("Failed to update price");
    } else {
      toast.success("Item price updated");
      fetchOrderItems(orderId);
      setEditingPrice(null);
      setNewFinalPrice("");
    }
  };

  const handleUpdateOrderFinalPrice = async (orderId: string) => {
    const price = parseFloat(newOrderFinalPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ final_price: price })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order price");
    } else {
      toast.success("Order final price updated");
      fetchOrders();
      setEditingOrderPrice(null);
      setNewOrderFinalPrice("");
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Redirecting to admin login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Manage All Orders</h1>
        <p className="text-muted-foreground mb-6">Track and update order status across all stages</p>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({orders.filter((o) => o.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({orders.filter((o) => !["pending", "completed"].includes(o.status)).length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({orders.filter((o) => o.status === "completed").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {orders
            .filter((order) => {
              if (statusFilter === "all") return true;
              if (statusFilter === "pending") return order.status === "pending";
              if (statusFilter === "completed") return order.status === "completed";
              return !["pending", "completed"].includes(order.status);
            })
            .map((order) => {
            const items = orderItems[order.id] || [];
            const isExpanded = expandedOrders.has(order.id);

            return (
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
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-medium">{order.customer?.full_name || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p className="font-medium break-all">
                        {order.customer?.phone ? (
                          <a href={`tel:${order.customer.phone}`} className="hover:text-primary">
                            {order.customer.phone}
                          </a>
                        ) : (
                          "Not Available"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Partner</p>
                      <p className="font-medium">{order.partner?.full_name || "Not assigned"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Address</p>
                      <p className="font-medium">{order.pickup_address}</p>
                    </div>
                  </div>

                  {/* Customer Uploaded Images */}
                  {(orderImages[order.id]?.length ?? 0) > 0 && (
                    <div className="border border-border rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Customer Image{orderImages[order.id].length > 1 ? "s" : ""} ({orderImages[order.id].length})
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGalleryImages(orderImages[order.id]);
                          setGalleryIndex(0);
                        }}
                        className="group relative block w-full max-w-xs aspect-square overflow-hidden rounded-md border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <img
                          src={orderImages[order.id][0]}
                          alt="Scrap cover"
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {orderImages[order.id].length > 1 && (
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                            +{orderImages[order.id].length - 1} more
                          </span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Order Status Management Timeline */}
                  <div className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h4 className="font-semibold text-sm">Order Status Management</h4>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Quick set:</Label>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                          disabled={updatingStatus === order.id}
                        >
                          <SelectTrigger className="w-44 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STEPS.map((step) => (
                              <SelectItem key={step.key} value={step.key}>
                                {step.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <AdminOrderTimeline
                      status={order.status}
                      createdAt={order.created_at}
                      updatedAt={order.updated_at}
                      onStatusChange={(newStatus) => handleUpdateOrderStatus(order.id, newStatus)}
                      disabled={updatingStatus === order.id}
                    />
                  </div>

                  {/* Order Final Price Override */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Order Final Price</p>
                        <p className="font-semibold text-lg text-primary">
                          {order.final_price ? `₹${order.final_price}` : "Not set"}
                        </p>
                      </div>
                      {editingOrderPrice === order.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter final price"
                            value={newOrderFinalPrice}
                            onChange={(e) => setNewOrderFinalPrice(e.target.value)}
                            className="w-32"
                          />
                          <Button
                            size="icon"
                            onClick={() => handleUpdateOrderFinalPrice(order.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingOrderPrice(null);
                              setNewOrderFinalPrice("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingOrderPrice(order.id);
                            setNewOrderFinalPrice(order.final_price?.toString() || "");
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Set Final Price
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Order Items Collapsible */}
                  {items.length > 0 && (
                    <Collapsible open={isExpanded} onOpenChange={() => toggleOrderExpanded(order.id)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between">
                          <span>Order Items ({items.length})</span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-4 space-y-3">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="bg-card border border-border rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{item.sub_category}</p>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {item.category}
                                  </p>
                                  <div className="mt-2 text-sm space-y-1">
                                    <p>
                                      <span className="text-muted-foreground">Price/kg:</span>{" "}
                                      ₹{item.price_per_kg}
                                    </p>
                                    {item.estimated_weight && (
                                      <p>
                                        <span className="text-muted-foreground">Est. Weight:</span>{" "}
                                        {item.estimated_weight} kg
                                      </p>
                                    )}
                                    {item.actual_weight && (
                                      <p>
                                        <span className="text-muted-foreground">Actual Weight:</span>{" "}
                                        {item.actual_weight} kg
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Label className="text-xs text-muted-foreground">Final Price</Label>
                                  {editingPrice?.orderId === order.id &&
                                  editingPrice?.itemId === item.id ? (
                                    <div className="flex items-center gap-2 mt-1">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="₹"
                                        value={newFinalPrice}
                                        onChange={(e) => setNewFinalPrice(e.target.value)}
                                        className="w-24 h-8"
                                      />
                                      <Button
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          handleUpdateItemFinalPrice(order.id, item.id)
                                        }
                                      >
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setEditingPrice(null);
                                          setNewFinalPrice("");
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-primary">
                                        {item.final_price
                                          ? `₹${item.final_price}`
                                          : "-"}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={() => {
                                          setEditingPrice({
                                            orderId: order.id,
                                            itemId: item.id,
                                          });
                                          setNewFinalPrice(
                                            item.final_price?.toString() || ""
                                          );
                                        }}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

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
            );
          })}
        </div>
      </div>

      <Dialog
        open={!!galleryImages}
        onOpenChange={(open) => {
          if (!open) {
            setGalleryImages(null);
            setGalleryIndex(0);
          }
        }}
      >
        <DialogContent className="max-w-5xl p-4">
          {galleryImages && galleryImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative bg-muted rounded-md flex items-center justify-center">
                <img
                  src={galleryImages[galleryIndex]}
                  alt={`Scrap ${galleryIndex + 1}`}
                  className="w-full h-auto max-h-[70vh] object-contain rounded"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
                {galleryImages.length > 1 && (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow"
                      onClick={() =>
                        setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length)
                      }
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow"
                      onClick={() => setGalleryIndex((i) => (i + 1) % galleryImages.length)}
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      {galleryIndex + 1} / {galleryImages.length}
                    </span>
                  </>
                )}
              </div>
              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((url, idx) => (
                    <button
                      key={`thumb-${idx}`}
                      type="button"
                      onClick={() => setGalleryIndex(idx)}
                      className={`shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition ${
                        idx === galleryIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageOrders;
