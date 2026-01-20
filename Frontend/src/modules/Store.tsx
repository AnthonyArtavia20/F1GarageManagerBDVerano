import { useState, useEffect } from "react";
import {
  TextSearch, Search, ShoppingCart, Zap, Wind, CircleDot,
  Cog, Settings2, Plus, DollarSign, BarChart3, Wallet, TrendingUp,
  CreditCard, Package, Users, Filter
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TeamSelector } from "@/components/TeamSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9090";

// ===== Tipos =====
interface Part {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  p: number;
  a: number;
  m: number;
}

interface TeamBudget {
  teamId: number;
  teamName: string;
  totalBudget: number;
  totalSpent: number;
  availableBudget: number;
  totalContributions: number;
  totalPurchases: number;
}

type MeResponse = {
  success: boolean;
  user?: {
    id: number;
    username: string;
    role: "admin" | "engineer" | "driver";
    teamId: number | null;
    teamName: string | null;
  };
  message?: string;
};

const categories = [
  { id: "all", name: "All", icon: TextSearch },
  { id: "Power_Unit", name: "Power Unit", icon: Zap },
  { id: "Aerodynamics_pkg", name: "Aerodynamics", icon: Wind },
  { id: "Wheels", name: "Wheels", icon: CircleDot },
  { id: "Suspension", name: "Suspension", icon: Cog },
  { id: "Gearbox", name: "Gearbox", icon: Settings2 },
];

