import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import CategorySidebar from "@/components/shop/CategorySidebar";
import SubCategoryGrid from "@/components/shop/SubCategoryGrid";
import CartSidebar from "@/components/shop/CartSidebar";
import FloatingCartButton from "@/components/shop/FloatingCartButton";
import { Leaf, TrendingUp, Users } from "lucide-react";

const CATEGORY_NAMES: Record<string, string> = {
  paper: "Paper",
  plastic: "Plastic",
  metal: "Metal",
  ewaste: "E-Waste",
};

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; imageUrl?: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [banner, setBanner] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch banner
      const { data: bannerData } = await supabase
        .from("home_banners")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (bannerData) setBanner(bannerData);

      // Fetch category images
      const { data: imagesData } = await supabase.from("category_images").select("*");
      const imagesMap: Record<string, string> = {};
      imagesData?.forEach((img) => {
        imagesMap[img.category] = img.image_url;
      });

      // Get unique categories from sub_categories
      const { data: subCatsData } = await supabase
        .from("sub_categories")
        .select("category")
        .order("category");
      
      const uniqueCategories = [...new Set(subCatsData?.map((s) => s.category) || [])];
      
      const categoryList = uniqueCategories.map((cat) => ({
        id: cat,
        name: CATEGORY_NAMES[cat] || cat,
        imageUrl: imagesMap[cat],
      }));

      setCategories(categoryList);
      
      // Select first category by default
      if (categoryList.length > 0 && !selectedCategory) {
        setSelectedCategory(categoryList[0].id);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;

    const fetchSubCategories = async () => {
      const { data } = await supabase
        .from("sub_categories")
        .select("*")
        .eq("category", selectedCategory as any)
        .order("name");
      
      setSubCategories(data || []);
    };

    fetchSubCategories();
  }, [selectedCategory]);

  const getCategoryDisplayName = () => {
    return CATEGORY_NAMES[selectedCategory] || selectedCategory;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Banner */}
      {banner?.image_url && (
        <div className="w-full h-40 md:h-56 overflow-hidden">
          <img
            src={banner.image_url}
            alt="Home Banner"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Features Strip */}
      <section className="bg-primary/5 border-y border-border py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <Leaf className="h-5 w-5 text-primary" />
              <span>Eco-Friendly</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Best Prices</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span>Doorstep Pickup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Blinkit Style Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Category Sidebar */}
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Subcategory Grid */}
        <SubCategoryGrid
          subCategories={subCategories}
          categoryName={getCategoryDisplayName()}
        />
      </div>

      {/* Floating Cart Button */}
      <FloatingCartButton onClick={() => setIsCartOpen(true)} />

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        user={user}
      />
    </div>
  );
};

export default Index;
