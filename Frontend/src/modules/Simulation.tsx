import { useState } from "react";
import { Play, Trophy, Clock, Gauge, Timer, Flag, Car, Users } from "lucide-react";
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

const circuits = [
  { id: "1", name: "Circuito de Mónaco", distance: 3.337, curves: 19 },
  { id: "2", name: "Silverstone Circuit", distance: 5.891, curves: 18 },
  { id: "3", name: "Spa-Francorchamps", distance: 7.004, curves: 20 },
];

const availableCars = [
  { id: "1", name: "RB19-01", team: "Red Bull Racing", driver: "Max Verstappen", P: 21, A: 24, M: 33, H: 98, color: "#1E41FF" },
  { id: "2", name: "SF-24-01", team: "Scuderia Ferrari", driver: "Charles Leclerc", P: 19, A: 26, M: 30, H: 92, color: "#E10600" },
  { id: "3", name: "W15-01", team: "Mercedes AMG", driver: "Lewis Hamilton", P: 20, A: 25, M: 31, H: 95, color: "#00D2BE" },
  { id: "4", name: "MCL38-01", team: "McLaren F1", driver: "Lando Norris", P: 18, A: 23, M: 32, H: 89, color: "#FF8700" },
];

interface SimulationResult {
  carId: string;
  position: number;
  timeSeconds: number;
  vRecta: number;
  vCurva: number;
  penalization: number;
}

const Simulation = () => {
  const [selectedCircuit, setSelectedCircuit] = useState("");
  const [selectedCars, setSelectedCars] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);

  const circuit = circuits.find(c => c.id === selectedCircuit);
  const dc = 0.2; // Constante de distancia de curva en km

  const toggleCarSelection = (carId: string) => {
    setSelectedCars(prev =>
      prev.includes(carId)
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    );
  };

  const runSimulation = () => {
    if (!circuit || selectedCars.length === 0) return;

    setIsSimulating(true);

    // Simulate after a delay for effect
    setTimeout(() => {
      const D = circuit.distance;
      const C = circuit.curves;
      const Dcurvas = C * dc;
      const Drectas = D - Dcurvas;

      const simResults: SimulationResult[] = selectedCars.map(carId => {
        const car = availableCars.find(c => c.id === carId)!;
        const { P, A, M, H } = car;

        const vRecta = 200 + 3 * P + 0.2 * H - 1 * A;
        const vCurva = 90 + 2 * A + 2 * M + 0.2 * H;
        const penalization = (C * 40) / (1 + H / 100);
        const tiempoHoras = (Drectas / vRecta) + (Dcurvas / vCurva);
        const timeSeconds = tiempoHoras * 3600 + penalization;

        return {
          carId,
          position: 0,
          timeSeconds,
          vRecta,
          vCurva,
          penalization,
        };
      });

      // Sort by time and assign positions
      simResults.sort((a, b) => a.timeSeconds - b.timeSeconds);
      simResults.forEach((r, i) => r.position = i + 1);

      setResults(simResults);
      setIsSimulating(false);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Simulación de Carreras
            </h1>
            <p className="text-muted-foreground">
              Ejecuta simulaciones y analiza resultados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Circuit Selection */}
            <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Flag className="w-5 h-5 text-primary" />
                Seleccionar Circuito
              </h2>
              <Select value={selectedCircuit} onValueChange={setSelectedCircuit}>
                <SelectTrigger className="bg-accent/50 border-border">
                  <SelectValue placeholder="Elige un circuito" />
                </SelectTrigger>
                <SelectContent>
                  {circuits.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.distance} km, {c.curves} curvas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {circuit && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-accent/50">
                    <p className="text-xs text-muted-foreground">Distancia Total</p>
                    <p className="font-display font-bold text-foreground">{circuit.distance} km</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/50">
                    <p className="text-xs text-muted-foreground">Curvas</p>
                    <p className="font-display font-bold text-foreground">{circuit.curves}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cars Selection */}
            <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                Seleccionar Carros ({selectedCars.length} seleccionados)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCars.map((car) => (
                  <div
                    key={car.id}
                    onClick={() => toggleCarSelection(car.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                      selectedCars.includes(car.id)
                        ? "border-primary bg-primary/10"
                        : "border-border bg-accent/30 hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-3 h-10 rounded-full"
                        style={{ backgroundColor: car.color }}
                      />
                      <div>
                        <p className="font-display font-semibold text-foreground">{car.name}</p>
                        <p className="text-sm text-muted-foreground">{car.team}</p>
                        <p className="text-xs text-muted-foreground">{car.driver}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">P: {car.P}</Badge>
                      <Badge variant="secondary" className="text-xs">A: {car.A}</Badge>
                      <Badge variant="secondary" className="text-xs">M: {car.M}</Badge>
                      <Badge variant="secondary" className="text-xs">H: {car.H}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simulation Panel */}
          <div className="space-y-6">
            {/* Run Button */}
            <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
              <Button
                variant="racing"
                size="xl"
                className="w-full"
                onClick={runSimulation}
                disabled={!selectedCircuit || selectedCars.length < 2 || isSimulating}
              >
                {isSimulating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Simulando...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Iniciar Simulación
                  </>
                )}
              </Button>
              {selectedCars.length < 2 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Selecciona al menos 2 carros
                </p>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-f1-gold" />
                  Resultados
                </h2>
                <div className="space-y-3">
                  {results.map((result) => {
                    const car = availableCars.find(c => c.id === result.carId)!;
                    return (
                      <div
                        key={result.carId}
                        className={cn(
                          "p-4 rounded-xl border",
                          result.position === 1 ? "bg-f1-gold/10 border-f1-gold/30" :
                          result.position === 2 ? "bg-f1-silver/10 border-f1-silver/30" :
                          result.position === 3 ? "bg-f1-bronze/10 border-f1-bronze/30" :
                          "bg-accent/30 border-border"
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-display font-bold",
                            result.position === 1 ? "bg-f1-gold text-background" :
                            result.position === 2 ? "bg-f1-silver text-background" :
                            result.position === 3 ? "bg-f1-bronze text-background" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {result.position}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{car.name}</p>
                            <p className="text-xs text-muted-foreground">{car.driver}</p>
                          </div>
                          <div
                            className="w-2 h-8 rounded-full"
                            style={{ backgroundColor: car.color }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 rounded bg-accent/50">
                            <p className="text-muted-foreground">Tiempo</p>
                            <p className="font-display font-bold text-foreground">
                              {formatTime(result.timeSeconds)}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-accent/50">
                            <p className="text-muted-foreground">V.Recta</p>
                            <p className="font-display font-bold text-foreground">
                              {result.vRecta.toFixed(1)}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-accent/50">
                            <p className="text-muted-foreground">V.Curva</p>
                            <p className="font-display font-bold text-foreground">
                              {result.vCurva.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Simulation;
