import { useState, useEffect } from "react";
import { 
  Play, Trophy, Clock, Gauge, Timer, Flag, Car, Users, 
  CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp,
  Download, Trash2, Eye, Filter, RefreshCw, User, Settings
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface Circuit {
  Circuit_id: number;
  Name: string;
  Total_distance: number;
  N_Curves: number;
  Calculated_Curve_Distance: number;
  Calculated_Straight_Distance: number;
  IsValid: boolean;
  Message: string;
}

interface Team {
  Team_id: number;
  Name: string;
}

interface CarForSimulation {
  Car_id: number;
  Team_id: number;
  Team_Name: string;
  Installed_Categories: number;
  Total_P: number;
  Total_A: number;
  Total_M: number;
  isFinalized: boolean;
}

interface Driver {
  Driver_id: number;
  Driver_Name: string;
  Driver_H: number;
  Team_id: number;
  Team_Name: string;
}

interface SimulationParticipant {
  position: number;
  time_seconds: number;
  v_recta: number;
  v_curva: number;
  penalty: number;
  setup_p: number;
  setup_a: number;
  setup_m: number;
  driver_h: number;
  Car_id: number;
  Team_id: number;
  Team_Name: string;
  Driver_id: number;
  Driver_Username: string;
  Driver_H: number;
}

interface SimulationResult {
  simulation: {
    Simulation_id: number;
    Data_time: string;
    Circuit_Name: string;
    Total_distance: number;
    N_Curves: number;
    Admin_Username: string;
  };
  participants: SimulationParticipant[];
  setupDetails: Array<{
    category: string;
    part_id: number;
    Part_Name: string;
    part_p: number;
    part_a: number;
    part_m: number;
    car_id: number;
    Team_Name: string;
  }>;
}

interface SelectedParticipant {
  carId: number;
  teamId: number;
  teamName: string;
  driverId: number | null;
  driverName: string;
  driverH: number;
  carP: number;
  carA: number;
  carM: number;
}

const DC_CURVE_DISTANCE = 0.5; // km

const Simulation = () => {
  const [activeTab, setActiveTab] = useState("new");
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedCircuit, setSelectedCircuit] = useState<string>("");
  const [availableCars, setAvailableCars] = useState<CarForSimulation[]>([]);
  const [driversByTeam, setDriversByTeam] = useState<Record<number, Driver[]>>({});
  const [selectedParticipants, setSelectedParticipants] = useState<SelectedParticipant[]>([]);
  const [expandedTeams, setExpandedTeams] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState({
    circuits: true,
    teams: true,
    cars: true,
    simulation: false
  });
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<any[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchCircuits();
    fetchTeams();
    fetchAvailableCars();
    fetchSimulationHistory();
  }, []);

  // Cargar conductores cuando se selecciona un equipo
  useEffect(() => {
    if (teams.length > 0) {
      teams.forEach(team => {
        fetchDriversByTeam(team.Team_id);
      });
    }
  }, [teams]);

  const fetchCircuits = async () => {
    try {
      setIsLoading(prev => ({ ...prev, circuits: true }));
      const { res, data } = await apiFetch("/api/circuits");
      
      if (res.ok && data.success) {
        setCircuits(data.data || []);
      } else {
        console.error("Error al cargar circuitos:", data.message);
      }
    } catch (err: any) {
      console.error("Error al cargar circuitos:", err);
    } finally {
      setIsLoading(prev => ({ ...prev, circuits: false }));
    }
  };

  const fetchTeams = async () => {
    try {
      setIsLoading(prev => ({ ...prev, teams: true }));
      const { res, data } = await apiFetch("/api/teams");
      
      if (res.ok && data.success) {
        setTeams(data.data || []);
      }
    } catch (err: any) {
      console.error("Error al cargar equipos:", err);
    } finally {
      setIsLoading(prev => ({ ...prev, teams: false }));
    }
  };

  const fetchAvailableCars = async () => {
    try {
      setIsLoading(prev => ({ ...prev, cars: true }));
      const { res, data } = await apiFetch("/api/simulations/available-cars");
      
      if (res.ok && data.success) {
        setAvailableCars(data.data.cars || []);
      }
    } catch (err: any) {
      console.error("Error al cargar carros:", err);
    } finally {
      setIsLoading(prev => ({ ...prev, cars: false }));
    }
  };

  const fetchDriversByTeam = async (teamId: number) => {
  try {
    const { res, data } = await apiFetch(`/api/simulations/teams/${teamId}/drivers`);
    if (res.ok && data.success) {
      setDriversByTeam(prev => ({
        ...prev,
        [teamId]: data.data || [] // Siempre actualizar, incluso si es array vacío
      }));
    } else {
      // Si hay error, establecer array vacío
      setDriversByTeam(prev => ({
        ...prev,
        [teamId]: []
      }));
    }
  } catch (err) {
    console.error(`Error al cargar conductores del equipo ${teamId}:`, err);
    setDriversByTeam(prev => ({
      ...prev,
      [teamId]: []
    }));
  }
};

  const fetchSimulationHistory = async () => {
    try {
      const { res, data } = await apiFetch("/api/simulations?limit=10");
      if (res.ok && data.success) {
        setSimulationHistory(data.data || []);
      }
    } catch (err) {
      console.error("Error al cargar historial:", err);
    }
  };

  const toggleTeamExpansion = (teamId: number) => {
  setExpandedTeams(prev => {
    const newExpanded = prev.includes(teamId)
      ? prev.filter(id => id !== teamId)
      : [...prev, teamId];
    
    if (newExpanded.includes(teamId)) {
      fetchDriversByTeam(teamId);
    }
    
    return newExpanded;
  });
};

  const getCarsByTeam = (teamId: number) => {
    return availableCars.filter(car => car.Team_id === teamId && car.isFinalized && car.Installed_Categories === 5);
  };

 const addParticipant = (car: CarForSimulation) => {
  // Verificar si ya está seleccionado
  if (selectedParticipants.some(p => p.carId === car.Car_id)) {
    return;
  }

  // Verificar límite de 10 participantes
  if (selectedParticipants.length >= 10) {
    alert("Máximo 10 participantes por simulación");
    return;
  }

  // Obtener conductores del equipo
  const teamDrivers = driversByTeam[car.Team_id] || [];
  
  if (teamDrivers.length === 0) {
    alert(`El equipo ${car.Team_Name} no tiene conductores asignados. No se puede seleccionar carros de este equipo.`);
    return;
  }
  
  // Tomar el primer conductor por defecto
  const defaultDriver = teamDrivers[0];
  
  const newParticipant: SelectedParticipant = {
    carId: car.Car_id,
    teamId: car.Team_id,
    teamName: car.Team_Name,
    driverId: defaultDriver.Driver_id,
    driverName: defaultDriver.Driver_Name,
    driverH: defaultDriver.Driver_H,
    carP: car.Total_P || 0,
    carA: car.Total_A || 0,
    carM: car.Total_M || 0
  };
  
  setSelectedParticipants(prev => [...prev, newParticipant]);
};

  const removeParticipant = (carId: number) => {
    setSelectedParticipants(prev => prev.filter(p => p.carId !== carId));
  };

  const updateParticipantDriver = (carId: number, driverId: number) => {
    const teamId = selectedParticipants.find(p => p.carId === carId)?.teamId;
    if (!teamId) return;

    const driver = driversByTeam[teamId]?.find(d => d.Driver_id === driverId);
    if (!driver) return;

    setSelectedParticipants(prev =>
      prev.map(participant =>
        participant.carId === carId
          ? {
              ...participant,
              driverId: driver.Driver_id,
              driverName: driver.Driver_Name,
              driverH: driver.Driver_H
            }
          : participant
      )
    );
  };

  const validateSimulation = (): boolean => {
    // Validar circuito seleccionado
    if (!selectedCircuit) {
      alert("Selecciona un circuito primero");
      return false;
    }

    const circuit = circuits.find(c => c.Circuit_id.toString() === selectedCircuit);
    if (!circuit?.IsValid) {
      alert("El circuito seleccionado no es válido para simulación");
      return false;
    }

    // Validar número de participantes
    if (selectedParticipants.length < 2) {
      alert("Se requieren al menos 2 participantes");
      return false;
    }

    if (selectedParticipants.length > 10) {
      alert("Máximo 10 participantes por simulación");
      return false;
    }

    // Validar que todos tengan conductor seleccionado
    for (const participant of selectedParticipants) {
      if (!participant.driverId) {
        alert(`El carro #${participant.carId} no tiene conductor seleccionado`);
        return false;
      }
    }

    return true;
  };

  const runSimulation = async () => {
    try {
      if (!validateSimulation()) {
        return;
      }

      setIsLoading(prev => ({ ...prev, simulation: true }));

      const driverIds = selectedParticipants.map(p => {
      if (!p.driverId) {
        throw new Error(`Carro #${p.carId} no tiene conductor seleccionado`);
      }
      return p.driverId;
    });

    const requestData = {
      circuitId: parseInt(selectedCircuit),
      carIds: selectedParticipants.map(p => p.carId),
      driverIds: driverIds, // ← Usar array validado
      dc: DC_CURVE_DISTANCE
    };

      const { res, data } = await apiFetch("/api/simulations", {
        method: "POST",
        body: JSON.stringify(requestData)
      });

      if (res.ok && data.success) {
        setSimulationResults(data.data);
        setActiveTab("results");
        fetchSimulationHistory();
        alert("✅ Simulación ejecutada exitosamente");
      } else {
        alert(data.message || "Error al ejecutar simulación");
      }
    } catch (err: any) {
      console.error("Error al ejecutar simulación:", err);
      alert("Error al ejecutar simulación: " + err.message);
    } finally {
      setIsLoading(prev => ({ ...prev, simulation: false }));
    }
  };

  const loadSimulationResults = async (simulationId: number) => {
    try {
      const { res, data } = await apiFetch(`/api/simulations/${simulationId}`);
      if (res.ok && data.success) {
        setSimulationResults(data.data);
        setActiveTab("results");
      }
    } catch (err) {
      console.error("Error al cargar resultados:", err);
    }
  };

  const deleteSimulation = async (simulationId: number) => {
    if (!confirm("¿Está seguro de eliminar esta simulación?")) return;
    
    try {
      const { res, data } = await apiFetch(`/api/simulations/${simulationId}`, {
        method: "DELETE"
      });
      
      if (res.ok && data.success) {
        alert("Simulación eliminada exitosamente");
        fetchSimulationHistory();
        if (simulationResults?.simulation.Simulation_id === simulationId) {
          setSimulationResults(null);
        }
      } else {
        alert(data.message || "Error al eliminar simulación");
      }
    } catch (err) {
      console.error("Error al eliminar simulación:", err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const selectedCircuitData = circuits.find(c => c.Circuit_id.toString() === selectedCircuit);

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Simulación de Carreras
          </h1>
          <p className="text-muted-foreground">
            Ejecuta simulaciones realistas y analiza resultados con fórmulas oficiales
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="new">
              <Car className="w-4 h-4 mr-2" />
              Nueva Simulación
            </TabsTrigger>
            <TabsTrigger value="results">
              <Trophy className="w-4 h-4 mr-2" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="w-4 h-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Tab: Nueva Simulación */}
          <TabsContent value="new" className="space-y-6">
            {/* Circuit Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-primary" />
                  Seleccionar Circuito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select
                    value={selectedCircuit}
                    onValueChange={setSelectedCircuit}
                    disabled={isLoading.circuits}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Elige un circuito" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading.circuits ? (
                        <SelectItem value="loading" disabled>Cargando...</SelectItem>
                      ) : circuits.length === 0 ? (
                        <SelectItem value="none" disabled>No hay circuitos</SelectItem>
                      ) : (
                        circuits.map(circuit => (
                          <SelectItem
                            key={circuit.Circuit_id}
                            value={circuit.Circuit_id.toString()}
                            className={!circuit.IsValid ? "text-destructive" : ""}
                          >
                            {circuit.Name} ({circuit.Total_distance} km, {circuit.N_Curves} curvas)
                            {!circuit.IsValid && " ⚠️"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {selectedCircuitData && (
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 rounded bg-accent/50">
                          <p className="text-xs text-muted-foreground">Distancia Total</p>
                          <p className="font-bold">{selectedCircuitData.Total_distance} km</p>
                        </div>
                        <div className="p-3 rounded bg-accent/50">
                          <p className="text-xs text-muted-foreground">Curvas</p>
                          <p className="font-bold">{selectedCircuitData.N_Curves}</p>
                        </div>
                        <div className="p-3 rounded bg-accent/50">
                          <p className="text-xs text-muted-foreground">Dist. Curvas</p>
                          <p className="font-bold">{selectedCircuitData.Calculated_Curve_Distance.toFixed(2)} km</p>
                        </div>
                        <div className="p-3 rounded bg-accent/50">
                          <p className="text-xs text-muted-foreground">Dist. Rectas</p>
                          <p className={`font-bold ${selectedCircuitData.Calculated_Straight_Distance < 0 ? "text-destructive" : ""}`}>
                            {selectedCircuitData.Calculated_Straight_Distance.toFixed(2)} km
                          </p>
                        </div>
                      </div>
                      {!selectedCircuitData.IsValid && (
                        <div className="mt-3 p-2 rounded bg-destructive/10 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          {selectedCircuitData.Message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Seleccionar Participantes ({selectedParticipants.length}/10 seleccionados)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAvailableCars}
                    disabled={isLoading.cars}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading.cars ? "animate-spin" : ""}`} />
                    Actualizar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading.cars ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Cargando carros disponibles...</p>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay equipos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Lista de participantes seleccionados */}
                    {selectedParticipants.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Participantes Seleccionados
                        </h3>
                        <div className="space-y-2">
                          {selectedParticipants.map(participant => (
                            <div
                              key={participant.carId}
                              className="p-3 rounded-lg border bg-card flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{participant.teamName}</span>
                                  <Badge variant="outline">Car #{participant.carId}</Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <Select
                                      value={participant.driverId?.toString() || ""}
                                      onValueChange={(value) => updateParticipantDriver(participant.carId, parseInt(value))}
                                    >
                                      <SelectTrigger className="w-48 h-8">
                                        <SelectValue placeholder="Seleccionar conductor" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {driversByTeam[participant.teamId]?.map(driver => (
                                          <SelectItem
                                            key={driver.Driver_id}
                                            value={driver.Driver_id.toString()}
                                          >
                                            {driver.Driver_Name} (H: {driver.Driver_H})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant="secondary" className="text-xs">P: {participant.carP}</Badge>
                                    <Badge variant="secondary" className="text-xs">A: {participant.carA}</Badge>
                                    <Badge variant="secondary" className="text-xs">M: {participant.carM}</Badge>
                                    <Badge variant="secondary" className="text-xs">H: {participant.driverH}</Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeParticipant(participant.carId)}
                                className="text-destructive hover:text-destructive"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Separator className="my-4" />
                      </div>
                    )}

                    {/* Lista de equipos disponibles */}
                    <h3 className="font-semibold mb-3">Equipos Disponibles</h3>
                    <div className="space-y-3">
                      {teams.map(team => {
  const teamCars = getCarsByTeam(team.Team_id);
  const hasAvailableCars = teamCars.length > 0;
  
  // Solo mostrar equipo si tiene carros disponibles
  // Los conductores se cargarán cuando se expanda
  return hasAvailableCars ? (
    <div key={team.Team_id} className="border rounded-lg overflow-hidden">
      <button
        onClick={() => toggleTeamExpansion(team.Team_id)}
        className="w-full p-4 flex items-center justify-between bg-accent/50 hover:bg-accent/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5" />
          <div className="text-left">
            <h3 className="font-semibold">{team.Name}</h3>
            <p className="text-sm text-muted-foreground">
              {teamCars.length} carro{teamCars.length !== 1 ? 's' : ''} disponible{teamCars.length !== 1 ? 's' : ''}
              {driversByTeam[team.Team_id] && 
                ` • ${driversByTeam[team.Team_id].length} conductor${driversByTeam[team.Team_id].length !== 1 ? 'es' : ''}`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm">
            {expandedTeams.includes(team.Team_id) ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </span>
        </div>
      </button>
      
      {expandedTeams.includes(team.Team_id) && (
  <div className="p-4 border-t">
    {/* Mostrar estado de carga */}
    {!driversByTeam[team.Team_id] && (
      <div className="text-center py-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Cargando conductores...</p>
      </div>
    )}
    
    {/* Si ya se cargaron los conductores (incluso array vacío) */}
    {driversByTeam[team.Team_id] && driversByTeam[team.Team_id].length === 0 && (
      <div className="text-center py-4 text-destructive">
        <AlertCircle className="w-6 h-6 mx-auto mb-2" />
        <p className="text-sm">Este equipo no tiene conductores asignados</p>
        <p className="text-xs mt-1">No se pueden seleccionar carros de este equipo</p>
      </div>
    )}
    
    {/* Si hay conductores, mostrar los carros */}
    {driversByTeam[team.Team_id] && driversByTeam[team.Team_id].length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamCars.map(car => (
          <div
            key={car.Car_id}
            className={cn(
              "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
              selectedParticipants.some(p => p.carId === car.Car_id)
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            )}
            onClick={() => addParticipant(car)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">Carro #{car.Car_id}</h4>
                <p className="text-sm text-muted-foreground">Equipo: {team.Name}</p>
              </div>
              <Badge variant="outline" className="ml-2">
                {car.Installed_Categories}/5 categorías
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 rounded bg-primary/10">
                <p className="text-xs text-muted-foreground">P</p>
                <p className="font-bold">{car.Total_P || 0}</p>
              </div>
              <div className="text-center p-2 rounded bg-primary/10">
                <p className="text-xs text-muted-foreground">A</p>
                <p className="font-bold">{car.Total_A || 0}</p>
              </div>
              <div className="text-center p-2 rounded bg-primary/10">
                <p className="text-xs text-muted-foreground">M</p>
                <p className="font-bold">{car.Total_M || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {driversByTeam[team.Team_id]?.length || 0} conductor(es) disponible(s)
                </span>
              </div>
              <Badge variant="secondary">
                {selectedParticipants.some(p => p.carId === car.Car_id) ? "Seleccionado" : "Disponible"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
    </div>
  ) : null;
})}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={runSimulation}
                  disabled={
                    !selectedCircuit ||
                    selectedParticipants.length < 2 ||
                    isLoading.simulation ||
                    !selectedCircuitData?.IsValid
                  }
                >
                  {isLoading.simulation ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Ejecutando Simulación...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Ejecutar Simulación ({selectedParticipants.length} participantes)
                    </>
                  )}
                </Button>
                
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-center">
                  <div className="p-2 rounded bg-accent/30">
                    <p className="font-semibold">Carros Seleccionados</p>
                    <p className="text-2xl font-bold">{selectedParticipants.length}</p>
                  </div>
                  <div className="p-2 rounded bg-accent/30">
                    <p className="font-semibold">Circuitos Válidos</p>
                    <p className="text-2xl font-bold">{circuits.filter(c => c.IsValid).length}</p>
                  </div>
                  <div className="p-2 rounded bg-accent/30">
                    <p className="font-semibold">dc (constante)</p>
                    <p className="text-2xl font-bold">{DC_CURVE_DISTANCE} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Resultados */}
          <TabsContent value="results">
            {simulationResults ? (
              <div className="space-y-6">
                {/* Simulation Header */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{simulationResults.simulation.Circuit_Name}</CardTitle>
                        <p className="text-muted-foreground">
                          Simulación #{simulationResults.simulation.Simulation_id} • {formatDate(simulationResults.simulation.Data_time)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSimulation(simulationResults.simulation.Simulation_id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-accent/50">
                        <p className="text-xs text-muted-foreground">Distancia Total</p>
                        <p className="font-bold text-lg">{simulationResults.simulation.Total_distance} km</p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/50">
                        <p className="text-xs text-muted-foreground">Número de Curvas</p>
                        <p className="font-bold text-lg">{simulationResults.simulation.N_Curves}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/50">
                        <p className="text-xs text-muted-foreground">Participantes</p>
                        <p className="font-bold text-lg">{simulationResults.participants.length}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/50">
                        <p className="text-xs text-muted-foreground">Ejecutado por</p>
                        <p className="font-bold text-lg">{simulationResults.simulation.Admin_Username}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Podium */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-f1-gold" />
                        Podio de la Carrera
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {simulationResults.participants.slice(0, 3).map((participant, index) => (
                          <div
                            key={participant.Car_id}
                            className={cn(
                              "p-4 rounded-xl border-2 flex items-center gap-4",
                              index === 0 ? "border-f1-gold bg-f1-gold/10" :
                              index === 1 ? "border-f1-silver bg-f1-silver/10" :
                              "border-f1-bronze bg-f1-bronze/10"
                            )}
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                              index === 0 ? "bg-f1-gold text-white" :
                              index === 1 ? "bg-f1-silver text-white" :
                              "bg-f1-bronze text-white"
                            )}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <h3 className="font-semibold">{participant.Team_Name}</h3>
                                <Badge variant="secondary">Car #{participant.Car_id}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Conductor: {participant.Driver_Username} (H: {participant.Driver_H})
                              </p>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="p-2 rounded bg-background/50">
                                  <p>Tiempo</p>
                                  <p className="font-bold">{formatTime(participant.time_seconds)}</p>
                                </div>
                                <div className="p-2 rounded bg-background/50">
                                  <p>V.Recta</p>
                                  <p className="font-bold">{participant.v_recta.toFixed(1)} km/h</p>
                                </div>
                                <div className="p-2 rounded bg-background/50">
                                  <p>V.Curva</p>
                                  <p className="font-bold">{participant.v_curva.toFixed(1)} km/h</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-primary" />
                        Estadísticas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-accent/50">
                          <p className="text-sm text-muted-foreground">Tiempo más rápido</p>
                          <p className="font-bold text-xl">
                            {formatTime(Math.min(...simulationResults.participants.map(p => p.time_seconds)))}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-accent/50">
                          <p className="text-sm text-muted-foreground">Promedio de tiempos</p>
                          <p className="font-bold text-xl">
                            {formatTime(simulationResults.participants.reduce((acc, p) => acc + p.time_seconds, 0) / simulationResults.participants.length)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-accent/50">
                          <p className="text-sm text-muted-foreground">Diferencia 1° vs 2°</p>
                          <p className="font-bold text-xl">
                            {formatTime(simulationResults.participants[1]?.time_seconds - simulationResults.participants[0]?.time_seconds || 0)}
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Totales promedio por carro:</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 rounded bg-primary/10 text-center">
                            <p className="text-xs">P</p>
                            <p className="font-bold">
                              {Math.round(simulationResults.participants.reduce((acc, p) => acc + p.setup_p, 0) / simulationResults.participants.length)}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-primary/10 text-center">
                            <p className="text-xs">A</p>
                            <p className="font-bold">
                              {Math.round(simulationResults.participants.reduce((acc, p) => acc + p.setup_a, 0) / simulationResults.participants.length)}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-primary/10 text-center">
                            <p className="text-xs">M</p>
                            <p className="font-bold">
                              {Math.round(simulationResults.participants.reduce((acc, p) => acc + p.setup_m, 0) / simulationResults.participants.length)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Full Results Table */}
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle>Resultados Completos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3">Pos</th>
                              <th className="text-left p-3">Equipo</th>
                              <th className="text-left p-3">Carro</th>
                              <th className="text-left p-3">Conductor</th>
                              <th className="text-left p-3">Tiempo</th>
                              <th className="text-left p-3">V.Recta</th>
                              <th className="text-left p-3">V.Curva</th>
                              <th className="text-left p-3">Penalización</th>
                              <th className="text-left p-3">P/A/M/H</th>
                            </tr>
                          </thead>
                          <tbody>
                            {simulationResults.participants.map(participant => (
                              <tr key={participant.Car_id} className="border-b hover:bg-accent/30">
                                <td className="p-3 font-bold">{participant.position}</td>
                                <td className="p-3">{participant.Team_Name}</td>
                                <td className="p-3">#{participant.Car_id}</td>
                                <td className="p-3">
                                  {participant.Driver_Username}
                                  <span className="text-xs text-muted-foreground block">H: {participant.Driver_H}</span>
                                </td>
                                <td className="p-3 font-mono">{formatTime(participant.time_seconds)}</td>
                                <td className="p-3">{participant.v_recta.toFixed(1)} km/h</td>
                                <td className="p-3">{participant.v_curva.toFixed(1)} km/h</td>
                                <td className="p-3">{participant.penalty.toFixed(2)}s</td>
                                <td className="p-3">
                                  <div className="flex gap-1">
                                    <Badge variant="secondary" className="text-xs">{participant.setup_p}</Badge>
                                    <Badge variant="secondary" className="text-xs">{participant.setup_a}</Badge>
                                    <Badge variant="secondary" className="text-xs">{participant.setup_m}</Badge>
                                    <Badge variant="outline" className="text-xs">{participant.driver_h}</Badge>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hay resultados de simulación</h3>
                  <p className="text-muted-foreground mb-4">
                    Ejecuta una nueva simulación o selecciona una del historial
                  </p>
                  <Button onClick={() => setActiveTab("new")}>
                    <Play className="w-4 h-4 mr-2" />
                    Crear Nueva Simulación
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Historial */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Historial de Simulaciones
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSimulationHistory}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {simulationHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay simulaciones en el historial</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {simulationHistory.map(sim => (
                      <div
                        key={sim.Simulation_id}
                        className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {sim.Circuit_Name} • #{sim.Simulation_id}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(sim.Data_time)} • {sim.Participant_Count} participantes
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadSimulationResults(sim.Simulation_id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteSimulation(sim.Simulation_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="p-2 rounded bg-accent/50">
                            <p className="text-muted-foreground">Tiempo más rápido</p>
                            <p className="font-bold">{formatTime(sim.Fastest_Time || 0)}</p>
                          </div>
                          <div className="p-2 rounded bg-accent/50">
                            <p className="text-muted-foreground">Distancia</p>
                            <p className="font-bold">{sim.Total_distance} km</p>
                          </div>
                          <div className="p-2 rounded bg-accent/50">
                            <p className="text-muted-foreground">Ejecutado por</p>
                            <p className="font-bold">{sim.Created_By}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Simulation;