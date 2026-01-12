import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GradingPage from "./pages/GradingPage";
import FarmersPage from "./pages/FarmersPage";
import BalesPage from "./pages/BalesPage";
import BaleRegistrationPage from "./pages/BaleRegistrationPage";
import ScanPage from "./pages/ScanPage";
import DisputesPage from "./pages/DisputesPage";
import PricingPage from "./pages/PricingPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import AuditPage from "./pages/AuditPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/grading" element={<GradingPage />} />
          <Route path="/grading/scan" element={<ScanPage />} />
          <Route path="/farmers" element={<FarmersPage />} />
          <Route path="/bales" element={<BalesPage />} />
          <Route path="/bales/new" element={<BaleRegistrationPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/disputes" element={<DisputesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
