import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

interface FloatingCartButtonProps {
  onClick: () => void;
}

const FloatingCartButton = ({ onClick }: FloatingCartButtonProps) => {
  const { items, getTotalEstimate } = useCart();
  const totalEstimate = getTotalEstimate();

  if (items.length === 0) return null;

  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-auto",
        "h-14 rounded-2xl shadow-elevated z-30 flex items-center justify-between gap-4 px-4",
        "bg-primary hover:bg-primary-hover text-primary-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <ShoppingCart className="h-5 w-5" />
          <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {items.length}
          </span>
        </div>
        <span className="font-medium hidden md:inline">View Cart</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm opacity-80">Est.</span>
        <span className="font-bold text-lg">₹{totalEstimate.toFixed(0)}</span>
      </div>
    </Button>
  );
};

export default FloatingCartButton;
