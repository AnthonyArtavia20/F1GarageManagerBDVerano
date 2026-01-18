import { useState, useEffect } from "react";
import { 
  Search, Package, Zap, Wind, CircleDot, Cog, Settings2, Calendar, Users,
  Loader2 
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TeamSelector } from "@/components/TeamSelector";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090';

// Definir tipos para las partes del inventario
interface InventoryPart {
  id: number;
  name: string;
  category: string;
  quantity: number;
  acquiredDate: string;
  p: number;
  a: number;
  m: number;
  installed: number;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, typeof Zap> = {
    power_unit: Zap,
    Power_Unit: Zap,
    aero: Wind,
    Aerodynamics_pkg: Wind,
    tires: CircleDot,
    Wheels: CircleDot,
    suspension: Cog,
    Suspension: Cog,
    gearbox: Settings2,
    Gearbox: Settings2,
  };
  return icons[category] || Package;
};

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    power_unit: "Power Unit",
    Power_Unit: "Power Unit",
    aero: "Aerodynamics",
    Aerodynamics_pkg: "Aerodynamics",
    tires: "Tires",
    Wheels: "Wheels",
    suspension: "Suspension",
    Suspension: "Suspension",
    gearbox: "Gearbox",
    Gearbox: "Gearbox",
  };
  return names[category] || category;
};

const Inventory = () => {
  const [search, setSearch] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedTeamName, setSelectedTeamName] = useState<string>("");
  const [inventory, setInventory] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar inventario cuando se selecciona un equipo
  useEffect(() => {
    if (selectedTeamId && selectedTeamId.trim() !== '') {
      fetchTeamInventory(selectedTeamId);
    } else {
      // Limpiar inventario cuando no hay equipo seleccionado
      setInventory([]);
      setError(null);
    }
  }, [selectedTeamId]);

  // Función para obtener el inventario del equipo desde la API
  const fetchTeamInventory = async (teamId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/inventory/${teamId}`);
      
      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('El servidor no devolvió JSON');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setInventory(data.data);
      } else {
        setError(data.message || 'Error al cargar el inventario');
        setInventory([]);
      }
    } catch (err: any) {
      console.error('Error al cargar inventario:', err);
      setError('Error al cargar el inventario: ' + err.message);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar inventario por búsqueda
  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    getCategoryName(item.category).toLowerCase().includes(search.toLowerCase())
  );

  // Estadísticas del inventario
  const totalParts = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
  const installedParts = filteredInventory.reduce((sum, item) => sum + item.installed, 0);
  const availableParts = totalParts - installedParts;

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

        {/* Team Selector */}
        <div className="glass-card rounded-xl p-6 mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="font-display font-semibold text-foreground">
              Select Team Inventory
            </h3>
          </div>
          
          <div className="space-y-4">
            <TeamSelector
              value={selectedTeamId}
              onChange={(teamId, teamName) => {
                setSelectedTeamId(teamId);
                setSelectedTeamName(teamName);
              }}
              placeholder="Search and select team to view inventory..."
            />
            
            {selectedTeamName && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Viewing Inventory for</p>
                    <p className="font-display font-bold text-primary">{selectedTeamName}</p>
                  </div>
                </div>
              </div>
            )}
            
            {!selectedTeamId && (
              <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-warning" />
                  <p className="text-sm text-warning">
                    Select a team to view their inventory
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumen del inventario */}
        {selectedTeamId && inventory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Parts</p>
                  <p className="font-display font-bold text-xl text-foreground">{totalParts}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Installed Parts</p>
                  <p className="font-display font-bold text-xl text-success">{installedParts}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-success" />
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Parts</p>
                  <p className="font-display font-bold text-xl text-blue-400">{availableParts}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CircleDot className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Búsqueda y filtrado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search parts by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
              disabled={!selectedTeamId || loading}
            />
          </div>
          
          {selectedTeamId && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredInventory.length} of {inventory.length} parts
            </div>
          )}
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="glass-card rounded-xl p-8 text-center mb-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto">
              <Loader2 className="w-8 h-8 text-primary mx-auto" />
            </div>
            <p className="text-muted-foreground mt-4">Loading inventory...</p>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="glass-card rounded-xl p-6 mb-8 bg-red-500/10 border-red-500/20">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => selectedTeamId && fetchTeamInventory(selectedTeamId)}
              className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Tabla de inventario */}
        <div className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <div className="overflow-x-auto">
            {!selectedTeamId ? (
              <div className="p-8 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-display font-semibold text-foreground mb-2">No Team Selected</h4>
                <p className="text-muted-foreground">
                  Please select a team to view their inventory
                </p>
              </div>
            ) : !loading && inventory.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-display font-semibold text-foreground mb-2">Empty Inventory</h4>
                <p className="text-muted-foreground">
                  {selectedTeamName} doesn't have any parts in their inventory yet
                </p>
              </div>
            ) : !loading && filteredInventory.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-display font-semibold text-foreground mb-2">No Parts Found</h4>
                <p className="text-muted-foreground">
                  No parts match "{search}" in {selectedTeamName}'s inventory
                </p>
                <button 
                  onClick={() => setSearch("")}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
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
                            <div>
                              <span className="font-medium text-foreground block">{item.name}</span>
                              <span className="text-xs text-muted-foreground">ID: {item.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className="capitalize">
                            {getCategoryName(item.category)}
                          </Badge>
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
                          {item.quantity === 0 && (
                            <span className="block text-xs text-destructive mt-1">Out of stock</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={cn(
                              "font-display font-bold text-lg",
                              item.installed > 0 ? "text-success" : "text-muted-foreground"
                            )}>
                              {item.installed}
                            </span>
                            {item.installed > 0 && item.quantity > 0 && (
                              <span className="text-xs text-muted-foreground mt-1">
                                {((item.installed / item.quantity) * 100).toFixed(0)}% used
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Calendar className="w-4 h-4" />
                            {item.acquiredDate || "N/A"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Inventory;
