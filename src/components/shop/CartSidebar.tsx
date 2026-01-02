import { ShoppingCart, Trash2, X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const CartSidebar = ({ isOpen, onClose, user }: CartSidebarProps) => {
  const navigate = useNavigate();
  const { items, updateItem, removeItem, getTotalEstimate, clearCart, getItemEstimate } = useCart();
  const totalEstimate = getTotalEstimate();

  const handleProceedToCheckout = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (items.length === 0) {
      return;
    }
    onClose();
    navigate("/order");
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

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-96 bg-card border-l border-border shadow-elevated z-50 transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Your Cart</h2>
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add items from the categories
              </p>
            </div>
          ) : (
            items.map((item) => {
              const itemEstimate = getItemEstimate(item.id);
              
              return (
                <div
                  key={item.id}
                  className="bg-muted/50 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground text-sm">
                        {item.subCategoryName}
                      </h3>
                      <p className="text-xs text-primary font-semibold">
                        ₹{item.pricePerKg}/kg
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Weight controls */}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">
                      Weight (kg):
                    </Label>
                    <div className="flex items-center gap-1 flex-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => decrementWeight(item.id, item.estimatedWeight)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0"
                        value={item.estimatedWeight || ""}
                        onChange={(e) => handleWeightChange(item.id, e.target.value)}
                        className="h-7 text-center text-sm flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => incrementWeight(item.id, item.estimatedWeight)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Item estimate */}
                  {itemEstimate > 0 && (
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Estimate: </span>
                      <span className="text-sm font-bold text-primary">
                        ₹{itemEstimate.toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Total */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border space-y-3 bg-card">
            {/* Price breakdown */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Items:</span>
                <span>{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated Total:</span>
                <span className="text-xl font-bold text-primary">
                  ₹{totalEstimate.toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                * Final price determined at doorstep
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearCart}
              >
                Clear
              </Button>
              <Button className="flex-1" onClick={handleProceedToCheckout}>
                Checkout
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;
