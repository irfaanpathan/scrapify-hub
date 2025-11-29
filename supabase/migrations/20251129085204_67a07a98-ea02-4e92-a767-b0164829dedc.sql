-- Create sub_categories table
CREATE TABLE public.sub_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category scrap_category NOT NULL,
  name TEXT NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, name)
);

-- Enable RLS on sub_categories
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view sub-categories
CREATE POLICY "Anyone can view sub_categories"
ON public.sub_categories
FOR SELECT
USING (true);

-- Create category_images table for main category images
CREATE TABLE public.category_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category scrap_category NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on category_images
ALTER TABLE public.category_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view category images
CREATE POLICY "Anyone can view category_images"
ON public.category_images
FOR SELECT
USING (true);

-- Create home_banners table
CREATE TABLE public.home_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on home_banners
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can view active home banners
CREATE POLICY "Anyone can view home_banners"
ON public.home_banners
FOR SELECT
USING (is_active = true);

-- Add sub_category column to orders table
ALTER TABLE public.orders
ADD COLUMN sub_category TEXT;

-- Add triggers for updated_at
CREATE TRIGGER update_sub_categories_updated_at
BEFORE UPDATE ON public.sub_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_category_images_updated_at
BEFORE UPDATE ON public.category_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_home_banners_updated_at
BEFORE UPDATE ON public.home_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial sub-categories for Paper
INSERT INTO public.sub_categories (category, name, price_per_kg) VALUES
('paper', 'Newspaper', 12),
('paper', 'Cardboard', 8),
('paper', 'Books & Magazines', 10),
('paper', 'Office Paper / Mixed Paper', 9),
('paper', 'Shredded Paper', 6),
('paper', 'Corrugated Boxes', 7),
('paper', 'Tetra Packs', 5);

-- Insert initial sub-categories for Plastic
INSERT INTO public.sub_categories (category, name, price_per_kg) VALUES
('plastic', 'Soft Plastic (Bags, Wrappers)', 5),
('plastic', 'Hard Plastic (Bottles, Containers)', 12),
('plastic', 'PVC Plastic', 8),
('plastic', 'Plastic Household Items', 7),
('plastic', 'Plastic Toys', 6),
('plastic', 'PET Bottles', 15),
('plastic', 'Mixed Plastic', 4);

-- Insert initial sub-categories for E-Waste
INSERT INTO public.sub_categories (category, name, price_per_kg) VALUES
('ewaste', 'Mobile Phones & Accessories', 50),
('ewaste', 'Laptops & Computers', 40),
('ewaste', 'Chargers & Cables', 20),
('ewaste', 'Home Appliances (Small)', 15),
('ewaste', 'Electronic Components/Boards', 60),
('ewaste', 'Batteries', 25),
('ewaste', 'LED Bulbs & Tubes', 10);

-- Insert initial sub-categories for Metal
INSERT INTO public.sub_categories (category, name, price_per_kg) VALUES
('metal', 'Iron', 25),
('metal', 'Steel', 28),
('metal', 'Aluminum', 80),
('metal', 'Copper', 450),
('metal', 'Brass', 300),
('metal', 'Stainless Steel', 35),
('metal', 'Mixed Metal', 20);