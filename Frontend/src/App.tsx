// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth
import { AuthProvider } from "@/auth/authContext";
import { ProtectedRoute } from "@/auth/ProtectedRoute";

// Modules
import NotFound from "@/modules/NotFound";
import Login from "@/modules/Login";
import DriverProfile from "@/modules/DriverProfile";
import Analytics from "@/modules/Analytics";
import Teams from "@/modules/Teams";
import Drivers from "@/modules/Drivers";
import Sponsors from "@/modules/Sponsors";
import Store from "@/modules/Store";
import Inventory from "@/modules/Inventory";
import CarAssembly from "@/modules/CarAssembly";
import Simulation from "@/modules/Simulation";
import Circuits from "@/modules/Circuits";
import UserManagement from "@/modules/UserManagement";
import Test from "@/modules/Test";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<Login />} />

            {/* DRIVER ONLY */}
            <Route
              path="/DriverProfile"
              element={
                <ProtectedRoute allowedRoles={["driver"]}>
                  <DriverProfile />
                </ProtectedRoute>
              }
            />

            {/* ADMIN + ENGINEER */}
            <Route
              path="/Analytics"
              element={
                <ProtectedRoute allowedRoles={["admin", "engineer"]}>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            <Route
              path="/Teams"
              element={
                <ProtectedRoute allowedRoles={["admin", "engineer"]}>
                  <Teams />
                </ProtectedRoute>
              }
            />

            <Route
              path="/Drivers"
              element={
                <ProtectedRoute allowedRoles={["admin", "engineer"]}>
                  <Drivers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/Sponsors"
              element={
                <ProtectedRoute allowedRoles={["admin", "engineer"]}>
                  <Sponsors />
                </ProtectedRoute>
              }
            />

            <Route
              path="/Store"
              element={
                <ProtectedRoute allowedRoles={["admin", "engineer"]}>
                  <Store />
                </ProtectedRoute>
              }
            />

            <Route
              path="/Inventory"
              element={
                <ProtectedRoute allowedRoles={["admin", "engineer"]}>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/CarAssembly"
              element={
                <ProtectedRoute allowedRoles={["admin", "engineer"]}>
                  <CarAssembly />
                </ProtectedRoute>
              }
            />

            <Route
              path="/Simulation"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Simulation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/Circuits"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Circuits />
                </ProtectedRoute>
              }
            />

            {/* ADMIN ONLY */}
            <Route
              path="/UserManagement"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            {/* TEST */}
            <Route
              path="/Test"
              element={
                <ProtectedRoute allowedRoles={["admin", "engineer"]}>
                  <Test />
                </ProtectedRoute>
              }
            />

            <Route path="/*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
