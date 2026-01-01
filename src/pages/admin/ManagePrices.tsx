import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ManagePrices = () => {
  const { isAdmin, loading } = useAdminAuth();
  const [prices, setPrices] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    if (isAdmin) {
      fetchPrices();
    }
  }, [isAdmin]);

  const fetchPrices = async () => {
    const { data } = await supabase.from("scrap_prices").select("*").order("category");
    if (data) setPrices(data);
  };

  const handleUpdatePrice = async (id: string) => {
    const { error } = await supabase
      .from("scrap_prices")
      .update({ price_per_kg: parseFloat(newPrice) })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update price");
    } else {
      toast.success("Price updated successfully");
      setEditingId(null);
      setNewPrice("");
      fetchPrices();
    }
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
        <h1 className="text-3xl font-bold mb-8">Manage Scrap Prices</h1>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          {prices.map((item) => (
            <Card key={item.id} className="shadow-soft">
              <CardHeader>
                <CardTitle>{getCategoryName(item.category)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId === item.id ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`price-${item.id}`}>Price per kg (₹)</Label>
                      <Input
                        id={`price-${item.id}`}
                        type="number"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder={item.price_per_kg}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleUpdatePrice(item.id)} className="flex-1">
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setNewPrice("");
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Price</p>
                      <p className="text-3xl font-bold text-primary">₹{item.price_per_kg}/kg</p>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingId(item.id);
                        setNewPrice(item.price_per_kg);
                      }}
                      className="w-full"
                    >
                      Update Price
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagePrices;