import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Upload } from "lucide-react";

const ManageImages = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [categoryImages, setCategoryImages] = useState<any>({
    paper: null,
    plastic: null,
    metal: null,
    ewaste: null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchCategoryImages();
      }
    });
  }, [navigate]);

  const fetchCategoryImages = async () => {
    const { data, error } = await supabase
      .from("category_images")
      .select("*");

    if (error) {
      console.error("Error fetching category images:", error);
      return;
    }

    const imagesMap: any = {};
    data?.forEach((img) => {
      imagesMap[img.category] = img;
    });
    setCategoryImages(imagesMap);
  };

  const handleImageUpload = async (category: string, file: File) => {
    if (!file) return;

    setUploading(category);

    try {
      // Upload image to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${category}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("scrap-images")
        .upload(`categories/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("scrap-images")
        .getPublicUrl(`categories/${fileName}`);

      // Check if category image already exists
      const existing = categoryImages[category];

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from("category_images")
          .update({ image_url: publicUrl })
          .eq("category", category as "paper" | "plastic" | "metal" | "ewaste");

        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("category_images")
          .insert({ 
            category: category as "paper" | "plastic" | "metal" | "ewaste", 
            image_url: publicUrl 
          });

        if (insertError) throw insertError;
      }

      toast.success("Category image updated successfully");
      fetchCategoryImages();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(null);
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "paper":
        return "Paper";
      case "plastic":
        return "Plastic";
      case "metal":
        return "Metal";
      case "ewaste":
        return "E-Waste";
      default:
        return category;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Manage Category Images</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {["paper", "plastic", "metal", "ewaste"].map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{getCategoryName(category)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryImages[category]?.image_url && (
                  <img
                    src={categoryImages[category].image_url}
                    alt={getCategoryName(category)}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <div>
                  <Label htmlFor={`image-${category}`}>Upload New Image</Label>
                  <Input
                    id={`image-${category}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(category, file);
                    }}
                    disabled={uploading === category}
                  />
                </div>
                {uploading === category && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4 animate-pulse" />
                    Uploading...
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageImages;