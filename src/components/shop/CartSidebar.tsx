import { ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const { items, updateItem, removeItem, getTotalEstimate, clearCart } = useCart();
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add items from the categories
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-muted/50 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {item.subCategoryName}
                    </h3>
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
                  <Label className="text-xs text-muted-foreground">
                    Estimated Weight (kg) - Optional
                  </Label>
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
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Notes - Optional
                  </Label>
                  <Textarea
                    placeholder="Any special notes..."
                    value={item.notes}
                    onChange={(e) =>
                      updateItem(item.id, { notes: e.target.value })
                    }
                    className="min-h-[60px] text-sm"
                  />
                </div>

                {item.estimatedWeight && (
                  <div className="text-right text-sm">
                    <span className="text-muted-foreground">Estimate: </span>
                    <span className="font-semibold text-primary">
                      ₹{(item.estimatedWeight * item.pricePerKg).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estimated Total:</span>
              <span className="text-xl font-bold text-primary">
                ₹{totalEstimate.toFixed(2)}
              </span>
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
                Proceed
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;
