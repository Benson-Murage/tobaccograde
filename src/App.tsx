import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
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
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import SupervisorPage from "./pages/SupervisorPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ImageReviewPage from "./pages/ImageReviewPage";
import GraderPerformancePage from "./pages/GraderPerformancePage";
import DeviceCalibrationPage from "./pages/DeviceCalibrationPage";
import WarehouseManagementPage from "./pages/WarehouseManagementPage";
import SeasonManagementPage from "./pages/SeasonManagementPage";
import ExportCertificationPage from "./pages/ExportCertificationPage";
import TraceabilityPage from "./pages/TraceabilityPage";
import DiseaseDetectionPage from "./pages/DiseaseDetectionPage";
import BlockchainLedgerPage from "./pages/BlockchainLedgerPage";
import FarmVerificationPage from "./pages/FarmVerificationPage";
import HarvestPredictionPage from "./pages/HarvestPredictionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected routes - any authenticated user */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/scan" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />

            {/* Grader routes */}
            <Route path="/grading" element={
              <ProtectedRoute requiredRoles={['grader', 'company_admin', 'super_admin']}>
                <GradingPage />
              </ProtectedRoute>
            } />
            <Route path="/grading/scan" element={
              <ProtectedRoute requiredRoles={['grader', 'company_admin', 'super_admin']}>
                <ScanPage />
              </ProtectedRoute>
            } />
            <Route path="/bales" element={
              <ProtectedRoute requiredRoles={['grader', 'company_admin', 'quality_supervisor', 'super_admin']}>
                <BalesPage />
              </ProtectedRoute>
            } />
            <Route path="/bales/new" element={
              <ProtectedRoute requiredRoles={['grader', 'company_admin', 'super_admin']}>
                <BaleRegistrationPage />
              </ProtectedRoute>
            } />
            <Route path="/farmers" element={
              <ProtectedRoute requiredRoles={['grader', 'company_admin', 'quality_supervisor', 'super_admin']}>
                <FarmersPage />
              </ProtectedRoute>
            } />

            {/* Traceability - all authenticated */}
            <Route path="/traceability" element={
              <ProtectedRoute requiredRoles={['grader', 'company_admin', 'quality_supervisor', 'super_admin', 'auditor']}>
                <TraceabilityPage />
              </ProtectedRoute>
            } />

            {/* Supervisor routes */}
            <Route path="/supervisor" element={
              <ProtectedRoute requiredRoles={['quality_supervisor', 'company_admin', 'super_admin']}>
                <SupervisorPage />
              </ProtectedRoute>
            } />
            <Route path="/disputes" element={
              <ProtectedRoute requiredRoles={['quality_supervisor', 'company_admin', 'super_admin']}>
                <DisputesPage />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute requiredRoles={['quality_supervisor', 'company_admin', 'super_admin', 'auditor']}>
                <AnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="/image-review" element={
              <ProtectedRoute requiredRoles={['quality_supervisor', 'company_admin', 'super_admin']}>
                <ImageReviewPage />
              </ProtectedRoute>
            } />
            <Route path="/grader-performance" element={
              <ProtectedRoute requiredRoles={['quality_supervisor', 'company_admin', 'super_admin']}>
                <GraderPerformancePage />
              </ProtectedRoute>
            } />
            <Route path="/device-calibration" element={
              <ProtectedRoute requiredRoles={['company_admin', 'super_admin']}>
                <DeviceCalibrationPage />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/warehouses" element={
              <ProtectedRoute requiredRoles={['company_admin', 'super_admin']}>
                <WarehouseManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/seasons" element={
              <ProtectedRoute requiredRoles={['company_admin', 'super_admin']}>
                <SeasonManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/export-certification" element={
              <ProtectedRoute requiredRoles={['quality_supervisor', 'company_admin', 'super_admin']}>
                <ExportCertificationPage />
              </ProtectedRoute>
            } />
            <Route path="/pricing" element={
              <ProtectedRoute requiredRoles={['company_admin', 'super_admin']}>
                <PricingPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requiredRoles={['company_admin', 'super_admin']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute requiredRoles={['company_admin', 'quality_supervisor', 'auditor', 'super_admin']}>
                <ReportsPage />
              </ProtectedRoute>
            } />

            {/* Auditor routes */}
            <Route path="/audit" element={
              <ProtectedRoute requiredRoles={['auditor', 'company_admin', 'super_admin']}>
                <AuditPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
