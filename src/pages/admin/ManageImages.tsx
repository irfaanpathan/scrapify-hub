import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Upload, Trash2, Image as ImageIcon, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ManageImages = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewCategory, setPreviewCategory] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
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

  const handleFileSelect = (category: string, file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPG, PNG, WebP, GIF)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setPreviewCategory(category);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewCategory) return;

    setUploading(previewCategory);

    try {
      // Compress/resize if needed - simple approach
      const fileExt = selectedFile.name.split(".").pop()?.toLowerCase() || 'jpg';
      const fileName = `${previewCategory}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("scrap-images")
        .upload(`categories/${fileName}`, selectedFile, {
          cacheControl: '0', // No cache for immediate update
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("scrap-images")
        .getPublicUrl(`categories/${fileName}`);

      // Add cache-busting parameter
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Check if category image already exists
      const existing = categoryImages[previewCategory];

      if (existing) {
        const { error: updateError } = await supabase
          .from("category_images")
          .update({ image_url: urlWithCacheBust, updated_at: new Date().toISOString() })
          .eq("category", previewCategory as "paper" | "plastic" | "metal" | "ewaste");

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("category_images")
          .insert({ 
            category: previewCategory as "paper" | "plastic" | "metal" | "ewaste", 
            image_url: urlWithCacheBust 
          });

        if (insertError) throw insertError;
      }

      toast.success("Category image updated successfully");
      fetchCategoryImages();
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
    setPreviewCategory(null);
    setSelectedFile(null);
  };

  const handleDeleteImage = async (category: string) => {
    const existing = categoryImages[category];
    if (!existing) return;

    try {
      const { error } = await supabase
        .from("category_images")
        .delete()
        .eq("category", category as "paper" | "plastic" | "metal" | "ewaste");

      if (error) throw error;

      toast.success("Image deleted successfully");
      fetchCategoryImages();
    } catch (error: any) {
      toast.error(error.message);
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
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Manage Category Images</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["paper", "plastic", "metal", "ewaste"].map((category) => (
            <Card key={category} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{getCategoryName(category)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Current Image */}
                <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  {categoryImages[category]?.image_url ? (
                    <img
                      src={categoryImages[category].image_url}
                      alt={getCategoryName(category)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No image</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => fileInputRefs.current[category]?.click()}
                    disabled={uploading === category}
                  >
                    {uploading === category ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1" />
                    )}
                    {categoryImages[category]?.image_url ? "Change" : "Upload"}
                  </Button>
                  
                  {categoryImages[category]?.image_url && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteImage(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Input
                  ref={(el) => (fileInputRefs.current[category] = el)}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(category, file);
                    e.target.value = '';
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={(open) => !open && handleCancelPreview()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Preview - {previewCategory && getCategoryName(previewCategory)}</DialogTitle>
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
                  disabled={uploading === previewCategory}
                >
                  {uploading === previewCategory ? (
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

export default ManageImages;
