import { FileText, PackageOpen, Wrench, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

interface HorizontalCategoriesProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  paper: <FileText className="h-5 w-5" />,
  plastic: <PackageOpen className="h-5 w-5" />,
  metal: <Wrench className="h-5 w-5" />,
  ewaste: <Cpu className="h-5 w-5" />,
};

const HorizontalCategories = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: HorizontalCategoriesProps) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide md:hidden">
      <div className="flex gap-3 px-4 py-3 min-w-max">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-w-[70px]",
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground shadow-soft scale-105"
                : "bg-card border border-border hover:border-primary/50"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center overflow-hidden",
                selectedCategory === category.id
                  ? "bg-primary-foreground/20"
                  : "bg-muted"
              )}
            >
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className={cn(
                    selectedCategory === category.id
                      ? "text-primary-foreground"
                      : "text-primary"
                  )}
                >
                  {categoryIcons[category.id]}
                </span>
              )}
            </div>
            <span className="text-xs font-medium whitespace-nowrap">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HorizontalCategories;
