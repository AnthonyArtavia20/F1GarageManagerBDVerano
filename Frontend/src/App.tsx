import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import Modules
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
import UserManagement from "@/modules/UserManagement";

import Test from "@/modules/Test";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/Analytics" element={<Analytics />} />
          <Route path="/Teams" element={<Teams />} />
          <Route path="/Drivers" element={<Drivers />} />
          <Route path="/Sponsors" element={<Sponsors />} />
          <Route path="/Store" element={<Store />} />
          <Route path="/Inventory" element={<Inventory />} />
          <Route path="/CarAssembly" element={<CarAssembly />} />
          <Route path="/UserManagement" element={<UserManagement />} />
          <Route path="/DriverProfile" element={<DriverProfile />} />
          <Route path="/Test" element={<Test />} />
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
