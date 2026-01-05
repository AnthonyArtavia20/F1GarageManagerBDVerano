import { useState } from "react";
import { TextSearch, Search, ShoppingCart, Zap, Wind, CircleDot, Cog, Settings2, Filter } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", name: "All", icon: TextSearch },
  { id: "power_unit", name: "Power Unit", icon: Zap },
  { id: "aero", name: "Aerodynamics", icon: Wind },
  { id: "tires", name: "Tires", icon: CircleDot },
  { id: "suspension", name: "Suspension", icon: Cog },
  { id: "gearbox", name: "Gearbox", icon: Settings2 },
];

const partsData = [
  {
    id: 1,
    name: "[Part's Name]",
    category: "power_unit",
    price: 0,
    stock: 0,
    p: 10, a: 10, m: 10,
  },
];

const Store = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredParts = partsData.filter((part) => {
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
              Car parts catalog
            </p>
          </div>
        </div>

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

        {/* Parts Grid */}
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
                        ${(part.price / 1000000).toFixed(2)}M
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
      </div>
    </MainLayout>
  );
};

export default Store;
