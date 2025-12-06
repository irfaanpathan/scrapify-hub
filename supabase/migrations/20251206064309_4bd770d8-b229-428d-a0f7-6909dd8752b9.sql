-- Add final_price column for admin price override
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS final_price numeric;

-- Create order_items table for multi-item orders
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  estimated_weight numeric,
  actual_weight numeric,
  price_per_kg numeric NOT NULL,
  final_price numeric,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Customers can insert items for their orders
CREATE POLICY "Customers can insert order items"
ON public.order_items
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
));

-- Users can view items of their orders
CREATE POLICY "Users can view their order items"
ON public.order_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_items.order_id 
  AND (orders.customer_id = auth.uid() OR orders.partner_id = auth.uid())
));

-- Partners can update order items (for actual weight/price)
CREATE POLICY "Partners can update order items"
ON public.order_items
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.partner_id = auth.uid()
));