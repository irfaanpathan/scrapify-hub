import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Upload, Trash2 } from "lucide-react";

const ManageBanner = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [activeBanner, setActiveBanner] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchActiveBanner();
      }
    });
  }, [navigate]);

  const fetchActiveBanner = async () => {
    const { data, error } = await supabase
      .from("home_banners")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching banner:", error);
      return;
    }

    setActiveBanner(data);
  };

  const handleBannerUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);

    try {
      // Upload image to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("scrap-images")
        .upload(`banners/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("scrap-images")
        .getPublicUrl(`banners/${fileName}`);

      // Deactivate current banner if exists
      if (activeBanner) {
        await supabase
          .from("home_banners")
          .update({ is_active: false })
          .eq("id", activeBanner.id);
      }

      // Insert new active banner
      const { error: insertError } = await supabase
        .from("home_banners")
        .insert({ image_url: publicUrl, is_active: true });

      if (insertError) throw insertError;

      toast.success("Home banner updated successfully");
      fetchActiveBanner();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    if (!activeBanner) return;

    try {
      const { error } = await supabase
        .from("home_banners")
        .update({ is_active: false })
        .eq("id", activeBanner.id);

      if (error) throw error;

      toast.success("Banner removed successfully");
      setActiveBanner(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="admin" />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Manage Home Banner</h1>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Current Home Banner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeBanner?.image_url ? (
              <div className="space-y-4">
                <img
                  src={activeBanner.image_url}
                  alt="Home Banner"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  onClick={handleRemoveBanner}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Current Banner
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No active banner. Upload one below.
              </p>
            )}

            <div className="border-t pt-4">
              <Label htmlFor="banner-upload">Upload New Banner</Label>
              <Input
                id="banner-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBannerUpload(file);
                }}
                disabled={uploading}
              />
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Upload className="h-4 w-4 animate-pulse" />
                  Uploading...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageBanner;