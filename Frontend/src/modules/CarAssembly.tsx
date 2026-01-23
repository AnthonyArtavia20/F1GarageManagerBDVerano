import { useState, useEffect } from "react";
import { Car, Zap, Wind, CircleDot, Cog, Settings2, Check, AlertCircle, Loader2, X, Users } from "lucide-react";
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
import { apiFetch } from "@/lib/api"; // <-- IMPORTAR apiFetch

interface Part {
  Part_id: number;
  Name: string;
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

interface TeamCar {
  Car_id: number;
  Team_id: number;
  isFinalized: boolean;
}

interface InstalledPart {
  Part_Category: string;
  Part_id: number;
  Part_Name: string;
  p: number;
  a: number;
  m: number;
}

interface SessionUser {
  id: number;
  username: string;
  role: string;
  teamId?: number | null;
  teamName?: string | null;
}

const categories = [
  { id: "Power_Unit", name: "Power Unit", icon: Zap, color: "text-red-400", bgColor: "bg-red-500/10" },
  { id: "Aerodynamics_pkg", name: "Aerodynamics Package", icon: Wind, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "Wheels", name: "Wheels", icon: CircleDot, color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  { id: "Suspension", name: "Suspension", icon: Cog, color: "text-green-400", bgColor: "bg-green-500/10" },
  { id: "Gearbox", name: "Gearbox", icon: Settings2, color: "text-purple-400", bgColor: "bg-purple-500/10" },
];

const CarAssembly = () => {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [teamCars, setTeamCars] = useState<TeamCar[]>([]);
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [installedParts, setInstalledParts] = useState<Record<string, number | null>>({});
  const [installedPartsNames, setInstalledPartsNames] = useState<Record<string, string>>({});
  const [installedPartsData, setInstalledPartsData] = useState<Record<string, InstalledPart>>({});
  const [carStats, setCarStats] = useState<CarStats | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const selectedCarId = teamCars[selectedCarIndex]?.Car_id?.toString();
  const isAdmin = sessionUser?.role === 'admin';

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      setLoadingSession(true);
      setError(null);

      console.log('[CarAssembly] Fetching session...');
      
      const { res, data } = await apiFetch("/api/auth/me", {
        method: "GET",
      });

      console.log('🔍 [CarAssembly] Session response:', { status: res.status, data });

      if (!res.ok || !data?.success || !data?.user) {
        console.log('🔍 [CarAssembly] No valid session');
        setSessionUser(null);
        setSelectedTeam("");
        setSelectedTeamName("");
        return;
      }

      const u = data.user;
      setSessionUser(u);

      //Si NO es admin, fijar equipo automáticamente
      if (u.role !== 'admin') {
        const tid = u.teamId ?? null;
        const tname = u.teamName ?? "";

        if (tid) {
          setSelectedTeam(String(tid));
          setSelectedTeamName(tname || `Team ${tid}`);
        } else {
          setSelectedTeam("");
          setSelectedTeamName("");
        }
      }
      //Si ES admin, no fija ningún equipo - debe seleccionarlo manualmente

    } catch (err: any) {
      console.error("🔍 [CarAssembly] Error loading session:", err);
      setError("Error loading session: " + err.message);
      setSessionUser(null);
      setSelectedTeam("");
      setSelectedTeamName("");
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamCars();
    } else {
      setTeamCars([]);
      setSelectedCarIndex(0);
      setAvailableParts([]);
      setInstalledParts({});
      setInstalledPartsNames({});
      setInstalledPartsData({});
      setCarStats(null);
      setHasChanges(false);
    }
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedTeam && selectedCarId) {
      fetchAllData();
    }
  }, [selectedTeam, selectedCarId]);

  const fetchAllData = async () => {
    await fetchCarConfiguration();
    await fetchAvailableParts();
    await fetchCarStats();
  };

  const fetchTeamCars = async () => {
    try {
      setLoading(true);
      setError(null);

      // Datos de ejemplo para desarrollo
      const teamIdNum = parseInt(selectedTeam);
      const mockTeamCars: TeamCar[] = [
        { Car_id: (teamIdNum * 2) - 1, Team_id: teamIdNum, isFinalized: false },
        { Car_id: teamIdNum * 2, Team_id: teamIdNum, isFinalized: false }
      ];

      setTeamCars(mockTeamCars);
      setSelectedCarIndex(0);
      
      console.log('Team cars loaded:', mockTeamCars);
      
    } catch (err: any) {
      console.error('Error al cargar carros del equipo:', err);
      setError('Error al cargar los carros del equipo');
      
      // Datos de ejemplo para desarrollo
      const teamIdNum = parseInt(selectedTeam);
      const mockTeamCars: TeamCar[] = [
        { Car_id: (teamIdNum * 2) - 1, Team_id: teamIdNum, isFinalized: false },
        { Car_id: teamIdNum * 2, Team_id: teamIdNum, isFinalized: false }
      ];
      setTeamCars(mockTeamCars);
      setSelectedCarIndex(0);
      
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableParts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching inventory for team ${selectedTeam}...`);
      
      const { res, data } = await apiFetch(`/api/sp/assembly/team-inventory/${selectedTeam}`);
      
      console.log('Inventory response:', { status: res.status, data });

      if (res.ok && data.success) {
        console.log(`Loaded ${data.data?.length || 0} parts`);
        setAvailableParts(data.data || []);
      } else {
        console.warn('No parts loaded, using mock data');
        // Datos de ejemplo para desarrollo
        const mockParts: Part[] = [
          { Part_id: 1, Name: 'V6 Turbo Hybrid', Category: 'Power_Unit', Price: 150000, Stock: 2, p: 15, a: 5, m: 8 },
          { Part_id: 2, Name: 'Front Wing Package', Category: 'Aerodynamics_pkg', Price: 80000, Stock: 3, p: 3, a: 12, m: 6 },
          { Part_id: 3, Name: 'Carbon Fiber Wheels', Category: 'Wheels', Price: 60000, Stock: 4, p: 6, a: 7, m: 10 },
          { Part_id: 4, Name: 'Double Wishbone Suspension', Category: 'Suspension', Price: 70000, Stock: 2, p: 4, a: 6, m: 14 },
          { Part_id: 5, Name: '8-Speed Gearbox', Category: 'Gearbox', Price: 90000, Stock: 1, p: 8, a: 5, m: 9 },
        ];
        setAvailableParts(mockParts);
      }
    } catch (err: any) {
      console.error('❌ Error al cargar partes:', err);
      setError('Error al cargar partes disponibles');
      // Datos de ejemplo para desarrollo
      const mockParts: Part[] = [
        { Part_id: 1, Name: 'V6 Turbo Hybrid', Category: 'Power_Unit', Price: 150000, Stock: 2, p: 15, a: 5, m: 8 },
        { Part_id: 2, Name: 'Front Wing Package', Category: 'Aerodynamics_pkg', Price: 80000, Stock: 3, p: 3, a: 12, m: 6 },
      ];
      setAvailableParts(mockParts);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarConfiguration = async () => {
    if (!selectedCarId) return;

    try {
      console.log(`🔄 Fetching configuration for car ${selectedCarId}...`);
      
      const { res, data } = await apiFetch(`/api/sp/assembly/car-configuration/${selectedCarId}`);
      
      console.log('📊 Configuration response:', { status: res.status, data });

      if (res.ok && data.success) {
        const config: Record<string, number | null> = {};
        const names: Record<string, string> = {};
        const partsData: Record<string, InstalledPart> = {};

        data.parts.forEach((part: InstalledPart) => {
          config[part.Part_Category] = part.Part_id;
          names[part.Part_Category] = part.Part_Name;
          partsData[part.Part_Category] = part;
        });

        setInstalledParts(config);
        setInstalledPartsNames(names);
        setInstalledPartsData(partsData);
        console.log('✅ Car configuration loaded:', partsData);
      } else {
        console.log('No configuration found, starting fresh');
        setInstalledParts({});
        setInstalledPartsNames({});
        setInstalledPartsData({});
      }
    } catch (err) {
      console.error('❌ Error al cargar configuración:', err);
      setInstalledParts({});
      setInstalledPartsNames({});
      setInstalledPartsData({});
    }
  };

  const fetchCarStats = async () => {
    if (!selectedCarId) return;

    try {
      console.log(`🔄 Fetching stats for car ${selectedCarId}...`);
      
      const { res, data } = await apiFetch(`/api/sp/assembly/car-stats/${selectedCarId}`);

      
      console.log('📊 Stats response FULL:', { status: res.status, statusText: res.statusText,ok: res.ok, data: data 
    });

        if (res.ok && data && data.success) {
        console.log('✅ Car stats loaded via SP:', data.stats);
        setCarStats(data.stats);
      } else {
        console.log('⚠️ SP returned but with issues, calculating manually');
        console.log('res.ok:', res.ok);
        console.log('data:', data);
        console.log('data.success:', data?.success);
        calculateManualStats();
      }
    } catch (err) {
      console.error('❌ Error al cargar stats:', err);
      calculateManualStats();
    }
  };

  const calculateManualStats = () => {
    const installedCount = Object.keys(installedPartsData).length;
    if (installedCount === 0) {
      setCarStats({
        Car_id: parseInt(selectedCarId || '0'),
        Power: 0,
        Aerodynamics: 0,
        Maneuverability: 0,
        TotalPerformance: 0,
        Parts_Installed: 0
      });
      return;
    }

    let totalPower = 0;
    let totalAero = 0;
    let totalManeuver = 0;

    Object.values(installedPartsData).forEach(part => {
      totalPower += part.p || 0;
      totalAero += part.a || 0;
      totalManeuver += part.m || 0;
    });

    setCarStats({
      Car_id: parseInt(selectedCarId || '0'),
      Power: totalPower,
      Aerodynamics: totalAero,
      Maneuverability: totalManeuver,
      TotalPerformance: totalPower + totalAero + totalManeuver,
      Parts_Installed: installedCount
    });
  };

  const handleInstallPart = async (category: string, partId: number) => {
    if (!selectedCarId) return;

    const oldPartId = installedParts[category];
    const isReplacement = oldPartId !== null && oldPartId !== undefined;

    try {
      setLoading(true);
      setError(null);

      const endpoint = isReplacement ? '/api/sp/assembly/replace-part' : '/api/sp/assembly/install-part';
      const body = isReplacement
        ? {
            carId: parseInt(selectedCarId),
            oldPartId,
            newPartId: partId,
            teamId: parseInt(selectedTeam)
          }
        : {
            carId: parseInt(selectedCarId),
            partId,
            teamId: parseInt(selectedTeam)
          };

      console.log(`🔄 ${isReplacement ? 'Replacing' : 'Installing'} part:`, body);
      
      const { res, data } = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (res.ok && data.success) {
        console.log(`✅ Part ${isReplacement ? 'replaced' : 'installed'} successfully`);
        await fetchAllData();
        setHasChanges(true);
      } else {
        const errorMsg = data.error || data.message || 'Error al instalar parte';
        setError(errorMsg);
        alert('Error: ' + errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error desconocido';
      setError(errorMsg);
      alert('Error de red: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUninstallPart = async (category: string, partId: number) => {
    if (!selectedCarId) return;

    const partName = installedPartsData[category]?.Part_Name || "esta parte";

    if (!confirm(`¿Desinstalar ${partName}?`)) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Uninstalling part ${partId} from car ${selectedCarId}...`);
      
      const { res, data } = await apiFetch("/api/sp/assembly/uninstall-part", {
        method: 'POST',
        body: JSON.stringify({
          carId: parseInt(selectedCarId),
          partId: partId,
          teamId: parseInt(selectedTeam)
        })
      });

      if (res.ok && data.success) {
        console.log('✅ Part uninstalled successfully');
        alert('Parte desinstalada exitosamente');
        await fetchAllData();
        setHasChanges(true);
      } else {
        const errorMsg = data.error || data.message || 'Error al desinstalar parte';
        setError(errorMsg);
        alert('Error: ' + errorMsg);
      }
    } catch (err: any) {
      setError(err.message);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const validatePart = async (category: string, partId: number) => {
    if (!selectedCarId) return false;

    try {
      console.log(`🔄 Validating part ${partId} for car ${selectedCarId}...`);
      
      const { res, data } = await apiFetch(`/api/sp/assembly/validate-part/${selectedCarId}/${partId}`);

      if (res.ok && data.success) {
        if (data.validation?.Status === 'INVALID') {
          alert('Alerta: ' + data.validation.Message);
          return false;
        }
        return true;
      }
      return true;
    } catch (err) {
      console.error('❌ Error validando parte:', err);
      return true;
    }
  };

  const handlePartChange = async (category: string, partId: string) => {
    const numericPartId = parseInt(partId);

    if (!numericPartId || isNaN(numericPartId)) {
      return;
    }

    const isValid = await validatePart(category, numericPartId);

    if (!isValid) {
      return;
    }

    await handleInstallPart(category, numericPartId);
  };

  const handleSaveConfiguration = async () => {
    const installedCategoriesCount = Object.keys(installedPartsData).length;
    const isCarComplete = installedCategoriesCount === 5;

    if (isCarComplete) {
      alert('✅ Configuración guardada exitosamente! ¡READY TO RACE!');
      setHasChanges(false);
    } else {
      const missingCount = 5 - installedCategoriesCount;
      alert(
        `⚠️ Configuración guardada parcialmente. El carro NO es apto para correr porque le falta(n) ${missingCount} categoría(s) instalada(s).\n\nRequiere instalar todas las 5 categorías para poder competir.`
      );
      setHasChanges(false);
    }
  };

  const handlePrevCar = () => {
    if (selectedCarIndex > 0) {
      setSelectedCarIndex(prev => prev - 1);
    }
  };

  const handleNextCar = () => {
    if (selectedCarIndex < teamCars.length - 1) {
      setSelectedCarIndex(prev => prev + 1);
    }
  };

  const isCarReady = Object.keys(installedPartsData).length === 5;

  const noTeamAssigned =
    !loadingSession &&
    sessionUser &&
    (!sessionUser.teamId || sessionUser.teamId === null) &&
    sessionUser.role !== 'admin';

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in relative z-20">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Car Assembly
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? "Configure cars for any team" : "Configure your racing car with performance parts"}
            </p>
          </div>
        </div>

        {/* Panel con TeamSelector para admin */}
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
              {/*TeamSelector para admin */}
              <div className="relative z-20">
                <TeamSelector
                  value={selectedTeam}
                  onChange={(teamId, teamName) => {
                    setSelectedTeam(teamId);
                    setSelectedTeamName(teamName);
                  }}
                  placeholder="Select a team to configure cars..."
                />
              </div>
            </div>
          ) : selectedTeam ? (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Configuring Cars for</p>
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

        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {!selectedTeam ? (
          <div className="glass-card rounded-xl p-12 text-center relative z-99999">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              {loadingSession ? "Loading..." : isAdmin ? "Select a Team" : "No Team Assigned"}
            </h3>
            <p className="text-muted-foreground">
              {loadingSession 
                ? "Please wait while we load your information..." 
                : isAdmin
                  ? "Select a team to configure their cars"
                  : "You need a team assigned to configure cars"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h2
                className="font-display text-lg font-semibold text-foreground opacity-0 animate-fade-in"
                style={{ animationDelay: "100ms" }}
              >
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

                const installedPartInfo = installedPartsData[category.id];
                const partInInventory = partsInCategory.find(p => p.Part_id === selectedPartId);

                const displayName = installedPartInfo?.Part_Name || "None installed";
                const displayStats = partInInventory || installedPartInfo;

                const allPartsForSelect = [...partsInCategory];
                if (installedPartInfo && !partsInCategory.some(p => p.Part_id === installedPartInfo.Part_id)) {
                  allPartsForSelect.push({
                    Part_id: installedPartInfo.Part_id,
                    Name: installedPartInfo.Part_Name,
                    Category: category.id,
                    Price: 0,
                    Stock: 0,
                    p: installedPartInfo.p,
                    a: installedPartInfo.a,
                    m: installedPartInfo.m
                  });
                }

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
                          {displayName}
                        </p>
                      </div>
                      {installedPartInfo && displayStats && (
                        <>
                          <div className="flex gap-3">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">P</p>
                              <p className="font-display font-bold text-red-400">{displayStats.p}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">A</p>
                              <p className="font-display font-bold text-blue-400">{displayStats.a}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">M</p>
                              <p className="font-display font-bold text-green-400">{displayStats.m}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUninstallPart(category.id, installedPartInfo.Part_id)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors text-red-400 hover:text-red-300"
                            title="Desinstalar parte"
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                    <Select
                      value={selectedPartId?.toString() || ""}
                      onValueChange={(value) => handlePartChange(category.id, value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-card/50 border-border">
                        <SelectValue placeholder={allPartsForSelect.length > 0 ? "Select part..." : "No parts available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {allPartsForSelect.map((part) => (
                          <SelectItem
                            key={part.Part_id}
                            value={part.Part_id.toString()}
                            textValue={part.Name}
                          >
                            <div className="flex items-center justify-between w-full gap-4">
                              <span className="font-medium">{part.Name}</span>
                              <span className="text-xs text-muted-foreground">
                                P:{part.p} A:{part.a} M:{part.m} {part.Stock > 0 ? `| ${part.Price.toLocaleString()}` : ''}
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

            <div className="space-y-4">
              <h2
                className="font-display text-lg font-semibold text-foreground opacity-0 animate-fade-in"
                style={{ animationDelay: "100ms" }}
              >
                Car Performance
              </h2>

              <div
                className={`glass-card rounded-xl p-4 mb-4 ${isCarReady ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'} opacity-0 animate-fade-in`}
                style={{ animationDelay: "150ms" }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCarReady ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                    {isCarReady ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isCarReady ? 'text-green-400' : 'text-yellow-400'}`}>
                      {isCarReady ? 'READY TO RACE' : 'INCOMPLETE CONFIGURATION'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isCarReady
                        ? 'Carro completo, listo para competir'
                        : `Faltan ${5 - Object.keys(installedPartsData).length} categorías para completar`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handlePrevCar}
                    disabled={selectedCarIndex === 0 || loading}
                    className="w-10 h-10 rounded-lg bg-accent/50 hover:bg-accent flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous car"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="text-center">
                    <h3 className="font-display font-bold text-2xl text-foreground mb-1">
                      CAR #{selectedCarIndex + 1}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{selectedTeamName}</p>
                    <Badge
                      variant={hasChanges ? "destructive" : "default"}
                      className={
                        hasChanges
                          ? "bg-yellow-500"
                          : isCarReady
                            ? "bg-green-500"
                            : "bg-blue-500"
                      }
                    >
                      {hasChanges
                        ? "Unsaved Changes"
                        : isCarReady
                          ? "Ready to Race"
                          : "Saved (Incomplete)"}
                    </Badge>
                  </div>

                  <button
                    onClick={handleNextCar}
                    disabled={selectedCarIndex === teamCars.length - 1 || loading}
                    className="w-10 h-10 rounded-lg bg-accent/50 hover:bg-accent flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Next car"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

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

                <Button
                  variant="racing"
                  className="w-full"
                  onClick={handleSaveConfiguration}
                  disabled={!hasChanges || loading}
                >
                  <Check className="w-4 h-4" />
                  {isCarReady ? 'SAVE & FINALIZE CONFIGURATION' : 'SAVE PARTIAL CONFIGURATION'}
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