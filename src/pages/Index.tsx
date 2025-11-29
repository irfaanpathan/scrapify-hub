import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import CategoryCard from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { Leaf, Recycle, TrendingUp, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [prices, setPrices] = useState<any[]>([]);
  const [banner, setBanner] = useState<any>(null);
  const [categoryImages, setCategoryImages] = useState<any>({});

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
    const fetchPrices = async () => {
      const { data } = await supabase
        .from("scrap_prices")
        .select("*")
        .order("category");
      
      if (data) setPrices(data);
    };

    const fetchBanner = async () => {
      const { data } = await supabase
        .from("home_banners")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      
      if (data) setBanner(data);
    };

    const fetchCategoryImages = async () => {
      const { data } = await supabase
        .from("category_images")
        .select("*");
      
      if (data) {
        const imagesMap: any = {};
        data.forEach((img) => {
          imagesMap[img.category] = img.image_url;
        });
        setCategoryImages(imagesMap);
      }
    };

    fetchPrices();
    fetchBanner();
    fetchCategoryImages();
  }, []);

  const handleCategorySelect = (category: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate("/order", { state: { category } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with Banner */}
      <section className="bg-gradient-hero text-primary-foreground">
        {banner?.image_url && (
          <div className="w-full h-64 md:h-96 overflow-hidden">
            <img 
              src={banner.image_url} 
              alt="Home Banner" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold">
                Turn Your Scrap Into Cash
              </h1>
              <p className="text-xl md:text-2xl opacity-90">
                Sell household, office, and factory scrap from the comfort of your home
              </p>
              <div className="flex gap-4 justify-center mt-8">
                {user ? (
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="text-lg"
                    onClick={() => navigate("/order")}
                  >
                    Place Order Now
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="text-lg"
                    onClick={() => navigate("/auth")}
                  >
                    Get Started
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SCRAPY5?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 bg-primary/10 rounded-full">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Eco-Friendly</h3>
              <p className="text-muted-foreground">
                Contribute to a cleaner environment by recycling your scrap responsibly
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 bg-primary/10 rounded-full">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Best Prices</h3>
              <p className="text-muted-foreground">
                Get competitive market rates for all types of scrap materials
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 bg-primary/10 rounded-full">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Doorstep Pickup</h3>
              <p className="text-muted-foreground">
                Our verified partners collect scrap right from your doorstep
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Current Market Prices</h2>
          <p className="text-center text-muted-foreground mb-12">
            Select a category to place your order
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {prices.map((item) => (
              <CategoryCard
                key={item.category}
                category={item.category}
                price={parseFloat(item.price_per_kg)}
                onSelect={() => handleCategorySelect(item.category)}
                imageUrl={categoryImages[item.category]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Recycle className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to Start Recycling?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of customers who trust SCRAPY5
          </p>
          {!user && (
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/auth")}
            >
              Sign Up Now
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
