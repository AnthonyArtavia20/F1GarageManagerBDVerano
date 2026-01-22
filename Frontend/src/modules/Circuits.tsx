import { useState } from "react";
import { Plus, Search, Flag, MapPin, Route, CornerDownRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const circuitsData = [
  {
    id: 1,
    name: "Circuito de Mónaco",
    country: "Mónaco",
    city: "Monte Carlo",
    distance: 3.337,
    curves: 19,
    lapRecord: "1:12.909",
    recordHolder: "Lewis Hamilton",
  },
  {
    id: 2,
    name: "Silverstone Circuit",
    country: "Reino Unido",
    city: "Silverstone",
    distance: 5.891,
    curves: 18,
    lapRecord: "1:27.097",
    recordHolder: "Max Verstappen",
  },
  {
    id: 3,
    name: "Circuito de Spa-Francorchamps",
    country: "Bélgica",
    city: "Stavelot",
    distance: 7.004,
    curves: 20,
    lapRecord: "1:46.286",
    recordHolder: "Valtteri Bottas",
  },
  {
    id: 4,
    name: "Suzuka International Racing Course",
    country: "Japón",
    city: "Suzuka",
    distance: 5.807,
    curves: 18,
    lapRecord: "1:30.983",
    recordHolder: "Lewis Hamilton",
  },
  {
    id: 5,
    name: "Autodromo Nazionale Monza",
    country: "Italia",
    city: "Monza",
    distance: 5.793,
    curves: 11,
    lapRecord: "1:21.046",
    recordHolder: "Rubens Barrichello",
  },
  {
    id: 6,
    name: "Circuit of the Americas",
    country: "Estados Unidos",
    city: "Austin",
    distance: 5.513,
    curves: 20,
    lapRecord: "1:36.169",
    recordHolder: "Charles Leclerc",
  },
];

const Circuits = () => {
  const [search, setSearch] = useState("");

  const filteredCircuits = circuitsData.filter((circuit) =>
    circuit.name.toLowerCase().includes(search.toLowerCase()) ||
    circuit.country.toLowerCase().includes(search.toLowerCase())
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
              Catálogo de circuitos disponibles para simulación
            </p>
          </div>
          <Button variant="racing" size="lg">
            <Plus className="w-5 h-5" />
            Nuevo Circuito
          </Button>
        </div>

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

        {/* Circuits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCircuits.map((circuit, index) => (
            <div
              key={circuit.id}
              className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in hover:border-primary/50 transition-all duration-300 group"
              style={{ animationDelay: `${150 + index * 50}ms` }}
            >
              {/* Header with gradient */}
              <div className="h-24 bg-gradient-to-br from-primary/20 to-transparent relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Flag className="w-12 h-12 text-primary/50" />
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                    {circuit.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {circuit.city}, {circuit.country}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Route className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Distancia</span>
                    </div>
                    <p className="font-display font-bold text-foreground">
                      {circuit.distance} km
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center gap-2 mb-1">
                      <CornerDownRight className="w-4 h-4 text-warning" />
                      <span className="text-xs text-muted-foreground">Curvas</span>
                    </div>
                    <p className="font-display font-bold text-foreground">
                      {circuit.curves}
                    </p>
                  </div>
                </div>

                {/* Lap Record */}
                <div className="p-3 rounded-lg bg-f1-gold/10 border border-f1-gold/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Récord de Vuelta</p>
                      <p className="font-display font-bold text-f1-gold">{circuit.lapRecord}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Por</p>
                      <p className="text-sm text-foreground">{circuit.recordHolder}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Circuits;
