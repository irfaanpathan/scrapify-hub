import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

interface FloatingCartButtonProps {
  onClick: () => void;
}

const FloatingCartButton = ({ onClick }: FloatingCartButtonProps) => {
  const { items, getTotalEstimate } = useCart();
  const totalEstimate = getTotalEstimate();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-30">
      <Button
        onClick={onClick}
        className="w-full md:w-auto h-14 px-6 shadow-elevated text-base gap-3"
        size="lg"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-sm">
            {items.length}
          </span>
        </div>
        <span className="hidden sm:inline">View Cart</span>
        <span className="font-bold">₹{totalEstimate.toFixed(2)}</span>
      </Button>
    </div>
  );
};

export default FloatingCartButton;
