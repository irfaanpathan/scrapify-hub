import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PlaceOrder from "./pages/PlaceOrder";
import TrackOrder from "./pages/TrackOrder";
import OrderHistory from "./pages/OrderHistory";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerOrders from "./pages/partner/PartnerOrders";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManagePrices from "./pages/admin/ManagePrices";
import ManageOrders from "./pages/admin/ManageOrders";
import ManageSubCategories from "./pages/admin/ManageSubCategories";
import ManageImages from "./pages/admin/ManageImages";
import ManageBanner from "./pages/admin/ManageBanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/order" element={<PlaceOrder />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/history" element={<OrderHistory />} />
            <Route path="/partner" element={<PartnerDashboard />} />
            <Route path="/partner/orders" element={<PartnerOrders />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/prices" element={<ManagePrices />} />
            <Route path="/admin/orders" element={<ManageOrders />} />
            <Route path="/admin/sub-categories" element={<ManageSubCategories />} />
            <Route path="/admin/images" element={<ManageImages />} />
            <Route path="/admin/banner" element={<ManageBanner />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
