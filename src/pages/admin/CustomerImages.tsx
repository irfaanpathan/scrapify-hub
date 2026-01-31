import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Image as ImageIcon, Calendar, Package, User, X, ZoomIn, Download } from "lucide-react";
import { format } from "date-fns";

interface OrderImage {
  id: string;
  image_url: string;
  created_at: string;
  order_id: string;
  order?: {
    id: string;
    category: string;
    sub_category: string | null;
    status: string;
    pickup_address: string;
    created_at: string;
    customer_id: string;
    customer?: {
      full_name: string;
      phone: string | null;
    };
  };
}

const CustomerImages = () => {
  const { isAdmin, loading } = useAdminAuth();
  const [images, setImages] = useState<OrderImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<OrderImage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<OrderImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    fetchImages();
  }, [isAdmin]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredImages(images);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = images.filter((img) => {
      const order = img.order;
      if (!order) return false;
      
      return (
        order.category?.toLowerCase().includes(query) ||
        order.sub_category?.toLowerCase().includes(query) ||
        order.status?.toLowerCase().includes(query) ||
        order.pickup_address?.toLowerCase().includes(query) ||
        order.customer?.full_name?.toLowerCase().includes(query) ||
        order.customer?.phone?.includes(query) ||
        order.id?.toLowerCase().includes(query)
      );
    });
    setFilteredImages(filtered);
  }, [searchQuery, images]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      // First fetch all order images
      const { data: imagesData, error: imagesError } = await supabase
        .from("order_images")
        .select("*")
        .order("created_at", { ascending: false });

      if (imagesError) throw imagesError;

      if (!imagesData || imagesData.length === 0) {
        setImages([]);
        setFilteredImages([]);
        setIsLoading(false);
        return;
      }

      // Get unique order IDs
      const orderIds = [...new Set(imagesData.map((img) => img.order_id))];

      // Fetch orders with customer info
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, category, sub_category, status, pickup_address, created_at, customer_id")
        .in("id", orderIds);

      if (ordersError) throw ordersError;

      // Fetch customer profiles
      const customerIds = [...new Set(ordersData?.map((o) => o.customer_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", customerIds);

      // Map everything together
      const enrichedImages: OrderImage[] = imagesData.map((img) => {
        const order = ordersData?.find((o) => o.id === img.order_id);
        const customer = profilesData?.find((p) => p.id === order?.customer_id);
        return {
          ...img,
          order: order ? {
            ...order,
            customer: customer || undefined,
          } : undefined,
        };
      });

      setImages(enrichedImages);
      setFilteredImages(enrichedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      picked: "bg-purple-100 text-purple-800",
      weighed: "bg-orange-100 text-orange-800",
      paid: "bg-green-100 text-green-800",
      completed: "bg-emerald-100 text-emerald-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = imageName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
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
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Customer Images</h1>
            <p className="text-muted-foreground mt-1">
              View all scrap images uploaded by customers
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            <span>{images.length} total images</span>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, phone, order ID, category, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Images Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading images...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No images match your search" : "No customer images uploaded yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <Card 
                key={image.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-square relative bg-muted">
                  <img
                    src={image.image_url}
                    alt="Customer scrap"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {image.order?.category || "Unknown"}
                      </Badge>
                      {image.order?.status && (
                        <Badge className={`text-xs ${getStatusColor(image.order.status)}`}>
                          {image.order.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="truncate">
                        {image.order?.customer?.full_name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(image.created_at), "dd MMM yyyy")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Image Preview Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image Details
              </DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.image_url}
                    alt="Customer scrap"
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer</h3>
                    <p className="font-medium">{selectedImage.order?.customer?.full_name || "Unknown"}</p>
                    {selectedImage.order?.customer?.phone && (
                      <p className="text-sm text-muted-foreground">{selectedImage.order.customer.phone}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                    <div className="flex gap-2">
                      <Badge>{selectedImage.order?.category || "Unknown"}</Badge>
                      {selectedImage.order?.sub_category && (
                        <Badge variant="outline">{selectedImage.order.sub_category}</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Order Status</h3>
                    <Badge className={getStatusColor(selectedImage.order?.status || "")}>
                      {selectedImage.order?.status || "Unknown"}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Pickup Address</h3>
                    <p className="text-sm">{selectedImage.order?.pickup_address || "Not available"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Uploaded</h3>
                    <p className="text-sm">
                      {format(new Date(selectedImage.created_at), "dd MMM yyyy, hh:mm a")}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Order ID</h3>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {selectedImage.order_id}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDownload(selectedImage.image_url, `scrap-${selectedImage.id}.jpg`)}
                    className="w-full mt-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Image
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CustomerImages;
