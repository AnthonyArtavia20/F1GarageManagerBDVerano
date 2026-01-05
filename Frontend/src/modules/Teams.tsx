import { useState } from "react";
import { Plus, Search, Users, Car, DollarSign, Edit, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Team information 

const teamsData = [
  {
    id: " [Team's ID] ",
    name: "[Team's Name]",
    budget: 0,
    cars: 2,
    drivers: ["[Driver_1]", "[Driver_2]"],
    color: "#1E41FF",
    logo: "•_•",
  },
];

const Teams = () => {
  const [search, setSearch] = useState("");

  const filteredTeams = teamsData.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Teams Management
            </h1>
            <p className="text-muted-foreground">
              Administration and visualization of available teams in the system
            </p>
          </div>
          <Button variant="racing" size="lg">
            <Plus className="w-5 h-5" />
            ADD TEAM
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTeams.map((team, index) => (
            <div
              key={team.id}
              className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in hover:border-primary/50 transition-all duration-300 group"
              style={{ animationDelay: `${150 + index * 50}ms` }}
            >
              {/* Color Strip */}
              <div
                className="h-2"
                style={{ backgroundColor: team.color }}
              />
              
              <div className="p-6">

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-lg"
                      style={{ backgroundColor: `${team.color}20`, color: team.color }}
                    >
                      {team.logo}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">
                        {team.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{team.id}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <DollarSign className="w-4 h-4 text-success mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-medium text-foreground text-sm">
                      ${(team.budget / 1000000).toFixed(0)}M
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <Car className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Cars</p>
                    <p className="font-medium text-foreground text-sm">{team.cars}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <Users className="w-4 h-4 text-warning mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Drivers</p>
                    <p className="font-medium text-foreground text-sm">{team.drivers.length}</p>
                  </div>
                </div>

                {/* Drivers */}
                <div className="mt-15 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Drivers</p>
                  <div className="flex flex-wrap gap-2">
                    {team.drivers.map((driver) => (
                      <span
                        key={driver}
                        className="px-3 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                      >
                        {driver}
                      </span>
                    ))}
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

export default Teams;
