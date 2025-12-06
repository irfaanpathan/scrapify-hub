import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubCategory {
  id: string;
  name: string;
  category: string;
  price_per_kg: number;
}

interface SubCategoryGridProps {
  subCategories: SubCategory[];
  categoryName: string;
}

const SubCategoryGrid = ({ subCategories, categoryName }: SubCategoryGridProps) => {
  const { addItem, items } = useCart();

  const handleAddToCart = (subCategory: SubCategory) => {
    // Check if already in cart
    const existing = items.find(
      (item) => item.category === subCategory.category && item.subCategory === subCategory.id
    );
    
    if (existing) {
      toast.info(`${subCategory.name} is already in your cart`);
      return;
    }

    addItem({
      category: subCategory.category,
      subCategory: subCategory.id,
      subCategoryName: subCategory.name,
      pricePerKg: subCategory.price_per_kg,
      estimatedWeight: null,
      notes: "",
    });
    
    toast.success(`${subCategory.name} added to cart`);
  };

  const isInCart = (subCategory: SubCategory) => {
    return items.some(
      (item) => item.category === subCategory.category && item.subCategory === subCategory.id
    );
  };

  if (subCategories.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground">Select a category to view items</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">{categoryName}</h2>
        <p className="text-muted-foreground">Select items to add to your order</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {subCategories.map((sub) => {
          const inCart = isInCart(sub);
          
          return (
            <Card
              key={sub.id}
              className={cn(
                "group transition-all hover:shadow-elevated cursor-pointer",
                inCart && "ring-2 ring-primary"
              )}
              onClick={() => handleAddToCart(sub)}
            >
              <CardContent className="p-4 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm line-clamp-2">
                    {sub.name}
                  </h3>
                  <p className="text-lg font-bold text-primary mt-1">
                    ₹{sub.price_per_kg}/kg
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={inCart ? "secondary" : "default"}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(sub);
                  }}
                >
                  {inCart ? (
                    "In Cart"
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
        <p className="text-sm text-warning-foreground">
          ⚠️ <strong>Note:</strong> Price may vary during doorstep inspection by partner.
        </p>
      </div>
    </div>
  );
};

export default SubCategoryGrid;
