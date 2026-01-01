import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Upload, Trash2, Image as ImageIcon, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SubCategory {
  id: string;
  name: string;
  category: string;
  price_per_kg: number;
}

interface SubCategoryImage {
  id: string;
  sub_category_id: string;
  image_url: string;
}

const ManageSubCategoryImages = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [subCategoryImages, setSubCategoryImages] = useState<Record<string, SubCategoryImage>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSubCategory, setPreviewSubCategory] = useState<SubCategory | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchData();
      }
    });
  }, [navigate]);

  const fetchData = async () => {
    // Fetch subcategories
    const { data: subCatsData, error: subCatsError } = await supabase
      .from("sub_categories")
      .select("*")
      .order("category")
      .order("name");

    if (subCatsError) {
      console.error("Error fetching subcategories:", subCatsError);
      return;
    }

    setSubCategories(subCatsData || []);

    // Fetch subcategory images
    const { data: imagesData, error: imagesError } = await supabase
      .from("subcategory_images")
      .select("*");

    if (imagesError) {
      console.error("Error fetching subcategory images:", imagesError);
      return;
    }

    const imagesMap: Record<string, SubCategoryImage> = {};
    imagesData?.forEach((img) => {
      imagesMap[img.sub_category_id] = img;
    });
    setSubCategoryImages(imagesMap);
  };

  const handleFileSelect = (subCategory: SubCategory, file: File) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPG, PNG, WebP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setPreviewSubCategory(subCategory);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewSubCategory) return;

    setUploading(previewSubCategory.id);

    try {
      const fileExt = selectedFile.name.split(".").pop()?.toLowerCase() || 'jpg';
      const fileName = `${previewSubCategory.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("scrap-images")
        .upload(`subcategories/${fileName}`, selectedFile, {
          cacheControl: '0',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("scrap-images")
        .getPublicUrl(`subcategories/${fileName}`);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const existing = subCategoryImages[previewSubCategory.id];

      if (existing) {
        const { error: updateError } = await supabase
          .from("subcategory_images")
          .update({ image_url: urlWithCacheBust, updated_at: new Date().toISOString() })
          .eq("sub_category_id", previewSubCategory.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("subcategory_images")
          .insert({
            sub_category_id: previewSubCategory.id,
            image_url: urlWithCacheBust
          });

        if (insertError) throw insertError;
      }

      toast.success("Image updated successfully");
      fetchData();
      handleCancelPreview();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(null);
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewSubCategory(null);
    setSelectedFile(null);
  };

  const handleDeleteImage = async (subCategoryId: string) => {
    const existing = subCategoryImages[subCategoryId];
    if (!existing) return;

    try {
      const { error } = await supabase
        .from("subcategory_images")
        .delete()
        .eq("sub_category_id", subCategoryId);

      if (error) throw error;

      toast.success("Image deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "paper": return "Paper";
      case "plastic": return "Plastic";
      case "metal": return "Metal";
      case "ewaste": return "E-Waste";
      default: return category;
    }
  };

  // Group subcategories by category
  const groupedSubCategories = subCategories.reduce((acc, subCat) => {
    if (!acc[subCat.category]) {
      acc[subCat.category] = [];
    }
    acc[subCat.category].push(subCat);
    return acc;
  }, {} as Record<string, SubCategory[]>);

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Manage Sub-Category Images</h1>

        <div className="space-y-6">
          {Object.entries(groupedSubCategories).map(([category, subCats]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{getCategoryName(category)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {subCats.map((subCat) => (
                    <div key={subCat.id} className="space-y-2">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {subCategoryImages[subCat.id]?.image_url ? (
                          <img
                            src={subCategoryImages[subCat.id].image_url}
                            alt={subCat.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-muted-foreground p-2">
                            <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                            <p className="text-xs">No image</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-center truncate">{subCat.name}</p>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs px-1"
                          onClick={() => fileInputRefs.current[subCat.id]?.click()}
                          disabled={uploading === subCat.id}
                        >
                          {uploading === subCat.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                        </Button>
                        {subCategoryImages[subCat.id] && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="px-2"
                            onClick={() => handleDeleteImage(subCat.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <Input
                        ref={(el) => (fileInputRefs.current[subCat.id] = el)}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(subCat, file);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={(open) => !open && handleCancelPreview()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Preview - {previewSubCategory?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {previewUrl && (
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelPreview}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmUpload}
                  disabled={uploading === previewSubCategory?.id}
                >
                  {uploading === previewSubCategory?.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Confirm Upload"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ManageSubCategoryImages;
