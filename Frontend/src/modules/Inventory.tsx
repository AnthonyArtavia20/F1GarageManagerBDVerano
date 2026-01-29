import { useState, useEffect } from "react";
import {
  Search,
  Package,
  Zap,
  Wind,
  CircleDot,
  Cog,
  Settings2,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TeamSelector } from "@/components/TeamSelector";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface InventoryPart {
  Part_id: number;      //Cambiado de 'id' a 'Part_id'
  Name: string;         //Cambiado de 'name' a 'Name'
  Category: string;     //Cambiado de 'category' a 'Category'
  Price?: number;       //Opcional
  Stock?: number;       //Stock en lugar de quantity
  Quantity?: number;    //Mantener compatibilidad
  p: number;
  a: number;
  m: number;
  acquiredDate?: string; //Opcional
}

interface SessionUser {
  id: number;
  username: string;
  role: string;
  teamId?: number | null;
  teamName?: string | null;
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
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [inventory, setInventory] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null); //PAra debug

  const isAdmin = sessionUser?.role === 'admin';

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      setLoadingSession(true);
      setError(null);

      const { res, data } = await apiFetch("/api/auth/me");

      if (!res.ok || !data?.success || !data?.user) {
        setSessionUser(null);
        setSelectedTeamId("");
        setSelectedTeamName("");
        setInventory([]);
        return;
      }

      const u: SessionUser = data.user;
      setSessionUser(u);

      if (u.role !== 'admin') {
        const tid = u.teamId ?? null;
        const tname = u.teamName ?? "";

        if (tid) {
          setSelectedTeamId(String(tid));
          setSelectedTeamName(tname || `Team ${tid}`);
        } else {
          setSelectedTeamId("");
          setSelectedTeamName("");
        }
      }
    } catch (err: any) {
      console.error("Error loading session:", err);
      setError("Error loading session: " + err.message);
      setSessionUser(null);
      setSelectedTeamId("");
      setSelectedTeamName("");
      setInventory([]);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    if (selectedTeamId && selectedTeamId.trim() !== "") {
      fetchTeamInventory(selectedTeamId);
    } else {
      setInventory([]);
    }
  }, [selectedTeamId]);

  const fetchTeamInventory = async (teamId: string) => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);

      console.log(`📦 Fetching inventory for team ${teamId}...`);
      
      // PRIMERO: Intentar con el nuevo endpoint de stored procedures
      const { res, data } = await apiFetch(`/api/sp/team-inventory/${teamId}`);
      
      console.log("📊 API Response:", { 
        status: res.status, 
        success: data?.success,
        dataLength: data?.data?.length,
        dataSample: data?.data?.[0]
      });

      if (res.ok && data.success) {
        //Guardar para debug
        setDebugInfo({
          endpoint: "sp/team-inventory",
          count: data.data?.length || 0,
          firstItem: data.data?.[0]
        });
        
        // Normalizar datos para la interfaz
        const normalizedData = (data.data || []).map((item: any) => ({
          Part_id: item.Part_id || item.id || 0,
          Name: item.Name || item.name || "",
          Category: item.Category || item.category || "",
          Price: item.Price || 0,
          Stock: item.Stock || item.Quantity || item.quantity || 0,
          Quantity: item.Quantity || item.quantity || item.Stock || 0,
          p: item.p || 0,
          a: item.a || 0,
          m: item.m || 0,
          acquiredDate: item.acquiredDate || item.AcquiredDate || new Date().toISOString().split('T')[0]
        }));
        
        setInventory(normalizedData);
      } else {
        console.log("⚠️ SP endpoint failed, trying legacy endpoint...");
        
        // SEGUNDO: Intentar con el endpoint legacy si falla el SP
        try {
          const legacyResult = await apiFetch(`/api/inventory/${teamId}`);
          
          if (legacyResult.res.ok && legacyResult.data.success) {
            console.log("Legacy endpoint successful");
            setDebugInfo({
              endpoint: "inventory/teamId",
              count: legacyResult.data.data?.length || 0,
              firstItem: legacyResult.data.data?.[0]
            });
            
            // Normalizar datos legacy
            const normalizedLegacyData = (legacyResult.data.data || []).map((item: any) => ({
              Part_id: item.id || item.Part_id || 0,
              Name: item.name || item.Name || "",
              Category: item.category || item.Category || "",
              Stock: item.quantity || item.Quantity || item.Stock || 0,
              Quantity: item.quantity || item.Quantity || item.Stock || 0,
              p: item.p || 0,
              a: item.a || 0,
              m: item.m || 0,
              acquiredDate: item.acquiredDate || item.AcquiredDate || "N/A"
            }));
            
            setInventory(normalizedLegacyData);
          } else {
            throw new Error("Legacy endpoint also failed");
          }
        } catch (legacyError) {
          console.error("❌ Both endpoints failed:", legacyError);
          setError("No se pudo cargar el inventario. Intente nuevamente.");
          setInventory([]);
        }
      }
    } catch (err: any) {
      console.error("Error al cargar inventario:", err);
      setError("Error al cargar el inventario: " + err.message);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // Función helper para obtener valores seguros
  const getSafeValue = (item: InventoryPart, key: keyof InventoryPart) => {
    const value = item[key];
    return value !== undefined && value !== null ? value : "";
  };

  // Filter con valores seguros
  const filteredInventory = inventory.filter((item) => {
    const name = getSafeValue(item, 'Name');
    const category = getSafeValue(item, 'Category');
    const searchLower = search.toLowerCase();
    
    return (
      (typeof name === 'string' && name.toLowerCase().includes(searchLower)) ||
      (typeof category === 'string' && getCategoryName(category).toLowerCase().includes(searchLower))
    );
  });

  // Calcular totales con valores seguros
  const totalParts = filteredInventory.reduce((sum, item) => {
    const quantity = item.Quantity || item.Stock || 0;
    return sum + quantity;
  }, 0);

  const noTeamAssigned =
    !loadingSession &&
    sessionUser &&
    (!sessionUser.teamId || sessionUser.teamId === null) &&
    sessionUser.role !== 'admin';

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Team&apos;s Inventory
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? "View inventory for any team" : "Parts available for team use"}
            </p>
          </div>
          
          {/*Debug info (solo desarrollo) */}
          {debugInfo && process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground">
              Loaded {debugInfo.count} items from {debugInfo.endpoint}
            </div>
          )}
        </div>

        {/* Panel con TeamSelector */}
        <div
          className="glass-card rounded-xl p-6 mb-8 opacity-0 animate-fade-in relative z-10"
          style={{ animationDelay: "50ms" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="font-display font-semibold text-foreground">
              {isAdmin ? "View Mode" : "Team"}
            </h3>
          </div>

          {loadingSession ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading session...
            </div>
          ) : !sessionUser ? (
            <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                <p className="text-sm text-warning">
                  Not authenticated. Please login again.
                </p>
              </div>
            </div>
          ) : isAdmin ? (
            <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Administrator Mode</p>
                  <p className="font-display font-bold text-blue-400">Full Access - All Teams</p>
                  <p className="text-xs text-muted-foreground">
                    User: {sessionUser.username}
                  </p>
                </div>
              </div>
              <div className="relative z-20">
                <TeamSelector
                  value={selectedTeamId}
                  onChange={(teamId, teamName) => {
                    setSelectedTeamId(teamId);
                    setSelectedTeamName(teamName);
                  }}
                  placeholder="Select a team to view inventory..."
                />
              </div>
            </div>
          ) : selectedTeamId ? (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Viewing Inventory for</p>
                  <p className="font-display font-bold text-primary">{selectedTeamName}</p>
                  <p className="text-xs text-muted-foreground">
                    User: {sessionUser.username} · Role: {sessionUser.role}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                <p className="text-sm text-warning">
                  No team assigned for this user in the database.
                </p>
              </div>
              {noTeamAssigned && (
                <p className="text-xs text-muted-foreground mt-2">
                  Contact an administrator to assign you to a team.
                </p>
              )}
            </div>
          )}
        </div>

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

        {loading && (
          <div className="glass-card rounded-xl p-8 text-center mb-8">
            <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
            <p className="text-muted-foreground mt-4">Loading inventory...</p>
          </div>
        )}

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

        <div
          className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in"
          style={{ animationDelay: "150ms" }}
        >
          <div className="overflow-x-auto">
            {!selectedTeamId ? (
              <div className="p-8 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-display font-semibold text-foreground mb-2">
                  {isAdmin ? "Select a Team" : "No Team Assigned"}
                </h4>
                <p className="text-muted-foreground">
                  {isAdmin 
                    ? "Select a team to view their inventory"
                    : "This user does not have a team assigned in the database."}
                </p>
              </div>
            ) : !loading && inventory.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-display font-semibold text-foreground mb-2">Empty Inventory</h4>
                <p className="text-muted-foreground">
                  {selectedTeamName} doesn&apos;t have any parts in their inventory yet
                </p>
              </div>
            ) : !loading && filteredInventory.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-display font-semibold text-foreground mb-2">No Parts Found</h4>
                <p className="text-muted-foreground">
                  No parts match &quot;{search}&quot; in {selectedTeamName}&apos;s inventory
                </p>
                <button onClick={() => setSearch("")} className="mt-4 text-sm text-primary hover:underline">
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
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Acquisition</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const CategoryIcon = getCategoryIcon(item.Category);
                    const quantity = item.Quantity || item.Stock || 0;
                    
                    return (
                      <tr
                        key={item.Part_id}
                        className="border-t border-border hover:bg-accent/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <CategoryIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <span className="font-medium text-foreground block">{item.Name}</span>
                              <span className="text-xs text-muted-foreground">ID: {item.Part_id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <Badge variant="secondary" className="capitalize">
                            {getCategoryName(item.Category)}
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
                          <span className="font-display font-bold text-foreground">{quantity}</span>
                          {quantity === 0 && (
                            <span className="block text-xs text-destructive mt-1">Out of stock</span>
                          )}
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
