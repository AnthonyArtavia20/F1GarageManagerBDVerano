//FrontendCarAssambly - Encargado: ANTHONY. Editado el 16/01/26 - Comienzo integración con backend, conexiones con los endpoints.

import { useState, useEffect } from "react";
import { Car, Zap, Wind, CircleDot, Cog, Settings2, Check, AlertCircle, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeamSelector } from "@/components/TeamSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090';

// Interfaces
interface Part {
  Part_id: number;
  Category: string;
  Price: number;
  Stock: number;
  p: number;
  a: number;
  m: number;
}

interface CarStats {
  Car_id: number;
  Power: number;
  Aerodynamics: number;
  Maneuverability: number;
  TotalPerformance: number;
  Parts_Installed: number;
}

interface InstalledPart {
  Part_Category: string;
  Part_id: number;
}

const categories = [
  { id: "Power_Unit", name: "Power Unit", icon: Zap, color: "text-red-400", bgColor: "bg-red-500/10" },
  { id: "Aerodynamics_pkg", name: "Aerodynamics Package", icon: Wind, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "Wheels", name: "Wheels", icon: CircleDot, color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  { id: "Suspension", name: "Suspension", icon: Cog, color: "text-green-400", bgColor: "bg-green-500/10" },
  { id: "Gearbox", name: "Gearbox", icon: Settings2, color: "text-purple-400", bgColor: "bg-purple-500/10" },
];

const CarAssembly = () => {
  // Estados
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [selectedCar, setSelectedCar] = useState("1"); // Temporal, después cargar desde API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [installedParts, setInstalledParts] = useState<Record<string, number | null>>({});
  const [carStats, setCarStats] = useState<CarStats | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar partes disponibles del inventario del equipo
  useEffect(() => {
    if (selectedTeam) {
      fetchAvailableParts();
      fetchCarConfiguration();
      fetchCarStats();
    }
  }, [selectedTeam, selectedCar]);

  // Obtener partes disponibles del inventario
  const fetchAvailableParts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/sp/team-inventory/${selectedTeam}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableParts(data.data);
      }
    } catch (err: any) {
      console.error('Error al cargar partes:', err);
      setError('Error al cargar partes disponibles');
    } finally {
      setLoading(false);
    }
  };

  // Obtener configuración actual del carro
  const fetchCarConfiguration = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sp/car-configuration/${selectedCar}`);
      const data = await response.json();
      
      if (data.success) {
        const config: Record<string, number | null> = {};
        data.parts.forEach((part: InstalledPart) => {
          config[part.Part_Category] = part.Part_id;
        });
        setInstalledParts(config);
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err);
    }
  };

  // Obtener estadísticas del carro
  const fetchCarStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sp/car-stats/${selectedCar}`);
      const data = await response.json();
      
      if (data.success) {
        setCarStats(data.stats);
      }
    } catch (err) {
      console.error('Error al cargar stats:', err);
    }
  };

  // Instalar o reemplazar parte
  const handleInstallPart = async (category: string, partId: number) => {
    const oldPartId = installedParts[category];
    const isReplacement = oldPartId !== null && oldPartId !== undefined;

    try {
      setLoading(true);
      setError(null);

      const endpoint = isReplacement ? '/api/sp/replace-part' : '/api/sp/install-part';
      const body = isReplacement
        ? { carId: parseInt(selectedCar), oldPartId, newPartId: partId, teamId: parseInt(selectedTeam) }
        : { carId: parseInt(selectedCar), partId, teamId: parseInt(selectedTeam) };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar estado local
        setInstalledParts(prev => ({ ...prev, [category]: partId }));
        setHasChanges(true);
        
        // Recargar stats
        await fetchCarStats();
        
        alert(data.message);
      } else {
        setError(data.error || 'Error al instalar parte');
      }
    } catch (err: any) {
      setError(err.message);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Validar parte antes de instalar
  const validatePart = async (category: string, partId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/sp/validate-part/${selectedCar}/${partId}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.validation.Status === 'INVALID') {
          alert(data.validation.Message);
          return false;
        }
        return true;
      }
    } catch (err) {
      console.error('Error validando parte:', err);
      return false;
    }
  };

  // Manejar cambio de parte
  const handlePartChange = async (category: string, partId: string) => {
    const numericPartId = parseInt(partId);
    
    // Validar antes de instalar
    const isValid = await validatePart(category, numericPartId);
    if (!isValid) return;

    // Instalar o reemplazar
    await handleInstallPart(category, numericPartId);
  };

  // Guardar configuración final
  const handleSaveConfiguration = async () => {
    // Aquí podrías agregar lógica adicional como marcar el carro como finalizado
    alert('Configuración guardada exitosamente');
    setHasChanges(false);
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in relative z-20">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Car Assembly
            </h1>
            <p className="text-muted-foreground">
              Configure your racing car with performance parts
            </p>
          </div>
          <div className="flex gap-3 relative z-20">
            <TeamSelector
              value={selectedTeam}
              onChange={(teamId, teamName) => {
                setSelectedTeam(teamId);
                setSelectedTeamName(teamName);
              }}
              placeholder="Select team..."
              required
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {!selectedTeam ? (
          <div className="glass-card rounded-xl p-12 text-center relative z-10">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              Select a Team
            </h3>
            <p className="text-muted-foreground">
              Choose a team to start configuring their car
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Parts Selection */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
                Available Parts
              </h2>

              {loading && (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
                  <p className="text-muted-foreground mt-2">Loading parts...</p>
                </div>
              )}

              {!loading && categories.map((category, index) => {
                const CategoryIcon = category.icon;
                const selectedPartId = installedParts[category.id];
                const partsInCategory = availableParts.filter(p => p.Category === category.id);
                const selectedPart = partsInCategory.find(p => p.Part_id === selectedPartId);
                
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
                        <p className="text-sm text-muted-foreground">
                          {selectedPart ? `Part #${selectedPart.Part_id}` : "None installed"}
                        </p>
                      </div>
                      {selectedPart && (
                        <div className="flex gap-3">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">P</p>
                            <p className="font-display font-bold text-red-400">{selectedPart.p}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">A</p>
                            <p className="font-display font-bold text-blue-400">{selectedPart.a}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">M</p>
                            <p className="font-display font-bold text-green-400">{selectedPart.m}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Select
                      value={selectedPartId?.toString() || ""}
                      onValueChange={(value) => handlePartChange(category.id, value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-card/50 border-border">
                        <SelectValue placeholder={partsInCategory.length > 0 ? "Select part..." : "No parts available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {partsInCategory.map((part) => (
                          <SelectItem key={part.Part_id} value={part.Part_id.toString()}>
                            <div className="flex items-center justify-between w-full gap-4">
                              <span>Part #{part.Part_id}</span>
                              <span className="text-xs text-muted-foreground">
                                P:{part.p} A:{part.a} M:{part.m} | ${part.Price.toLocaleString()}
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
                Car Performance
              </h2>
              
              <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-bold text-xl text-foreground">
                      CAR #{selectedCar}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{selectedTeamName}</p>
                    <Badge variant={hasChanges ? "destructive" : "default"} className={hasChanges ? "bg-yellow-500" : "bg-green-500"}>
                      {hasChanges ? "Unsaved Changes" : "Saved"}
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                {carStats && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Power (P)</span>
                        <span className="font-display font-bold text-2xl text-red-400">{carStats.Power}</span>
                      </div>
                      <div className="performance-bar">
                        <div
                          className="performance-bar-fill bg-red-500"
                          style={{ width: `${(carStats.Power / 45) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Aerodynamics (A)</span>
                        <span className="font-display font-bold text-2xl text-blue-400">{carStats.Aerodynamics}</span>
                      </div>
                      <div className="performance-bar">
                        <div
                          className="performance-bar-fill bg-blue-500"
                          style={{ width: `${(carStats.Aerodynamics / 45) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Maneuverability (M)</span>
                        <span className="font-display font-bold text-2xl text-green-400">{carStats.Maneuverability}</span>
                      </div>
                      <div className="performance-bar">
                        <div
                          className="performance-bar-fill bg-green-500"
                          style={{ width: `${(carStats.Maneuverability / 45) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Total Performance</span>
                        <span className="font-display font-bold text-3xl text-primary">{carStats.TotalPerformance}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {carStats.Parts_Installed}/5 parts installed
                      </p>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <Button 
                  variant="racing" 
                  className="w-full"
                  onClick={handleSaveConfiguration}
                  disabled={!hasChanges || loading}
                >
                  <Check className="w-4 h-4" />
                  SAVE CONFIGURATION
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CarAssembly;