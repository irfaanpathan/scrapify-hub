import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MobileNavbar from "@/components/shop/MobileNavbar";
import HorizontalCategories from "@/components/shop/HorizontalCategories";
import CategorySidebar from "@/components/shop/CategorySidebar";
import SubCategoryGrid from "@/components/shop/SubCategoryGrid";
import CartSidebar from "@/components/shop/CartSidebar";
import FloatingCartButton from "@/components/shop/FloatingCartButton";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/contexts/LanguageContext";
import { Leaf, TrendingUp, Users } from "lucide-react";

// Import category images
import paperImage from "@/assets/category-paper.jpg";
import plasticImage from "@/assets/category-plastic.jpg";
import metalImage from "@/assets/category-metal.jpg";
import ewasteImage from "@/assets/category-ewaste.jpg";

const CATEGORY_NAMES: Record<string, Record<string, string>> = {
  paper: { en: "Paper", hi: "कागज़" },
  plastic: { en: "Plastic", hi: "प्लास्टिक" },
  metal: { en: "Metal", hi: "धातु" },
  ewaste: { en: "E-Waste", hi: "ई-कचरा" },
};

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  paper: paperImage,
  plastic: plasticImage,
  metal: metalImage,
  ewaste: ewasteImage,
};

const Index = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; imageUrl?: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [subCategoryImages, setSubCategoryImages] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { items } = useCart();

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

      // Fetch subcategory images
      const { data: subCatImagesData } = await supabase.from("subcategory_images").select("*");
      const subCatImagesMap: Record<string, string> = {};
      subCatImagesData?.forEach((img) => {
        subCatImagesMap[img.sub_category_id] = img.image_url;
      });
      setSubCategoryImages(subCatImagesMap);

      // Get unique categories from sub_categories
      const { data: subCatsData } = await supabase
        .from("sub_categories")
        .select("category")
        .order("category");
      
      const uniqueCategories = [...new Set(subCatsData?.map((s) => s.category) || [])];
      
      const categoryList = uniqueCategories.map((cat) => ({
        id: cat,
        name: CATEGORY_NAMES[cat]?.[language] || CATEGORY_NAMES[cat]?.en || cat,
        imageUrl: imagesMap[cat] || DEFAULT_CATEGORY_IMAGES[cat],
      }));

      setCategories(categoryList);
      
      // Select first category by default
      if (categoryList.length > 0 && !selectedCategory) {
        setSelectedCategory(categoryList[0].id);
      }
    };

    fetchData();
  }, [language]);

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
    return CATEGORY_NAMES[selectedCategory]?.[language] || CATEGORY_NAMES[selectedCategory]?.en || selectedCategory;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      
      {/* Mobile Navbar */}
      <MobileNavbar
        user={user}
        cartItemCount={items.length}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Hero Banner */}
      {banner?.image_url && (
        <div className="w-full h-32 md:h-56 overflow-hidden">
          <img
            src={banner.image_url}
            alt="Home Banner"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Horizontal Categories - Mobile */}
      <HorizontalCategories
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Features Strip - Desktop only */}
      <section className="hidden md:block bg-primary/5 border-y border-border py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <Leaf className="h-5 w-5 text-primary" />
              <span>{t("ecoFriendly")}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>{t("bestPrices")}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span>{t("doorstepPickup")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Blinkit Style Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Category Sidebar - Desktop only */}
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Subcategory Grid */}
        <SubCategoryGrid
          subCategories={subCategories}
          categoryName={getCategoryDisplayName()}
          customImages={subCategoryImages}
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
