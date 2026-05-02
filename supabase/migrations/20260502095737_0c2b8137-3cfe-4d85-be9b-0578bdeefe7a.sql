CREATE POLICY "Admins can view all order_images"
ON public.order_images
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));