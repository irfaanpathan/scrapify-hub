import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState(location.state?.category || "");
  const [subCategory, setSubCategory] = useState("");
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [weight, setWeight] = useState("");
  const [knowsWeight, setKnowsWeight] = useState("yes");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
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
    if (category) {
      fetchSubCategories();
      setSubCategory("");
    }
  }, [category]);

  const fetchSubCategories = async () => {
    const { data, error } = await supabase
      .from("sub_categories")
      .select("*")
      .eq("category", category)
      .order("name");

    if (error) {
      console.error("Error fetching sub-categories:", error);
      return;
    }

    setSubCategories(data || []);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      // Upload images if any
      const imageUrls: string[] = [];
      for (const image of images) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("scrap-images")
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("scrap-images")
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          category,
          sub_category: subCategory,
          estimated_weight: knowsWeight === "yes" ? parseFloat(weight) : null,
          pickup_address: address,
          pickup_time: pickupDate?.toISOString(),
          notes,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

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

      toast.success("Order placed successfully!");
      navigate("/track");
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto shadow-elevated">
          <CardHeader>
            <CardTitle className="text-2xl">Place Scrap Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Scrap Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="paper">Paper</SelectItem>
                    <SelectItem value="plastic">Plastic</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="ewaste">E-Waste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {category && subCategories.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="subCategory">Sub-Category</Label>
                  <Select value={subCategory} onValueChange={setSubCategory} required>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select sub-category" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {subCategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.name}>
                          {sub.name} - ₹{sub.price_per_kg}/kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {category && subCategory && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>Note:</strong> Price may vary during doorstep inspection by partner.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Do you know the weight?</Label>
                <Select value={knowsWeight} onValueChange={setKnowsWeight}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="yes">Yes, I know the weight</SelectItem>
                    <SelectItem value="no">No, I don't know</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {knowsWeight === "yes" && (
                <div className="space-y-2">
                  <Label htmlFor="weight">Estimated Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 5.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                  />
                </div>
              )}

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
                <Label>Pickup Date & Time</Label>
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

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Placing Order..." : "Place Order"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlaceOrder;