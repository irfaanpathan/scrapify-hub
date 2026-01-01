-- Add address field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;

-- Create subcategory_images table
CREATE TABLE public.subcategory_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_category_id uuid NOT NULL REFERENCES public.sub_categories(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(sub_category_id)
);

-- Enable RLS
ALTER TABLE public.subcategory_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view subcategory images
CREATE POLICY "Anyone can view subcategory_images" 
ON public.subcategory_images 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_subcategory_images_updated_at
BEFORE UPDATE ON public.subcategory_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();