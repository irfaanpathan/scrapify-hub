import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ManageSubCategories = () => {
  const { isAdmin, loading } = useAdminAuth();
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");

  useEffect(() => {
    if (isAdmin) {
      fetchSubCategories();
    }
  }, [isAdmin]);

  const fetchSubCategories = async () => {
    const { data, error } = await supabase
      .from("sub_categories")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to fetch sub-categories");
      return;
    }

    setSubCategories(data || []);
  };

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from("sub_categories")
        .update({ price_per_kg: newPrice })
        .eq("id", id);

      if (error) throw error;

      toast.success("Price updated successfully");
      setEditingId(null);
      fetchSubCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "paper":
        return "Paper";
      case "plastic":
        return "Plastic";
      case "metal":
        return "Metal";
      case "ewaste":
        return "E-Waste";
      default:
        return category;
    }
  };

  const groupedCategories: Record<string, any[]> = subCategories.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

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
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Manage Sub-Category Prices
        </h1>

        {Object.entries(groupedCategories).map(([category, items]) => (
          <Card key={category} className="mb-6">
            <CardHeader>
              <CardTitle>{getCategoryName(category)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sub-Category</TableHead>
                    <TableHead>Price per Kg (₹)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24"
                          />
                        ) : (
                          `₹${item.price_per_kg}`
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === item.id ? (
                          <div className="space-x-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdatePrice(item.id, parseFloat(editPrice))
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditPrice(item.price_per_kg.toString());
                            }}
                          >
                            Edit Price
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ManageSubCategories;