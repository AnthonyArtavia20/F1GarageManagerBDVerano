import { useEffect, useState } from "react";
import { Plus, Search, Users, Car, DollarSign, Edit, Trash2, X } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import axios from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  User_id: number | null;
  id?: number | null;
  Username?: string;
  name?: string;
  team?: string;
  H?: number;
  skill?: number;
  Team_id?: number | null;
}

interface TeamCard {
  id: string;
  name: string;
  budget: number;
  cars: number;
  drivers: string[];
  color: string;
  logo: string;
}

interface SponsorContribution {
  Sponsor_id: number;
  SponsorName?: string;
  Name?: string;
  Amount: number;
  Date?: string;
  Description?: string;
}

interface InventoryItem {
  Part_id: number;
  Name: string;
  Category: string;
  Price: number;
  Stock: number;
}


const Teams = () => {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<TeamCard[]>(teamsData as TeamCard[]);
  const [assignDriversLater, setAssignDriversLater] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Team details modal
  const [selectedTeam, setSelectedTeam] = useState<TeamCard | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [teamContributions, setTeamContributions] = useState<SponsorContribution[]>([]);
  const [teamInventory, setTeamInventory] = useState<InventoryItem[]>([]);
  const [teamBudgetInfo, setTeamBudgetInfo] = useState<any>(null);


  const formatBudget = (b: number) => {
    try {
      const n = Number(b || 0);
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
    } catch (e) {
      return '$0';
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchTeamsFromServer();
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      if (detail.entity === 'drivers') {
        console.log('app:dataChange received: drivers updated', detail);
        fetchDrivers();
        if (typeof detail.teamId !== 'undefined') {
          fetchTeamsFromServer();
        }
      }
    };

    window.addEventListener('app:dataChange', handler as EventListener);
    return () => window.removeEventListener('app:dataChange', handler as EventListener);
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await axios.get("/drivers");
      console.log("Drivers response:", res.data);
      
      let driversData = Array.isArray(res.data) ? res.data : res.data.data || res.data.recordset || [];

      const normalized = driversData.map((d: any) => ({
        User_id: d.User_id ?? d.id ?? d.UserId ?? d.user_id ?? null,
        Username: d.Username ?? d.name ?? d.Name ?? d.username ?? '',
        H: d.H ?? d.skill ?? d.h ?? 0,
        Team_id: d.Team_id ?? d.TeamId ?? d.team_id ?? d.teamId ?? null,
      }));

      console.debug('Normalized drivers:', normalized);
      setDrivers(normalized);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setDrivers([]);
    }
  };

  const fetchTeamsFromServer = async () => {
    try {
      const res = await axios.get("/teams");
      console.log('Teams response:', res.data);
      let teamsResp = Array.isArray(res.data) ? res.data : res.data.data || res.data.recordset || [];

      const normalized = teamsResp.map((t: any, idx: number) => ({
        id: String(t.Team_id ?? t.id ?? `team-${Date.now()}-${idx}`),
        name: t.Name ?? t.name ?? "Unnamed Team",
        budget: Number(t.Available_Budget ?? t.Total_Budget ?? 0),
        cars: 0,
        drivers: [],
        color: ["#0600EF", "#1E41FF", "#FF6B6B", "#FFA500"][idx % 4],
        logo: (t.Name || t.name || "").split(" ").map((w: string) => w[0]).slice(0,2).join("") || "T",
      }));

      console.debug('Normalized teams:', normalized);
      setTeams(normalized.length ? normalized : teamsData as TeamCard[]);
    } catch (err) {
      console.error("Error fetching teams:", err);
      setTeams(teamsData as TeamCard[]);
    }
  };

  useEffect(() => {
    setTeams((prevTeams) => {
      if (!prevTeams || prevTeams.length === 0) {
        console.debug('Recompose: no teams to update yet');
        return prevTeams;
      }

      const newTeams = prevTeams.map((t) => {
        const assigned = (drivers || []).filter((d) => d.Team_id != null && String(d.Team_id) === String(t.id));
        console.debug(`Team ${t.name} (${t.id}) assignedCount: ${assigned.length}`);
        return {
          ...t,
          drivers: assigned.map((d) => d.Username || d.name || `#${d.User_id}`),
          cars: t.cars ?? 0,
          budget: t.budget ?? 0,
        } as TeamCard;
      });

      if (JSON.stringify(newTeams) !== JSON.stringify(prevTeams)) {
        console.debug('Recompose: teams updated', newTeams);
        return newTeams;
      }
      return prevTeams;
    });
  }, [drivers, teams]);


  const handleCreateTeam = async () => {
    setError("");
    setSuccess("");

    console.log("Form data:", { teamName, assignDriversLater });

    if (!teamName.trim()) {
      setError("Team name is required");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        teamName: teamName.trim(),
      };
      console.log("Sending payload:", payload);
      
      const response = await axios.post("/teams", payload);
      console.log("Response:", response.data);

      const newTeamId = response.data?.teamId ?? `team-${Date.now()}`;
      const newTeamCard: TeamCard = {
        id: String(newTeamId),
        name: teamName.trim(),
        budget: 0,
        cars: 0,
        drivers: [],
        color: '#1E41FF',
        logo: teamName.trim().split(' ').map((w) => w[0]).slice(0,2).join('') || 'T',
      };
      setTeams(prev => [newTeamCard, ...prev]);

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

  const openTeamDetails = async (team: TeamCard) => {
    setSelectedTeam(team);
    setIsDetailOpen(true);

    try {
      setDetailLoading(true);

      const teamId = parseInt(team.id);

      const [budgetRes, contributionsRes, inventoryRes] = await Promise.all([
        axios.get(`/sponsors/budget/${teamId}`),
        axios.get(`/sponsors/contributions/${teamId}`),
        axios.get(`/sp/team-inventory/${teamId}`),
      ]);

      console.debug('Team budget:', budgetRes.data);
      console.debug('Team contributions:', contributionsRes.data);
      console.debug('Team inventory:', inventoryRes.data);

      setTeamBudgetInfo(budgetRes.data?.data || null);
      setTeamContributions(Array.isArray(contributionsRes.data?.data) ? contributionsRes.data.data : contributionsRes.data || []);

      const invRaw = inventoryRes.data;
      console.debug('Raw inventory response:', invRaw);
      const invArray = Array.isArray(invRaw)
        ? invRaw
        : Array.isArray(invRaw?.data)
          ? invRaw.data
          : Array.isArray(invRaw?.records)
            ? invRaw.records
            : [];
      setTeamInventory(invArray);

    } catch (err) {
      console.error('Error fetching team details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeTeamDetails = () => {
    setIsDetailOpen(false);
    setSelectedTeam(null);
    setTeamContributions([]);
    setTeamInventory([]);
    setTeamBudgetInfo(null);
  };


  const filteredTeams = teams.filter((team) =>
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create New Team</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
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

              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-300 text-sm">
                  ✅ {success}
                </div>
              )}

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
              onClick={() => openTeamDetails(team)}
              role="button"
              tabIndex={0}
              className="glass-card rounded-xl overflow-hidden opacity-0 animate-fade-in hover:border-primary/50 transition-all duration-300 group cursor-pointer"
              style={{ animationDelay: `${150 + index * 50}ms` }}
            >
              <div
                className="h-2"
                style={{ backgroundColor: team.color }}
              />
              
              <div className="p-6">
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

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-accent/50">
                    <DollarSign className="w-4 h-4 text-success mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-medium text-foreground text-sm">
                      {formatBudget(team.budget)}
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

        {/* Team Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={(open) => { if (!open) closeTeamDetails(); setIsDetailOpen(open); }}>
          <DialogContent className="glass-card border-border max-w-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-foreground">
                {selectedTeam ? `${selectedTeam.name} — Details` : 'Team Details'}
              </DialogTitle>
            </DialogHeader>

            <div className="p-4">
              {detailLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm text-muted-foreground">Budget</h4>
                    <p className="font-bold text-foreground text-lg">
                      {teamBudgetInfo ? (
                        // Corregido: usar selectedTeam en lugar de `team` y protección por si es null
                        `${formatBudget(teamBudgetInfo.availableBudget ?? selectedTeam?.budget ?? 0)}`
                      ) : (
                        formatBudget(selectedTeam?.budget ?? 0)
                      )}
                    </p>

                    <div className="mt-4">
                      <h4 className="text-sm text-muted-foreground">Sponsors</h4>
                      {teamContributions.length === 0 ? (
                        <p className="text-muted-foreground">No sponsor contributions found</p>
                      ) : (
                        <ul className="space-y-2">
                          {teamContributions.map((c) => (
                            <li key={c.Sponsor_id} className="flex justify-between">
                              <span>{c.SponsorName || c.Name || `Sponsor ${c.Sponsor_id}`}</span>
                              <span className="font-medium">{formatBudget(c.Amount)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm text-muted-foreground">Drivers</h4>
                      <div className="flex flex-col gap-2">
                        {(drivers.filter((d) => String(d.Team_id) === String(selectedTeam?.id))).map((d) => (
                          <div key={d.User_id ?? d.id} className="flex items-center justify-between">
                            <div>{d.Username || d.name}</div>
                            <div className="text-sm text-muted-foreground">H: {d.H ?? d.skill ?? 0}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm text-muted-foreground">Inventory</h4>
                    {teamInventory.length === 0 ? (
                      <p className="text-muted-foreground">No inventory found</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th>Part</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th className="text-right">Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamInventory.map((it) => (
                            <tr key={it.Part_id} className="border-t border-border">
                              <td className="py-2">{it.Name}</td>
                              <td className="py-2 text-muted-foreground">{it.Category}</td>
                              <td className="py-2">{formatBudget(it.Price)}</td>
                              <td className="py-2 text-right">{it.Stock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>

          </DialogContent>
        </Dialog>

      </div>
    </MainLayout>
  );
};

export default Teams;