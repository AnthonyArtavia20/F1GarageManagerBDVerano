import { useEffect, useState } from "react";
import { Plus, Search, Users, Car, DollarSign, Edit, Trash2, X } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import axios from "@/lib/axios";

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
  {
    id: "TEST-001",
    name: "Red Bull Racing",
    budget: 15000000,
    cars: 2,
    drivers: ["Max Verstappen", "Sergio Pérez"],
    color: "#0600EF",
    logo: "RB",
  },
];

interface Driver {
  User_id: number;
  name: string;
  team: string;
  skill: number;
}

const Teams = () => {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  // Driver selectors removed — assignment will be optional
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignDriversLater, setAssignDriversLater] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await axios.get("/drivers");
      console.log("Drivers response:", res.data);
      
      // Handle both array and object responses
      let driversData = Array.isArray(res.data) ? res.data : res.data.data || res.data.recordset || [];

      // Normalize shape so options have consistent keys
      const normalized = driversData.map((d: any) => ({
        User_id: d.User_id ?? d.id ?? d.UserId ?? d.user_id ?? null,
        Username: d.Username ?? d.name ?? d.Name ?? d.username ?? '',
        H: d.H ?? d.skill ?? d.h ?? 0,
      }));

      setDrivers(normalized);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setDrivers([]);
    }
  };

  const handleCreateTeam = async () => {
    setError("");
    setSuccess("");

    console.log("Form data:", { teamName, assignDriversLater });

    // Validation
    if (!teamName.trim()) {
      setError("Team name is required");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        teamName: teamName.trim(),
      };
      // If you ever want to support assigning now, add driver ids to payload
      console.log("Sending payload:", payload);
      
      const response = await axios.post("/teams", payload);
      console.log("Response:", response.data);

      setSuccess("Team created successfully!");
      setTimeout(() => {
        setShowForm(false);
        setTeamName("");
        setAssignDriversLater(true);
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      console.error("Error details:", err.response?.data);
      setError(err.response?.data?.message || "Error creating team");
    } finally {
      setLoading(false);
    }
  };

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
          <Button 
            onClick={() => setShowForm(!showForm)}
            variant="racing" 
            size="lg"
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-5 h-5" />
            ADD TEAM
          </Button>
        </div>

        {/* Create Team Form Card (ADMIN) */}
        {showForm && (
          <div className="glass-card p-8 mb-8 rounded-xl border border-primary/20 opacity-0 animate-fade-in">
            {/* Card Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create New Team</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form Content */}
            <div className="space-y-6">
              {/* Team Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Team Name *
                </label>
                <Input
                  type="text"
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={loading}
                  className="text-white"
                />
              </div>

              {/* Assign Drivers Option */}
              <div className="flex items-center gap-3">
                <input
                  id="assignLater"
                  type="checkbox"
                  checked={assignDriversLater}
                  onChange={(e) => setAssignDriversLater(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="assignLater" className="text-sm">
                  Assign drivers later (no drivers will be assigned now)
                </label>
              </div>
              
              <p className="text-xs text-muted-foreground">Note: driver assignment can be done later from the team details.</p>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-300 text-sm">
                  ✅ {success}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleCreateTeam}
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2"
                >
                  {loading ? "Creating..." : "Create Team"}
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                    setSuccess("");
                  }}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

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
