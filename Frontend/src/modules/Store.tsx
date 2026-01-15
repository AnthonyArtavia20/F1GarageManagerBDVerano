import { useState, useEffect } from "react";
import { 
  TextSearch, Search, ShoppingCart, Zap, Wind, CircleDot, 
  Cog, Settings2, Filter, Plus, DollarSign, BarChart3 
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090';

// Definir tipos
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
  
  // Estado para el modal de nueva parte
  const [showAddPart, setShowAddPart] = useState(false);
  const [newPart, setNewPart] = useState({
    name: '',
    category: 'Power_Unit',
    price: '',
    stock: '',
    p: '5',
    a: '5',
    m: '5'
  });
  const [addingPart, setAddingPart] = useState(false);

  // Cargar partes al iniciar
  useEffect(() => {
    fetchParts();
  }, []);

  // Función para obtener partes del backend
  const fetchParts = async () => {
  try {
    setLoading(true);
    const response = await fetch(`${API_URL}/api/parts`); // ← Ruta correcta
    const data = await response.json();
    
    if (data.success) {
      setParts(data.data);
      setError(null);
    } else {
      setError(data.message);
    }
  } catch (err: any) {
    setError('Error al cargar partes: ' + err.message);
  } finally {
    setLoading(false);
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
      m: parseInt(newPart.m)
    };

    const response = await fetch(`${API_URL}/api/parts`, { // ← Ruta correcta
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(partData)
    });

    const data = await response.json();
    
    if (data.success) {
      alert('Parte creada exitosamente');
      setNewPart({
        name: '',
        category: 'Power_Unit',
        price: '',
        stock: '',
        p: '5',
        a: '5',
        m: '5'
      });
      setShowAddPart(false);
      fetchParts();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err: any) {
    alert('Error al crear parte: ' + err.message);
  } finally {
    setAddingPart(false);
  }
};

  // Filtrar partes
  const filteredParts = parts.filter((part) => {
    const matchesSearch = part.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || part.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.id === category);
    return cat?.icon || Settings2;
  };

  return (
    <MainLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Parts Store
            </h1>
            <p className="text-muted-foreground">
              Car parts catalog - Add, view and manage parts
            </p>
          </div>
          <div>
            <Dialog open={showAddPart} onOpenChange={setShowAddPart}>
              <DialogTrigger asChild>
                <Button variant="racing" size="lg">
                  <Plus className="w-5 h-5" />
                  ADD NEW PART
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
                    {/* Nombre */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        value={newPart.name}
                        onChange={(e) => setNewPart({...newPart, name: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., Turbo V6 Power Unit"
                        required
                      />
                    </div>

                    {/* Categoría */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">
                        Category *
                      </Label>
                      <Select 
                        value={newPart.category} 
                        onValueChange={(value) => setNewPart({...newPart, category: value})}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.id !== 'all').map(category => (
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

                    {/* Precio y Stock */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                          Price *
                        </Label>
                        <div className="col-span-3 relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={newPart.price}
                            onChange={(e) => setNewPart({...newPart, price: e.target.value})}
                            className="pl-9"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stock" className="text-right">
                          Stock *
                        </Label>
                        <Input
                          id="stock"
                          type="number"
                          min="0"
                          value={newPart.stock}
                          onChange={(e) => setNewPart({...newPart, stock: e.target.value})}
                          className="col-span-3"
                          placeholder="Quantity"
                          required
                        />
                      </div>
                    </div>

                    {/* Estadísticas p/a/m */}
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
                            onChange={(e) => setNewPart({...newPart, p: e.target.value})}
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
                            onChange={(e) => setNewPart({...newPart, a: e.target.value})}
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
                            onChange={(e) => setNewPart({...newPart, m: e.target.value})}
                            className="border-green-400/20 bg-green-500/5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={addingPart}>
                      {addingPart ? 'Creating...' : 'Create Part'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddPart(false)}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 bg-red-500/10 border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative flex-1 max-w-md opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search part..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <div className="flex gap-2 flex-wrap opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "gap-2",
                  selectedCategory === category.id && "shadow-glow"
                )}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground">Loading parts...</p>
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <Settings2 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No parts found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowAddPart(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Part
            </Button>
          </div>
        ) : (
          /* Parts Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredParts.map((part, index) => {
              const CategoryIcon = getCategoryIcon(part.category);
              return (
                <div
                  key={part.id}
                  className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in hover:border-primary/50 transition-all duration-300 group"
                  style={{ animationDelay: `${200 + index * 50}ms` }}
                >
                  <div className="p-6">

                    {/* Header */}
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

                    {/* Performance Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 rounded-lg bg-red-500/10">
                        <p className="text-xs text-foreground">Power</p>
                        <p className="font-display font-bold text-red-400">{part.p}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-blue-500/10">
                        <p className="text-xs text-foreground">Aerodynamics</p>
                        <p className="font-display font-bold text-blue-400">{part.a}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-green-500/10">
                        <p className="text-xs text-foreground">Driving</p>
                        <p className="font-display font-bold text-green-400">{part.m}</p>
                      </div>
                    </div>

                    {/* Price & Stock */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <p className="font-display font-bold text-lg text-foreground">
                          ${(part.price).toLocaleString()}
                        </p>
                        <p className={cn(
                          "text-xs",
                          part.stock > 10 ? "text-success" : part.stock > 0 ? "text-warning" : "text-destructive"
                        )}>
                          {part.stock} in stock
                        </p>
                      </div>
                      <Button
                        variant="racing"
                        size="sm"
                        disabled={part.stock === 0}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        PURCHASE
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Store;