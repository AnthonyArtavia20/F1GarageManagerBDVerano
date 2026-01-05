import { useState } from "react";
import { Car, Zap, Wind, CircleDot, Cog, Settings2, Save, Check, User, AlertCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const cars = [
  { id: "1", name: "CAR-01", teamId: "1", status: "complete" },
  { id: "2", name: "CAR-02", teamId: "1", status: "incomplete" },
];

const categories = [
  { id: "power_unit", name: "Power Unit", icon: Zap, color: "text-red-400", bgColor: "bg-red-500/10" },
  { id: "aero", name: "Aerodynamics Package", icon: Wind, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "tires", name: "Tires", icon: CircleDot, color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  { id: "suspension", name: "Suspension", icon: Cog, color: "text-green-400", bgColor: "bg-green-500/10" },
  { id: "gearbox", name: "Gearbox", icon: Settings2, color: "text-purple-400", bgColor: "bg-purple-500/10" },
];

const availableParts: Record<string, Array<{ id: string; name: string; p: number; a: number; m: number }>> = {
  power_unit: [
    { id: "pw_u1", name: "Power Unit 1", p: 9, a: 3, m: 4 },
    { id: "pw_u2", name: "Power Unit 2", p: 7, a: 2, m: 3 },
  ],
  aero: [ ],
  tires: [ ],
  suspension: [ ],
  gearbox: [ ],
};

const CarAssembly = () => {
  const [selectedTeam, setSelectedTeam] = useState("1");
  const [selectedCar, setSelectedCar] = useState("1");
  const [selectedDriver, setSelectedDriver] = useState("1");
  const [installedParts, setInstalledParts] = useState<Record<string, string>>({
    power_unit: null,
    aero: null,
    tires: null,
    suspension: null,
    gearbox: null,
  });

  const calculateTotals = () => {
    let P = 0, A = 0, M = 0;
    Object.entries(installedParts).forEach(([category, partId]) => {
      const part = availableParts[category]?.find(p => p.id === partId);
      if (part) {
        P += part.p;
        A += part.a;
        M += part.m;
      }
    });
    return { P, A, M };
  };

  const totals = calculateTotals();

  return (
    <MainLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Car Assembly
            </h1>
            <p className="text-muted-foreground">
              Car configuration 
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedCar} onValueChange={setSelectedCar}>
              <SelectTrigger className="w-[150px] bg-card border-border">
                <SelectValue placeholder="Car" />
              </SelectTrigger>
              <SelectContent>
                {cars.filter(c => c.teamId === selectedTeam).map((car) => (
                  <SelectItem key={car.id} value={car.id}>{car.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Parts Selection */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              Available Parts
            </h2>
            {categories.map((category, index) => {
              const CategoryIcon = category.icon;
              const selectedPartId = installedParts[category.id];
              const selectedPart = availableParts[category.id]?.find(p => p.id === selectedPartId);
              
              return (
                <div
                  key={category.id}
                  className="glass-card rounded-xl p-5 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", category.bgColor)}>
                      <CategoryIcon className={cn("w-6 h-6", category.color)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-foreground">
                        {category.name}
                      </h3>
                      <p className="text-sm text-foreground">
                        {selectedPart ? selectedPart.name : "None selected"}
                      </p>
                    </div>
                    {selectedPart && (
                      <div className="flex gap-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">p</p>
                          <p className="font-display font-bold text-red-400">{selectedPart.p}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">a</p>
                          <p className="font-display font-bold text-blue-400">{selectedPart.a}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">m</p>
                          <p className="font-display font-bold text-green-400">{selectedPart.m}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Select
                    value={selectedPartId}
                    onValueChange={(value) => setInstalledParts(prev => ({ ...prev, [category.id]: value }))}
                  >
                    <SelectTrigger className="bg-accent/50 border-border">
                      <SelectValue placeholder="Select Part" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableParts[category.id]?.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{part.name}</span>
                            <span className="text-xs text-muted-foreground">
                              p:{part.p} a:{part.a} m:{part.m}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          {/* Summary Panel */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              Configuration Stats 
            </h2>
            
            {/* Car Summary */}
            <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground">
                    {cars.find(c => c.id === selectedCar)?.name}
                  </h3>
                  <Badge variant="default" className="bg-f1-red">
                    Not Saved
                  </Badge>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Power (P)</span>
                    <span className="font-display font-bold text-2xl text-red-400">{totals.P}</span>
                  </div>
                  <div className="performance-bar">
                    <div
                      className="performance-bar-fill bg-red-500"
                      style={{ width: `${(totals.P / 45) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Aerodynamics Profile (A)</span>
                    <span className="font-display font-bold text-2xl text-blue-400">{totals.A}</span>
                  </div>
                  <div className="performance-bar">
                    <div
                      className="performance-bar-fill bg-blue-500"
                      style={{ width: `${(totals.A / 45) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Maneuverability (M)</span>
                    <span className="font-display font-bold text-2xl text-green-400">{totals.M}</span>
                  </div>
                  <div className="performance-bar">
                    <div
                      className="performance-bar-fill bg-green-500"
                      style={{ width: `${(totals.M / 45) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Save Config */}
              <div className="space-y-2">
                <Button variant="racing" className="w-full">
                  <Check className="w-4 h-4" />
                  SAVE CAR CONFIG
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CarAssembly;
