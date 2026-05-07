import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, Trash2, ArrowLeft, Package, MapPin, Clock, CheckCircle2, Minus, Plus } from "lucide-react";
import { format } from "date-fns";
import { useCart } from "@/hooks/useCart";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateItem, clearCart, getTotalEstimate, getItemEstimate } = useCart();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [pickupDate, setPickupDate] = useState<Date>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
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

  const MAX_IMAGES = 5;
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);

    const invalid = selected.filter((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid.length > 0) {
      toast.error("Only JPG, JPEG, PNG, or WEBP images are allowed");
      e.target.value = "";
      return;
    }

    const combined = [...images, ...selected];
    if (combined.length > MAX_IMAGES) {
      toast.error(`You can upload a maximum of ${MAX_IMAGES} images`);
      e.target.value = "";
      return;
    }

    setImages(combined);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWeightChange = (id: string, value: string) => {
    const weight = parseFloat(value);
    updateItem(id, { estimatedWeight: isNaN(weight) || weight <= 0 ? null : weight });
  };

  const incrementWeight = (id: string, currentWeight: number | null) => {
    const newWeight = (currentWeight || 0) + 0.5;
    updateItem(id, { estimatedWeight: newWeight });
  };

  const decrementWeight = (id: string, currentWeight: number | null) => {
    const newWeight = Math.max(0, (currentWeight || 0) - 0.5);
    updateItem(id, { estimatedWeight: newWeight > 0 ? newWeight : null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;

    setIsLoading(true);

    try {
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

      const primaryCategory = items[0].category as "paper" | "plastic" | "metal" | "ewaste";
      
      // Combine address fields into full address
      const fullAddress = [
        addressLine1,
        addressLine2,
        landmark ? `Near ${landmark}` : "",
        city,
        pincode
      ].filter(Boolean).join(", ");

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          category: primaryCategory,
          pickup_address: fullAddress,
          pickup_time: pickupDate?.toISOString(),
          status: "pending" as const,
        })
        .select()
        .single();

      if (orderError) throw orderError;

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
      navigate(`/order-confirmation?orderId=${orderData.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  };

  const totalEstimate = getTotalEstimate();

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-14 md:top-16 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Checkout</h1>
              <p className="text-xs text-muted-foreground">{items.length} items in cart</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 pb-32 md:pb-8">
        <div className="max-w-3xl mx-auto space-y-4">
          
          {/* Order Items Section */}
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Your Items</h2>
                <p className="text-xs text-muted-foreground">Review and adjust quantities</p>
              </div>
            </div>
            
            <div className="divide-y divide-border">
              {items.map((item) => {
                const itemEstimate = getItemEstimate(item.id);
                
                return (
                  <div key={item.id} className="p-4">
                    <div className="flex gap-4">
                      {/* Item icon */}
                      <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-foreground">{item.subCategoryName}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-background"
                              onClick={() => decrementWeight(item.id, item.estimatedWeight)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <div className="min-w-[60px] text-center">
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="0"
                                value={item.estimatedWeight || ""}
                                onChange={(e) => handleWeightChange(item.id, e.target.value)}
                                className="h-8 w-16 text-center text-sm border-0 bg-transparent focus-visible:ring-0"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-background"
                              onClick={() => incrementWeight(item.id, item.estimatedWeight)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground pr-2">kg</span>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">₹{item.pricePerKg}/kg</p>
                            {itemEstimate > 0 && (
                              <p className="font-semibold text-primary">₹{itemEstimate.toFixed(0)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pickup Details Section */}
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Pickup Details</h2>
                <p className="text-xs text-muted-foreground">Where should we pick up?</p>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Address Fields - Zepto/Amazon Style */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Pickup Address</Label>
                
                <div className="space-y-3">
                  <Input
                    placeholder="House/Flat/Block No. *"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                    className="h-12 bg-muted/50 border-0 focus-visible:ring-1"
                  />
                  
                  <Input
                    placeholder="Apartment/Road/Area"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="h-12 bg-muted/50 border-0 focus-visible:ring-1"
                  />
                  
                  <Input
                    placeholder="Nearby Landmark (e.g., Near Park, Opposite School)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="h-12 bg-muted/50 border-0 focus-visible:ring-1"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="City *"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="h-12 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                    <Input
                      placeholder="Pincode *"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      required
                      maxLength={6}
                      className="h-12 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Pickup Date
                </Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-12 bg-muted/50 border-0 hover:bg-muted"
                    >
                      <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                      {pickupDate ? format(pickupDate, "EEEE, MMMM d, yyyy") : "Choose your preferred date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background" align="start" side="bottom" sideOffset={4}>
                    <Calendar
                      mode="single"
                      selected={pickupDate}
                      onSelect={setPickupDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                    <div className="p-3 border-t border-border">
                      <Button 
                        className="w-full" 
                        size="sm" 
                        disabled={!pickupDate}
                        onClick={() => setDatePickerOpen(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Add Photos (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Photos help our partner prepare better for the pickup (up to {MAX_IMAGES} images)
                </p>
                <Label htmlFor="images" className={`block ${images.length >= MAX_IMAGES ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground hover:text-primary transition-colors" />
                    <Input
                      id="images"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      disabled={images.length >= MAX_IMAGES}
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div>
                      <span className="text-primary font-medium">Tap to add photos</span>
                      <span className="text-muted-foreground"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, JPEG, PNG, WEBP • {images.length}/{MAX_IMAGES} selected
                    </p>
                  </div>
                </Label>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`preview-${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow opacity-90 hover:opacity-100"
                          aria-label="Remove image"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Order Summary</h2>
                <p className="text-xs text-muted-foreground">Estimated earnings</p>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {items.map((item) => {
                const itemEstimate = getItemEstimate(item.id);
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">
                      {item.subCategoryName} {item.estimatedWeight ? `(${item.estimatedWeight}kg)` : ''}
                    </span>
                    <span className="font-medium shrink-0">
                      {itemEstimate > 0 ? `₹${itemEstimate.toFixed(0)}` : "-"}
                    </span>
                  </div>
                );
              })}
              
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Estimated Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{totalEstimate.toFixed(0)}
                  </span>
                </div>
              </div>
              
              <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-3 mt-3">
                <p className="text-sm font-semibold text-foreground">
                  💡 The final amount may vary slightly based on actual weight measured during pickup. No worries—our partner will confirm everything with you!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 md:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-primary">₹{totalEstimate.toFixed(0)}</span>
        </div>
        <Button
          className="w-full h-12 text-base font-semibold rounded-xl"
          size="lg"
          disabled={isLoading || !addressLine1 || !city || !pincode || !pickupDate}
          onClick={handleSubmit}
        >
          {isLoading ? "Placing Order..." : "Place Order"}
        </Button>
      </div>

      {/* Desktop Button */}
      <div className="hidden md:block container mx-auto px-4 pb-8">
        <div className="max-w-3xl mx-auto">
          <Button
            className="w-full h-14 text-lg font-semibold rounded-xl"
            size="lg"
            disabled={isLoading || !addressLine1 || !city || !pincode || !pickupDate}
            onClick={handleSubmit}
          >
            {isLoading ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
