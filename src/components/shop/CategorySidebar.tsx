import { cn } from "@/lib/utils";
import { FileText, PackageOpen, Wrench, Cpu } from "lucide-react";

interface CategorySidebarProps {
  categories: Array<{
    id: string;
    name: string;
    imageUrl?: string;
  }>;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  paper: <FileText className="h-5 w-5" />,
  plastic: <PackageOpen className="h-5 w-5" />,
  metal: <Wrench className="h-5 w-5" />,
  ewaste: <Cpu className="h-5 w-5" />,
};

const CategorySidebar = ({ categories, selectedCategory, onSelectCategory }: CategorySidebarProps) => {
  return (
    <aside className="hidden md:block w-56 lg:w-64 bg-card border-r border-border flex-shrink-0">
      <div className="sticky top-16 p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Categories</h2>
        <nav className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "hover:bg-muted text-foreground"
              )}
            >
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-8 h-8 rounded-md object-cover"
                />
              ) : (
                <span className={cn(
                  selectedCategory === category.id ? "text-primary-foreground" : "text-primary"
                )}>
                  {categoryIcons[category.id]}
                </span>
              )}
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default CategorySidebar;
