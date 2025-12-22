import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import Kits from "./pages/Kits";
import KitDetails from "./pages/KitDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import Orders from "./pages/Orders";
import OrderView from "./pages/OrderView";
import AdminOrders from "./pages/AdminOrders";
import AdminPanel from "./pages/AdminPanel";
import DeliveryPanel from "./pages/DeliveryPanel";
import DBADashboard from "./pages/DBADashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <CartProvider>
        <AuthProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/kits" element={<Kits />} />
              <Route path="/kits/:id" element={<KitDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderView />} />
              <Route path="/delivery" element={<DeliveryPanel />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/dba" element={<DBADashboard />} />
              <Route path="*" element={<NotFound />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </CartProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