const Store = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sesión
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // Modal nueva parte
  const [showAddPart, setShowAddPart] = useState(false);
  const [newPart, setNewPart] = useState({
    name: "",
    category: "Power_Unit",
    price: "",
    stock: "",
    p: "5",
    a: "5",
    m: "5",
  });
  const [addingPart, setAddingPart] = useState(false);

  // Equipo seleccionado (admin puede cambiar; engineer/driver fijo)
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedTeamName, setSelectedTeamName] = useState<string>("");
  const [teamBudget, setTeamBudget] = useState<TeamBudget | null>(null);
  const [loadingBudget, setLoadingBudget] = useState(false);

  // ===== 1) Cargar sesión =====
  useEffect(() => {
    (async () => {
      setLoadingMe(true);
      const { res, data } = await apiFetch<MeResponse>("/api/auth/me");
      if (!res.ok || !data.success || !data.user) {
        setMe(null);
        setLoadingMe(false);
        // si quieres, aquí puedes navegar a "/" si no hay sesión
        return;
      }

      setMe(data.user);

      // ✅ Si NO es admin → equipo fijo desde la BD
      if (data.user.role !== "admin") {
        const tid = data.user.teamId ? String(data.user.teamId) : "";
        const tname = data.user.teamName ?? "";
        setSelectedTeamId(tid);
        setSelectedTeamName(tname);
      }

      setLoadingMe(false);
    })();
  }, []);

  // ===== 2) Cargar partes =====
  useEffect(() => {
    fetchParts();
  }, []);

  // ===== 3) Cargar presupuesto al tener teamId =====
  useEffect(() => {
    if (selectedTeamId && selectedTeamId.trim() !== "") fetchTeamBudget(selectedTeamId);
    else setTeamBudget(null);
  }, [selectedTeamId]);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/parts`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("El servidor no devolvió JSON");
      }
      const data = await response.json();
      if (data.success) {
        setParts(data.data);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      console.error("Error al cargar partes:", err);
      setError("Error al cargar partes: " + err.message);

      // fallback dev
      setParts([
        { id: 1, name: "Turbo V6 Power Unit", category: "Power_Unit", price: 1000000, stock: 5, p: 9, a: 3, m: 4 },
        { id: 2, name: "Advanced Aero Package", category: "Aerodynamics_pkg", price: 500000, stock: 8, p: 2, a: 9, m: 4 },
        { id: 3, name: "Performance Wheels Set", category: "Wheels", price: 200000, stock: 15, p: 3, a: 4, m: 8 },
        { id: 4, name: "Race Suspension System", category: "Suspension", price: 300000, stock: 10, p: 2, a: 5, m: 9 },
        { id: 5, name: "8-Speed Gearbox", category: "Gearbox", price: 400000, stock: 7, p: 4, a: 3, m: 7 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamBudget = async (teamId: string) => {
    try {
      setLoadingBudget(true);
      const response = await fetch(`${API_URL}/api/sponsors/budget/${teamId}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("El servidor no devolvió JSON");
      }
      const data = await response.json();
      if (data.success) {
        setTeamBudget(data.data);
      } else {
        setTeamBudget({
          teamId: parseInt(teamId),
          teamName: selectedTeamName || `Team ${teamId}`,
          totalBudget: 2500000,
          totalSpent: 750000,
          availableBudget: 1750000,
          totalContributions: 5,
          totalPurchases: 8,
        });
      }
    } catch (err: any) {
      console.error("Error al cargar presupuesto:", err);
      setTeamBudget({
        teamId: parseInt(teamId),
        teamName: selectedTeamName || `Team ${teamId}`,
        totalBudget: 2500000,
        totalSpent: 750000,
        availableBudget: 1750000,
        totalContributions: 5,
        totalPurchases: 8,
      });
    } finally {
      setLoadingBudget(false);
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddingPart(true);

      const partData = {
        Category: newPart.category,
        Name: newPart.name,
        Price: parseFloat(newPart.price),
        Stock: parseInt(newPart.stock),
        p: parseInt(newPart.p),
        a: parseInt(newPart.a),
        m: parseInt(newPart.m),
      };

      const response = await fetch(`${API_URL}/api/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Parte creada exitosamente");
        setNewPart({ name: "", category: "Power_Unit", price: "", stock: "", p: "5", a: "5", m: "5" });
        setShowAddPart(false);
        fetchParts();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err: any) {
      alert("Error al crear parte: " + err.message);
    } finally {
      setAddingPart(false);
    }
  };

  const handlePurchasePart = async (part: Part) => {
    if (!selectedTeamId || selectedTeamId.trim() === "") {
      alert("No team assigned");
      return;
    }

    if (part.stock === 0) {
      alert("Esta parte no tiene stock disponible");
      return;
    }

    if (teamBudget && teamBudget.availableBudget < part.price) {
      alert(
        `Presupuesto insuficiente. Disponible: $${teamBudget.availableBudget.toLocaleString()}\nNecesario: $${part.price.toLocaleString()}`
      );
      return;
    }

    const confirmPurchase = window.confirm(
      `¿Confirmar compra de "${part.name}"?\n\n` +
        `Detalles:\n` +
        `• Precio: $${part.price.toLocaleString()}\n` +
        `• Equipo: ${selectedTeamName}\n` +
        `• Presupuesto disponible: $${teamBudget?.availableBudget.toLocaleString()}\n\n` +
        `¿Deseas continuar?`
    );

    if (!confirmPurchase) return;

    try {
      const response = await fetch(`${API_URL}/api/parts/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: parseInt(selectedTeamId),
          partId: part.id,
          userId: me?.id ?? 1, // ✅ usa el usuario real si existe
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `Compra realizada exitosamente!\n\n` +
            `${data.message}\n\n` +
            `"${part.name}" ha sido agregado al inventario de ${data.data.teamName}.\n` +
            `Nuevo presupuesto disponible: $${data.data.newAvailableBudget.toLocaleString()}`
        );

        if (teamBudget) {
          setTeamBudget({
            ...teamBudget,
            totalSpent: data.data.totalSpent,
            availableBudget: data.data.newAvailableBudget,
            totalPurchases: teamBudget.totalPurchases + 1,
          });
        }

        setParts((prevParts) =>
          prevParts.map((p) => (p.id === part.id ? { ...p, stock: data.data.currentStock } : p))
        );

        await fetchTeamBudget(selectedTeamId);
        await fetchParts();
      } else {
        alert(`❌ Error en la compra:\n${data.message}`);
        if (data.data?.newAvailableBudget && teamBudget) {
          setTeamBudget({ ...teamBudget, availableBudget: data.data.newAvailableBudget });
        }
      }
    } catch (err: any) {
      console.error("Error en la compra:", err);
      alert("Error al procesar la compra: " + err.message);
    }
  };

  const filteredParts = parts.filter((part) => {
    const matchesSearch = part.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || part.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.id === category);
    return cat?.icon || Settings2;
  };

  // ✅ si todavía no cargó /me, evita parpadeos raros
  if (loadingMe) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="glass-card rounded-xl p-6">
            <p className="text-muted-foreground">Loading session...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isAdmin = me?.role === "admin";
  const isEngineer = me?.role === "engineer";

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Parts Store</h1>
            <p className="text-muted-foreground">Browse, purchase and manage car parts for your team</p>
          </div>
        </div>

        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 bg-red-500/10 border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-foreground">Search & Filter Parts</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search parts by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-foreground">Add New Part</h3>
                </div>

                {/* Si quieres: solo admin puede crear partes */}
                <Dialog open={showAddPart} onOpenChange={setShowAddPart}>
                  <DialogTrigger asChild>
                    <Button variant="racing" size="lg" disabled={!isAdmin}>
                      <Plus className="w-5 h-5" />
                      NEW PART
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Part to Store</DialogTitle>
                      <DialogDescription>
                        Create a new part that will be available for purchase in the store.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddPart}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">Name *</Label>
                          <Input
                            id="name"
                            value={newPart.name}
                            onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                            className="col-span-3"
                            placeholder="e.g., Turbo V6 Power Unit"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="category" className="text-right">Category *</Label>
                          <Select
                            value={newPart.category}
                            onValueChange={(value) => setNewPart({ ...newPart, category: value })}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.filter((c) => c.id !== "all").map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center gap-2">
                                    <category.icon className="w-4 h-4" />
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Price *</Label>
                            <div className="col-span-3 relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={newPart.price}
                                onChange={(e) => setNewPart({ ...newPart, price: e.target.value })}
                                className="pl-9"
                                placeholder="0.00"
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stock" className="text-right">Stock *</Label>
                            <Input
                              id="stock"
                              type="number"
                              min="0"
                              value={newPart.stock}
                              onChange={(e) => setNewPart({ ...newPart, stock: e.target.value })}
                              className="col-span-3"
                              placeholder="Quantity"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Performance Stats (0-9)
                          </Label>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="p" className="text-red-400">Power (p)</Label>
                              <Input
                                id="p"
                                type="number"
                                min="0"
                                max="9"
                                value={newPart.p}
                                onChange={(e) => setNewPart({ ...newPart, p: e.target.value })}
                                className="border-red-400/20 bg-red-500/5"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="a" className="text-blue-400">Aero (a)</Label>
                              <Input
                                id="a"
                                type="number"
                                min="0"
                                max="9"
                                value={newPart.a}
                                onChange={(e) => setNewPart({ ...newPart, a: e.target.value })}
                                className="border-blue-400/20 bg-blue-500/5"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="m" className="text-green-400">Maneuver (m)</Label>
                              <Input
                                id="m"
                                type="number"
                                min="0"
                                max="9"
                                value={newPart.m}
                                onChange={(e) => setNewPart({ ...newPart, m: e.target.value })}
                                className="border-green-400/20 bg-green-500/5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="submit" disabled={addingPart || !isAdmin}>
                          {addingPart ? "Creating..." : "Create Part"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddPart(false)}>
                          Cancel
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Filter by category:</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn("gap-2", selectedCategory === category.id && "shadow-glow")}
                  >
                    <category.icon className="w-4 h-4" />
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Equipo */}
          <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h3 className="font-display font-semibold text-foreground">
                {isAdmin ? "Select Purchasing Team" : "Team Assigned"}
              </h3>
            </div>

            <div className="space-y-4">
              {/* ✅ Admin puede seleccionar, engineer/driver NO */}
              {isAdmin ? (
                <TeamSelector
                  value={selectedTeamId}
                  onChange={(teamId, teamName) => {
                    setSelectedTeamId(teamId);
                    setSelectedTeamName(teamName);
                  }}
                  placeholder="Search and select team..."
                />
              ) : (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Selected Team</p>
                      <p className="font-display font-bold text-primary">
                        {selectedTeamName || "No team assigned"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!selectedTeamId && (
                <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-warning" />
                    <p className="text-sm text-warning">
                      {isAdmin
                        ? "Select a team to view budget and make purchases"
                        : "No team assigned in DB"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Presupuesto */}
        {selectedTeamId && (
          <div className="glass-card rounded-xl p-6 mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-7 h-7 text-primary" />
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Team Budget Overview</h2>
                <p className="text-sm text-muted-foreground">Financial status for {selectedTeamName}</p>
              </div>
            </div>

            {loadingBudget ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading budget information...</p>
              </div>
            ) : teamBudget ? (
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget Utilization</p>
                      <p className="font-display font-bold text-foreground">
                        {teamBudget.totalBudget > 0
                          ? `${((teamBudget.totalSpent / teamBudget.totalBudget) * 100).toFixed(1)}% Utilized`
                          : "0% Utilized"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="font-display font-bold text-primary">
                        ${teamBudget.availableBudget.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000"
                      style={{
                        width:
                          teamBudget.totalBudget > 0
                            ? `${Math.min((teamBudget.totalSpent / teamBudget.totalBudget) * 100, 100)}%`
                            : "0%",
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <span>${teamBudget.totalBudget.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Budget</p>
                        <p className="font-display font-bold text-success text-lg">
                          ${teamBudget.totalBudget.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                        <p className="font-display font-bold text-red-400 text-lg">
                          ${teamBudget.totalSpent.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Available</p>
                        <p className="font-display font-bold text-primary text-lg">
                          ${teamBudget.availableBudget.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No budget information available for this team.</p>
            )}
          </div>
        )}

        {/* Grid de partes */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">Available Parts</h3>
              <p className="text-sm text-muted-foreground">
                {filteredParts.length} parts found
                {selectedCategory !== "all" && ` in ${categories.find((c) => c.id === selectedCategory)?.name}`}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedTeamId ? `Purchasing for: ${selectedTeamName}` : "No team assigned"}
            </div>
          </div>

          {loading ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading parts catalog...</p>
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <Settings2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-display font-semibold text-foreground mb-2">No Parts Found</h4>
              <p className="text-muted-foreground mb-4">{search ? `No parts match "${search}"` : "No parts available in the store"}</p>
              <Button variant="outline" onClick={() => setShowAddPart(true)} disabled={!isAdmin}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Part
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredParts.map((part, index) => {
                const CategoryIcon = getCategoryIcon(part.category);
                const canPurchase =
                  selectedTeamId && teamBudget && part.stock > 0 && teamBudget.availableBudget >= part.price;

                return (
                  <div
                    key={part.id}
                    className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in hover:border-primary/50 transition-all duration-300 group"
                    style={{ animationDelay: `${250 + index * 50}ms` }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <CategoryIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{part.name}</h3>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {categories.find((c) => c.id === part.category)?.name}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 rounded-lg bg-red-500/10">
                          <p className="text-xs text-foreground">Power</p>
                          <p className="font-display font-bold text-red-400 text-lg">{part.p}</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-blue-500/10">
                          <p className="text-xs text-foreground">Aerodynamics</p>
                          <p className="font-display font-bold text-blue-400 text-lg">{part.a}</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-500/10">
                          <p className="text-xs text-foreground">Maneuverability</p>
                          <p className="font-display font-bold text-green-400 text-lg">{part.m}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div>
                          <p className="font-display font-bold text-xl text-foreground">
                            ${part.price.toLocaleString()}
                          </p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              part.stock > 10 ? "text-success" : part.stock > 0 ? "text-warning" : "text-destructive"
                            )}
                          >
                            {part.stock} units in stock
                          </p>
                        </div>

                        <Button
                          variant={canPurchase ? "racing" : "outline"}
                          size="default"
                          disabled={!canPurchase}
                          onClick={() => handlePurchasePart(part)}
                          className="min-w-[120px]"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {canPurchase ? "PURCHASE" : "NO ACCESS"}
                        </Button>
                      </div>

                      {/* Nota: engineer puede comprar SOLO para su team (ya está forzado por selectedTeamId fijo) */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Si quieres mostrar algo del rol */}
        {isEngineer && (
          <div className="mt-8 text-sm text-muted-foreground">
            Engineer mode: team locked to DB assignment.
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Store;
