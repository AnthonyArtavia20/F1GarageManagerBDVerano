import { useState } from "react";
import { Search, Package, Zap, Wind, CircleDot, Cog, Settings2, Calendar } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Parts in inventory

const inventoryData = [
  {
    id: 1,
    name: "[Part's Name]",
    category: "power_unit",
    quantity: 3,
    acquiredDate: "2990-76-32",
    p: 9, a: 3, m: 4,
    installed: 1,
  },
];

const getCategoryIcon = (category: string) => {
  const icons: Record<string, typeof Zap> = {
    power_unit: Zap,
    aero: Wind,
    tires: CircleDot,
    suspension: Cog,
    gearbox: Settings2,
  };
  return icons[category] || Package;
};

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    power_unit: "Power Unit",
    aero: "Aerodynamics",
    tires: "Tires",
    suspension: "Suspension",
    gearbox: "Gearbox",
  };
  return names[category] || category;
};

const Inventory = () => {
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("1");

  const filteredInventory = inventoryData.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalParts = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
  const installedParts = filteredInventory.reduce((sum, item) => sum + item.installed, 0);

  return (
    <MainLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Team's Inventory
            </h1>
            <p className="text-muted-foreground">
              Parts available for team use 
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search in Inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Inventory Table */}
        <div className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Part</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">p / a / m</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Quantity</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Installed</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Acquisition</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, index) => {
                  const CategoryIcon = getCategoryIcon(item.category);
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-border hover:bg-accent/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CategoryIcon className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{getCategoryName(item.category)}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-red-400 font-display font-bold">{item.p}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-blue-400 font-display font-bold">{item.a}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-green-400 font-display font-bold">{item.m}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-display font-bold text-foreground">{item.quantity}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "font-display font-bold",
                          item.installed > 0 ? "text-success" : "text-muted-foreground"
                        )}>
                          {item.installed}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Calendar className="w-4 h-4" />
                          {item.acquiredDate}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Inventory;
