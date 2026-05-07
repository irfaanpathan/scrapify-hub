import { Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Subcategory icons
import newspaperIcon from "@/assets/subcategories/newspaper.png";
import cardboardIcon from "@/assets/subcategories/cardboard.png";
import booksIcon from "@/assets/subcategories/books.png";
import officePaperIcon from "@/assets/subcategories/office-paper.png";
import tetraPackIcon from "@/assets/subcategories/tetra-pack.png";
import shreddedPaperIcon from "@/assets/subcategories/shredded-paper.png";
import corrugatedBoxesIcon from "@/assets/subcategories/corrugated-boxes.png";
import petBottlesIcon from "@/assets/subcategories/pet-bottles.png";
import softPlasticIcon from "@/assets/subcategories/soft-plastic.png";
import hardPlasticIcon from "@/assets/subcategories/hard-plastic.png";
import pvcPlasticIcon from "@/assets/subcategories/pvc-plastic.png";
import plasticToysIcon from "@/assets/subcategories/plastic-toys.png";
import plasticHouseholdIcon from "@/assets/subcategories/plastic-household.png";
import mixedPlasticIcon from "@/assets/subcategories/mixed-plastic.png";
import ironIcon from "@/assets/subcategories/iron.png";
import steelIcon from "@/assets/subcategories/steel.png";
import copperIcon from "@/assets/subcategories/copper.png";
import aluminumIcon from "@/assets/subcategories/aluminum.png";
import brassIcon from "@/assets/subcategories/brass.png";
import stainlessSteelIcon from "@/assets/subcategories/stainless-steel.png";
import mixedMetalIcon from "@/assets/subcategories/mixed-metal.png";
import mobilePhonesIcon from "@/assets/subcategories/mobile-phones.png";
import laptopsIcon from "@/assets/subcategories/laptops.png";
import batteriesIcon from "@/assets/subcategories/batteries.png";
import chargersCablesIcon from "@/assets/subcategories/chargers-cables.png";
import circuitBoardsIcon from "@/assets/subcategories/circuit-boards.png";
import homeAppliancesIcon from "@/assets/subcategories/home-appliances.png";
import ledBulbsIcon from "@/assets/subcategories/led-bulbs.png";

// Map subcategory names to icons
const getSubcategoryIcon = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  // Paper category
  if (lowerName.includes('newspaper')) return newspaperIcon;
  if (lowerName.includes('cardboard')) return cardboardIcon;
  if (lowerName.includes('book') || lowerName.includes('magazine')) return booksIcon;
  if (lowerName.includes('office paper') || lowerName.includes('mixed paper')) return officePaperIcon;
  if (lowerName.includes('tetra')) return tetraPackIcon;
  if (lowerName.includes('shredded')) return shreddedPaperIcon;
  if (lowerName.includes('corrugated')) return corrugatedBoxesIcon;
  
  // Plastic category
  if (lowerName.includes('pet bottle')) return petBottlesIcon;
  if (lowerName.includes('soft plastic') || lowerName.includes('bags') || lowerName.includes('wrappers')) return softPlasticIcon;
  if (lowerName.includes('hard plastic') || lowerName.includes('bottles, containers')) return hardPlasticIcon;
  if (lowerName.includes('pvc')) return pvcPlasticIcon;
  if (lowerName.includes('toy')) return plasticToysIcon;
  if (lowerName.includes('household')) return plasticHouseholdIcon;
  if (lowerName.includes('mixed plastic')) return mixedPlasticIcon;
  
  // Metal category
  if (lowerName.includes('iron')) return ironIcon;
  if (lowerName.includes('stainless')) return stainlessSteelIcon;
  if (lowerName.includes('steel')) return steelIcon;
  if (lowerName.includes('copper')) return copperIcon;
  if (lowerName.includes('aluminum') || lowerName.includes('aluminium')) return aluminumIcon;
  if (lowerName.includes('brass')) return brassIcon;
  if (lowerName.includes('mixed metal')) return mixedMetalIcon;
  
  // E-Waste category
  if (lowerName.includes('mobile') || lowerName.includes('phone')) return mobilePhonesIcon;
  if (lowerName.includes('laptop') || lowerName.includes('computer')) return laptopsIcon;
  if (lowerName.includes('batter')) return batteriesIcon;
  if (lowerName.includes('charger') || lowerName.includes('cable')) return chargersCablesIcon;
  if (lowerName.includes('board') || lowerName.includes('component')) return circuitBoardsIcon;
  if (lowerName.includes('appliance')) return homeAppliancesIcon;
  if (lowerName.includes('led') || lowerName.includes('bulb') || lowerName.includes('tube')) return ledBulbsIcon;
  
  // Default fallback
  return cardboardIcon;
};

