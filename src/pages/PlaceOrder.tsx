import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, Trash2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useCart } from "@/hooks/useCart";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateItem, clearCart, getTotalEstimate } = useCart();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [pickupDate, setPickupDate] = useState<Date>();
  const [images, setImages] = useState<File[]>([]);

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
    if (items.length === 0 && user) {
      navigate("/");
    }
  }, [items.length, user, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;

    setIsLoading(true);

    try {
      // Upload images if any
      const imageUrls: string[] = [];
      for (const image of images) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("scrap-images")
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("scrap-images")
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // Get the primary category (first item's category)
      const primaryCategory = items[0].category as "paper" | "plastic" | "metal" | "ewaste";

      // Create main order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          category: primaryCategory,
          pickup_address: address,
          pickup_time: pickupDate?.toISOString(),
          notes: items.map(i => i.notes).filter(Boolean).join("; "),
          status: "pending" as const,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        category: item.category,
        sub_category: item.subCategoryName,
        estimated_weight: item.estimatedWeight,
        price_per_kg: item.pricePerKg,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Insert image records
      if (imageUrls.length > 0) {
        const { error: imagesError } = await supabase
          .from("order_images")
          .insert(
            imageUrls.map((url) => ({
              order_id: orderData.id,
              image_url: url,
            }))
          );

        if (imagesError) throw imagesError;
      }

      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/order-confirmation?orderId=${orderData.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  };

  const totalEstimate = getTotalEstimate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Order Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-muted/50 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {item.subCategoryName}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {item.category}
                        </p>
                        <p className="text-sm text-primary font-semibold">
                          ₹{item.pricePerKg}/kg
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Estimated Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="e.g., 5.5"
                        value={item.estimatedWeight || ""}
                        onChange={(e) =>
                          updateItem(item.id, {
                            estimatedWeight: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          })
                        }
                      />
                    </div>

                    {item.estimatedWeight && (
                      <div className="text-right text-sm">
                        <span className="text-muted-foreground">Subtotal: </span>
                        <span className="font-semibold text-primary">
                          ₹{(item.estimatedWeight * item.pricePerKg).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pickup Details */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Pickup Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="address">Pickup Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your complete address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pickup Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {pickupDate ? format(pickupDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background">
                        <Calendar
                          mode="single"
                          selected={pickupDate}
                          onSelect={setPickupDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="images">Upload Scrap Photos (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <Input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Label htmlFor="images" className="cursor-pointer text-primary hover:underline">
                        Click to upload images
                      </Label>
                      {images.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {images.length} file(s) selected
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-elevated sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">
                        {item.subCategoryName}
                      </span>
                      <span className="font-medium">
                        {item.estimatedWeight
                          ? `₹${(item.estimatedWeight * item.pricePerKg).toFixed(2)}`
                          : "-"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Estimated Total</span>
                    <span className="text-primary text-lg">
                      ₹{totalEstimate.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                  <p className="text-xs text-warning-foreground">
                    ⚠️ Final price may vary during doorstep inspection by partner.
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={isLoading || !address || !pickupDate}
                  onClick={handleSubmit}
                >
                  {isLoading ? "Placing Order..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
