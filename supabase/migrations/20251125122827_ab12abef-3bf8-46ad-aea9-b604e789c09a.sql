-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('customer', 'partner', 'admin');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'assigned', 'picked', 'weighed', 'paid', 'completed');

-- Create enum for scrap categories
CREATE TYPE public.scrap_category AS ENUM ('paper', 'plastic', 'metal', 'ewaste');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  email TEXT,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create scrap_prices table
CREATE TABLE public.scrap_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category scrap_category NOT NULL UNIQUE,
  price_per_kg DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scrap_prices ENABLE ROW LEVEL SECURITY;

-- Scrap prices policies (public read, admin write)
CREATE POLICY "Anyone can view scrap prices" ON public.scrap_prices
  FOR SELECT USING (true);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category scrap_category NOT NULL,
  estimated_weight DECIMAL(10,2),
  actual_weight DECIMAL(10,2),
  pickup_time TIMESTAMPTZ NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10,8),
  pickup_longitude DECIMAL(11,8),
  status order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Customers can view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() = partner_id
  );

CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Partners can update assigned orders" ON public.orders
  FOR UPDATE USING (auth.uid() = partner_id);

-- Create order_images table
CREATE TABLE public.order_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.order_images ENABLE ROW LEVEL SECURITY;

-- Order images policies
CREATE POLICY "Users can view images of their orders" ON public.order_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_images.order_id
      AND (orders.customer_id = auth.uid() OR orders.partner_id = auth.uid())
    )
  );

CREATE POLICY "Customers can insert images for their orders" ON public.order_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_images.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Create storage bucket for scrap images
INSERT INTO storage.buckets (id, name, public)
VALUES ('scrap-images', 'scrap-images', true);

-- Storage policies for scrap images
CREATE POLICY "Anyone can view scrap images" ON storage.objects
  FOR SELECT USING (bucket_id = 'scrap-images');

CREATE POLICY "Authenticated users can upload scrap images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'scrap-images' AND
    auth.role() = 'authenticated'
  );

-- Insert default scrap prices
INSERT INTO public.scrap_prices (category, price_per_kg) VALUES
  ('paper', 12.50),
  ('plastic', 18.00),
  ('metal', 45.00),
  ('ewaste', 35.00);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scrap_prices_updated_at
  BEFORE UPDATE ON public.scrap_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();