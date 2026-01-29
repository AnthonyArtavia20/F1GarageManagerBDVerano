import { useState, useEffect } from "react";
import { Plus, Search, Flag, Route, CornerDownRight, Edit, Trash2, X, Loader2, AlertCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

interface Circuit {
  Circuit_id: number;
  Name: string;
  Total_distance: number;
  N_Curves: number;
  Calculated_Curve_Distance: number;
  Calculated_Straight_Distance: number;
}

interface CircuitFormData {
  name: string;
  totalDistance: string;
  numberOfCurves: string;
}

const Circuits = () => {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);
  const [formData, setFormData] = useState<CircuitFormData>({
    name: "",
    totalDistance: "",
    numberOfCurves: ""
  });
  const [error, setError] = useState<string | null>(null);

  const DC_CURVE_DISTANCE = 0.200;

  useEffect(() => {
    fetchCircuits();
  }, []);

  const fetchCircuits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { res, data } = await apiFetch("/api/circuits");
      
      if (res.ok && data.success) {
        setCircuits(data.data || []);
      } else {
        setError(data.message || "Error al cargar circuitos");
        setCircuits([]);
      }
    } catch (err: any) {
      console.error('Error al cargar circuitos:', err);
      setError("Error al cargar circuitos: " + err.message);
      setCircuits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (circuit?: Circuit) => {
    if (circuit) {
      setEditingCircuit(circuit);
      setFormData({
        name: circuit.Name,
        totalDistance: circuit.Total_distance.toString(),
        numberOfCurves: circuit.N_Curves.toString()
      });
    } else {
      setEditingCircuit(null);
      setFormData({
        name: "",
        totalDistance: "",
        numberOfCurves: ""
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCircuit(null);
    setFormData({
      name: "",
      totalDistance: "",
      numberOfCurves: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const totalDistanceValue = parseFloat(formData.totalDistance);
      
      const roundedTotalDistance = Math.round(totalDistanceValue * 1000) / 1000;
      
      const requestData = {
        name: formData.name,
        totalDistance: roundedTotalDistance,
        numberOfCurves: parseInt(formData.numberOfCurves)
      };

      let response;
      if (editingCircuit) {
        response = await apiFetch(`/api/circuits/${editingCircuit.Circuit_id}`, {
          method: "PUT",
          body: JSON.stringify(requestData)
        });
      } else {
        response = await apiFetch("/api/circuits", {
          method: "POST",
          body: JSON.stringify(requestData)
        });
      }

      const { res, data } = response;

      if (res.ok && data.success) {
        alert(editingCircuit ? 'Circuito actualizado exitosamente' : 'Circuito creado exitosamente');
        fetchCircuits();
        handleCloseModal();
      } else {
        alert(data.message || 'Error al guardar circuito');
      }
    } catch (err: any) {
      console.error('Error al guardar circuito:', err);
      alert('Error al guardar circuito: ' + err.message);
    }
  };

  const handleDelete = async (circuitId: number) => {
    if (!confirm('¿Está seguro de eliminar este circuito?')) return;

    try {
      const { res, data } = await apiFetch(`/api/circuits/${circuitId}`, {
        method: "DELETE"
      });

      if (res.ok && data.success) {
        alert('Circuito eliminado exitosamente');
        fetchCircuits();
      } else {
        alert(data.message || 'Error al eliminar circuito');
      }
    } catch (err: any) {
      console.error('Error al eliminar circuito:', err);
      alert('Error al eliminar circuito: ' + err.message);
    }
  };

  const filteredCircuits = circuits.filter((circuit) =>
    circuit.Name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Circuitos
            </h1>
            <p className="text-muted-foreground">
              Catálogo de circuitos disponibles para simulación (dc = {DC_CURVE_DISTANCE} km)
            </p>
          </div>
          <Button variant="racing" size="lg" onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5" />
            Nuevo Circuito
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar circuitos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="glass-card rounded-xl p-8 text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
            <p className="text-muted-foreground mt-4">Cargando circuitos...</p>
          </div>
        )}

        {/* Circuits Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCircuits.map((circuit, index) => {
              // Los cálculos YA VIENEN del backend
              const isValid = circuit.Calculated_Straight_Distance >= 0;
              
              return (
                <div
                  key={circuit.Circuit_id}
                  className={`glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in transition-all duration-300 group ${
                    !isValid ? 'border-destructive/50' : 'hover:border-primary/50'
                  }`}
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  {/* Header with gradient */}
                  <div className={`h-24 relative ${
                    !isValid 
                      ? 'bg-gradient-to-br from-destructive/20 to-transparent' 
                      : 'bg-gradient-to-br from-primary/20 to-transparent'
                  }`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Flag className={`w-12 h-12 ${
                        !isValid ? 'text-destructive/50' : 'text-primary/50'
                      }`} />
                    </div>
                    {/* Validation warning */}
                    {!isValid && (
                      <div className="absolute top-2 left-2">
                        <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                          ⚠️ Inválido
                        </span>
                      </div>
                    )}
                    {/* Action buttons */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-background/80 hover:bg-background"
                        onClick={() => handleOpenModal(circuit)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(circuit.Circuit_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                        {circuit.Name}
                      </h3>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-accent/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Route className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Distancia</span>
                        </div>
                        <p className="font-display font-bold text-foreground">
                          {circuit.Total_distance} km
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/50">
                        <div className="flex items-center gap-2 mb-1">
                          <CornerDownRight className="w-4 h-4 text-warning" />
                          <span className="text-xs text-muted-foreground">Curvas</span>
                        </div>
                        <p className="font-display font-bold text-foreground">
                          {circuit.N_Curves}
                        </p>
                      </div>
                    </div>

                    {/* Calculated distances - VIENEN DEL BACKEND */}
                    <div className={`mt-4 p-3 rounded-lg text-xs ${
                      !isValid ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/30'
                    }`}>
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Dist. Curvas:</span>
                        <span className="font-medium">{circuit.Calculated_Curve_Distance.toFixed(2)} km</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Dist. Rectas:</span>
                        <span className={`font-medium ${!isValid ? 'text-destructive' : ''}`}>
                          {circuit.Calculated_Straight_Distance.toFixed(2)} km
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-border/30">
                        <span className="text-muted-foreground">dc (constante):</span>
                        <span className="font-medium">{DC_CURVE_DISTANCE} km</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredCircuits.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center">
            <Flag className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              {search ? 'No se encontraron circuitos' : 'No hay circuitos registrados'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search 
                ? `No hay circuitos que coincidan con "${search}"` 
                : 'Comienza creando tu primer circuito'}
            </p>
            {!search && (
              <Button variant="racing" onClick={() => handleOpenModal()}>
                <Plus className="w-5 h-5 mr-2" />
                Crear Primer Circuito
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Crear/Editar Circuito */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold">
                {editingCircuit ? 'Editar Circuito' : 'Nuevo Circuito'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Circuito</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Circuito de Mónaco"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="totalDistance">Distancia Total (km)</Label>
                <Input
                  id="totalDistance"
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.totalDistance}
                  onChange={(e) => setFormData({ ...formData, totalDistance: e.target.value })}
                  placeholder="Ej: 5.891"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="numberOfCurves">Número de Curvas</Label>
                <Input
                  id="numberOfCurves"
                  type="number"
                  min="0"
                  value={formData.numberOfCurves}
                  onChange={(e) => setFormData({ ...formData, numberOfCurves: e.target.value })}
                  placeholder="Ej: 18"
                  required
                  className="mt-1"
                />
              </div>

              {/* Preview de cálculos - SOLO si hay valores válidos */}
              {formData.totalDistance && formData.numberOfCurves && 
               !isNaN(parseFloat(formData.totalDistance)) && 
               !isNaN(parseInt(formData.numberOfCurves)) && (
                <div className="p-3 rounded-lg bg-muted/30 text-xs">
                  <p className="font-medium mb-2">Vista previa (dc = {DC_CURVE_DISTANCE} km):</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dist. Curvas:</span>
                      <span>{(parseInt(formData.numberOfCurves) * DC_CURVE_DISTANCE).toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dist. Rectas:</span>
                      <span className={
                        (parseFloat(formData.totalDistance) - (parseInt(formData.numberOfCurves) * DC_CURVE_DISTANCE)) < 0 
                          ? 'text-destructive font-bold' 
                          : ''
                      }>
                        {(parseFloat(formData.totalDistance) - (parseInt(formData.numberOfCurves) * DC_CURVE_DISTANCE)).toFixed(2)} km
                      </span>
                    </div>
                  </div>
                  {(parseFloat(formData.totalDistance) - (parseInt(formData.numberOfCurves) * DC_CURVE_DISTANCE)) < 0 && (
                    <p className="text-destructive text-xs mt-2">
                      ⚠️ Error: Las curvas ocupan más distancia que el total del circuito
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="racing"
                  className="flex-1"
                >
                  {editingCircuit ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Circuits;
