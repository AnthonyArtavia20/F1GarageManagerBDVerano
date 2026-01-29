import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "@/lib/axios"; // <-- usa tu axios configurado

// ==================
// Types
// ==================
interface Driver {
  id: number;
  name: string;
  team: string | null;
  skill: number;
  teamColor: string;
}

interface Team {
  Team_id: number;
  Name: string;
}

// ==================
// Component
// ==================
const Drivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");

  // Admin
  const [isAdmin, setIsAdmin] = useState(false);

  // Create Driver form
  const [showForm, setShowForm] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [skill, setSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // ==================
  // Load initial data
  // ==================
  useEffect(() => {
    fetchDrivers();
    fetchTeams();
    checkAdmin();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await axios.get("/drivers");
      console.log("Drivers response:", res.data);
      
      // Handle both array and object responses
      let driversData = Array.isArray(res.data) ? res.data : res.data.data || res.data.recordset || [];
      
      const mapped = driversData.map((d: any) => ({
        id: d.User_id,
        name: d.name,
        team: d.team ?? "No Team",
        skill: d.skill,
        teamColor: "#1E41FF",
      }));
      setDrivers(mapped);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setDrivers([]);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get("/teams");
      console.log("Teams response:", res.data);
      
      // Handle both array and object responses
      let teamsData = Array.isArray(res.data) ? res.data : res.data.data || res.data.recordset || [];
      
      setTeams(teamsData);
    } catch (err) {
      console.error("Error fetching teams:", err);
      setTeams([]);
    }
  };

  const checkAdmin = async () => {
    try {
      const res = await axios.get("/auth/me");
      console.log("Full response:", res.data);
      // Check for both "ADMIN" and "admin" (case-insensitive)
      const role = res.data.user?.role || res.data.role;
      const isAdminUser = role?.toUpperCase() === "ADMIN";
      console.log("User role:", role);
      console.log("Is Admin?:", isAdminUser);
      setIsAdmin(isAdminUser);
    } catch (error) {
      console.error("Error checking admin:", error);
      setIsAdmin(false);
    }
  };

  // ==================
  // Create Driver
  // ==================
  const handleCreateDriver = async () => {
    setError("");
    setSuccess("");

    // Validation
    if (!driverName.trim()) {
      setError("Driver name is required");
      return;
    }

    if (!skill || isNaN(Number(skill))) {
      setError("Skill must be a valid number");
      return;
    }

    const skillNum = Number(skill);
    if (skillNum < 0 || skillNum > 100) {
      setError("Skill must be between 0 and 100");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/drivers", {
        driverName: driverName.trim(),
        teamId: teamId ? Number(teamId) : null,
        skill: skillNum,
      });

      setSuccess("Driver created successfully!");
      setTimeout(() => {
        setShowForm(false);
        setDriverName("");
        setTeamId("");
        setSkill("");
        setSuccess("");
        fetchDrivers();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error creating driver");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.team.toLowerCase().includes(search.toLowerCase())
  );

  const handleDriverClick = () => {
    navigate("/DriverProfile");
  };

  // ==================
  // Render
  // ==================
  return (
    <MainLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Drivers Management
            </h1>
            <p className="text-muted-foreground">
              Visualization of available drivers in the system
            </p>
            {/* DEBUG */}
            <p className="text-xs text-red-500 mt-2">Debug: isAdmin = {String(isAdmin)}</p>
          </div>

          {/* Add Driver button removed */}
        </div>

        {/* Create Driver Form Card (ADMIN) */}
        {isAdmin && showForm && (
          <div className="glass-card p-8 mb-8 rounded-xl border border-primary/20">
            {/* Card Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Register New Driver</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form Content */}
            <div className="space-y-6">
              {/* Driver Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Driver Name *
                </label>
                <Input
                  type="text"
                  placeholder="Enter driver name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  disabled={loading}
                  className="text-white"
                />
              </div>

              {/* Team Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Team (Optional)
                </label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  disabled={loading}
                  className="w-full bg-card border border-primary/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                >
                  <option value="">No Team</option>
                  {Array.isArray(teams) && teams.map((t: any) => (
                    <option key={t.Team_id} value={t.Team_id}>
                      {t.Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skill Rating */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Skill Rating (H) - 0 to 100 *
                </label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    disabled={loading}
                    className="text-white flex-1"
                  />
                  {skill && (
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-card rounded-full overflow-hidden border border-primary/20">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-red-500 transition-all"
                          style={{ width: `${Math.min(Number(skill), 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {Math.min(Number(skill), 100)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

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
                  onClick={handleCreateDriver}
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2"
                >
                  {loading ? "Creating..." : "Create Driver"}
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
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
          <Input
            placeholder="Search Drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrivers.map((driver, index) => (
            <div
              key={driver.id}
              onClick={handleDriverClick}
              className="glass-card rounded-xl overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="p-6">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl"
                    style={{
                      backgroundColor: `${driver.teamColor}20`,
                      color: driver.teamColor,
                    }}
                  >
                    {driver.id}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{driver.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {driver.team}
                    </p>
                  </div>
                </div>

                {/* Skill */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Ability (H)</span>
                    <span className="font-bold">{driver.skill}</span>
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
