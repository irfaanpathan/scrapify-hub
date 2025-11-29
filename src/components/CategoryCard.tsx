import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PackageOpen, Wrench, Cpu } from "lucide-react";

interface CategoryCardProps {
  category: "paper" | "plastic" | "metal" | "ewaste";
  price: number;
  onSelect: () => void;
  imageUrl?: string;
}

const CategoryCard = ({ category, price, onSelect, imageUrl }: CategoryCardProps) => {
  const getIcon = () => {
    switch (category) {
      case "paper":
        return <FileText className="h-12 w-12 text-primary" />;
      case "plastic":
        return <PackageOpen className="h-12 w-12 text-primary" />;
      case "metal":
        return <Wrench className="h-12 w-12 text-primary" />;
      case "ewaste":
        return <Cpu className="h-12 w-12 text-primary" />;
    }
  };

  const getCategoryName = () => {
    switch (category) {
      case "paper":
        return "Paper";
      case "plastic":
        return "Plastic";
      case "metal":
        return "Metal";
      case "ewaste":
        return "E-Waste";
    }
  };

  return (
    <Card className="hover:shadow-elevated transition-all cursor-pointer" onClick={onSelect}>
      <CardContent className="p-6 text-center space-y-4">
        {imageUrl ? (
          <div className="w-full h-32 overflow-hidden rounded-lg">
            <img 
              src={imageUrl} 
              alt={getCategoryName()} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex justify-center">{getIcon()}</div>
        )}
        <div>
          <h3 className="font-semibold text-lg text-foreground">{getCategoryName()}</h3>
          <p className="text-2xl font-bold text-primary mt-2">₹{price}/kg</p>
        </div>
        <Button className="w-full">Select Category</Button>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;