interface SubCategory {
  id: string;
  name: string;
  category: string;
  price_per_kg: number;
}

interface SubCategoryGridProps {
  subCategories: SubCategory[];
  categoryName: string;
  customImages?: Record<string, string>;
}

const SubCategoryGrid = ({ subCategories, categoryName, customImages = {} }: SubCategoryGridProps) => {
  const { addItem, items, updateItem, removeItem, getItemEstimate } = useCart();
  const [quickWeights, setQuickWeights] = useState<Record<string, string>>({});

  const getCartItem = (subCategory: SubCategory) => {
    return items.find(
      (item) => item.category === subCategory.category && item.subCategory === subCategory.id
    );
  };

  const handleAddToCart = (subCategory: SubCategory) => {
    const existing = getCartItem(subCategory);
    
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

  const handleQuickWeight = (subCategory: SubCategory, weight: string) => {
    const numWeight = parseFloat(weight);
    const cartItem = getCartItem(subCategory);
    
    if (cartItem) {
      updateItem(cartItem.id, { estimatedWeight: numWeight > 0 ? numWeight : null });
    } else {
      addItem({
        category: subCategory.category,
        subCategory: subCategory.id,
        subCategoryName: subCategory.name,
        pricePerKg: subCategory.price_per_kg,
        estimatedWeight: numWeight > 0 ? numWeight : null,
        notes: "",
      });
    }
    
    setQuickWeights((prev) => ({ ...prev, [subCategory.id]: weight }));
  };

  const handleRemoveFromCart = (subCategory: SubCategory) => {
    const cartItem = getCartItem(subCategory);
    if (cartItem) {
      removeItem(cartItem.id);
      setQuickWeights((prev) => {
        const next = { ...prev };
        delete next[subCategory.id];
        return next;
      });
      toast.success(`${subCategory.name} removed from cart`);
    }
  };

  if (subCategories.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground">Select a category to view items</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{categoryName}</h2>
        <p className="text-sm text-muted-foreground">Tap to add, enter weight for estimate</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {subCategories.map((sub) => {
          const cartItem = getCartItem(sub);
          const inCart = !!cartItem;
          const weight = quickWeights[sub.id] || (cartItem?.estimatedWeight?.toString() ?? "");
          const estimate = cartItem ? getItemEstimate(cartItem.id) : 0;
          
          return (
            <Card
              key={sub.id}
              className={cn(
                "group transition-all hover:shadow-elevated relative overflow-hidden",
                inCart && "ring-2 ring-primary"
              )}
            >
              {inCart && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              )}
              <CardContent className="p-3 md:p-4 text-center space-y-2 md:space-y-3">
                <div 
                  className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-muted rounded-xl flex items-center justify-center cursor-pointer group-hover:bg-primary/10 transition-colors overflow-hidden p-1"
                  onClick={() => handleAddToCart(sub)}
                >
                  <img 
                    src={customImages[sub.id] || getSubcategoryIcon(sub.name)} 
                    alt={sub.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-xs md:text-sm line-clamp-2">
                    {sub.name}
                  </h3>
                  <p className="text-base md:text-lg font-bold text-primary mt-1">
                    ₹{sub.price_per_kg}/kg
                  </p>
                </div>

                {inCart ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs"
                    onClick={() => handleRemoveFromCart(sub)}
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => handleAddToCart(sub)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-4 md:mt-6 p-3 md:p-4 bg-warning/20 border-2 border-warning/50 rounded-lg shadow-sm">
        <p className="text-sm md:text-base font-semibold text-foreground">
          ⚠️ <strong className="font-bold">Note:</strong> Price may vary during doorstep inspection by partner.
        </p>
      </div>
    </div>
  );
};

export default SubCategoryGrid;
