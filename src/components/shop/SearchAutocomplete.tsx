import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SubCategory {
  id: string;
  name: string;
  category: string;
  price_per_kg: number;
}

interface SearchAutocompleteProps {
  onSelect: (item: SubCategory) => void;
  placeholder?: string;
  className?: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  paper: "Paper",
  plastic: "Plastic",
  metal: "Metal",
  ewaste: "E-Waste",
};

const SearchAutocomplete = ({ onSelect, placeholder = "Search scrap items...", className }: SearchAutocompleteProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SubCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchSubCategories = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const { data } = await supabase
        .from("sub_categories")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("name")
        .limit(10);

      setResults(data || []);
      setIsLoading(false);
      setIsOpen(true);
    };

    const debounce = setTimeout(searchSubCategories, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (item: SubCategory) => {
    onSelect(item);
    setQuery("");
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-10 bg-muted/50 border-0"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_NAMES[item.category] || item.category}
                    </p>
                  </div>
                  <span className="text-primary font-semibold text-sm">
                    ₹{item.price_per_kg}/kg
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No items found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
