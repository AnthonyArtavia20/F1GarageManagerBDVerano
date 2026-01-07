import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Trophy, TrendingUp, Star } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Drivers data

const driversData = [
  {
    id: "ID",
    name: "[Driver's Name]",
    team: "[Driver's Team]",
    skill: 57,
    teamColor: "#1E41FF",
  },
];

const Drivers = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate(); 

  const filteredDrivers = driversData.filter((driver) =>
    driver.name.toLowerCase().includes(search.toLowerCase()) ||
    driver.team.toLowerCase().includes(search.toLowerCase())
  );

  const handleDriverClick = () => {
    navigate('/DriverProfile');
  };

  return (
    <MainLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Drivers Management
            </h1>
            <p className="text-muted-foreground">
              Visualization of available drivers in the system
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search Drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrivers.map((driver, index) => (
            <div
              key={driver.id}
              onClick={() => handleDriverClick()}
              className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in hover:border-primary/50 transition-all duration-300"
              style={{ animationDelay: `${150 + index * 50}ms` }}
            >
              <div className="p-6">

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center font-display font-bold text-2xl relative"
                      style={{ backgroundColor: `${driver.teamColor}20`, color: driver.teamColor }}
                    >
                      {driver.id}
                      <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card"
                        style={{ backgroundColor: driver.teamColor }}
                      />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg text-foreground">
                        {driver.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{driver.team}</p>
                    </div>
                  </div>
                </div>

                {/* Skill Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-display text-f1-gold">H</p>
                      <p className="text-ml font-display">Ability</p>
                    </div>
                    <span className="font-display font-bold text-foreground">{driver.skill}</span>
                  </div>
                  <div className="performance-bar">
                    <div
                      className="performance-bar-fill bg-gradient-to-r from-primary to-red-400"
                      style={{ width: `${driver.skill}%` }}
                    />
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

export default Drivers;
