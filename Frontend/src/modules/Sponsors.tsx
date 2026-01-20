import { useState, useEffect } from "react";
import { Plus, Search, DollarSign, Calendar, Building2, TrendingUp, Users, Loader2, AlertCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamSelector } from "@/components/TeamSelector";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090';

interface Sponsor {
  Sponsor_id: number;
  Name: string;
  Industry?: string;
  Country?: string;
}

interface Contribution {
  id: number;
  Sponsor_id: number;
  sponsor_name: string;
  Team_id: number;
  Amount: number;
  Date: string;
  Description?: string;
}

interface Budget {
  teamId: number;
  totalBudget: number;
  totalSpent: number;
  availableBudget: number;
}

interface SessionUser {
  id: number;
  username: string;
  role: string;
  teamId?: number | null;
  teamName?: string | null;
}

const Sponsors = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [showAddContribution, setShowAddContribution] = useState(false);
  
  const [validationErrors, setValidationErrors] = useState({
    teamId: false,
    sponsorId: false,
    amount: false
  });

  const [newSponsor, setNewSponsor] = useState({
    Name: '',
    Industry: '',
    Country: ''
  });

  const [newContribution, setNewContribution] = useState({
    sponsorId: '',
    teamId: '',
    teamName: '',
    amount: '',
    description: ''
  });

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedTeamName, setSelectedTeamName] = useState('');

  const isAdmin = sessionUser?.role === 'admin';

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchSponsors();
      fetchTeamBudget();
      fetchTeamContributions();
    }
  }, [selectedTeamId]);

  const fetchSession = async () => {
    try {
      setLoadingSession(true);
      setError(null);

      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        setSessionUser(null);
        setSelectedTeamId("");
        setSelectedTeamName("");
        return;
      }

      const data = await res.json();
      if (!data?.success || !data?.user) {
        setSessionUser(null);
        setSelectedTeamId("");
        setSelectedTeamName("");
        return;
      }

      const u: SessionUser = data.user;
      setSessionUser(u);

      if (u.role !== 'admin') {
        const tid = u.teamId ?? null;
        const tname = u.teamName ?? "";

        if (tid) {
          setSelectedTeamId(String(tid));
          setSelectedTeamName(tname || `Team ${tid}`);
        } else {
          setSelectedTeamId("");
          setSelectedTeamName("");
        }
      }
    } catch (err: any) {
      console.error("Error loading session:", err);
      setError("Error loading session: " + err.message);
      setSessionUser(null);
      setSelectedTeamId("");
      setSelectedTeamName("");
    } finally {
      setLoadingSession(false);
    }
  };

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/sponsors`);
      const data = await response.json();
      
      if (data.success) {
        setSponsors(data.data);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError('Error al cargar patrocinadores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamContributions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sponsors/contributions/${selectedTeamId}`);
      const data = await response.json();
      
      if (data.success) {
        setContributions(data.data);
      }
    } catch (err) {
      console.error('Error al cargar aportes:', err);
    }
  };

  const fetchTeamBudget = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sponsors/budget/${selectedTeamId}`);
      const data = await response.json();
      
      if (data.success) {
        setBudget(data.data);
      }
    } catch (err) {
      console.error('Error al cargar presupuesto:', err);
    }
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/sponsors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSponsor)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Patrocinador creado exitosamente');
        setNewSponsor({ Name: '', Industry: '', Country: '' });
        setShowAddSponsor(false);
        fetchSponsors();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err: any) {
      alert('Error al crear patrocinador: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationErrors({
      teamId: false,
      sponsorId: false,
      amount: false
    });

    const errors = {
      teamId: !newContribution.teamId || newContribution.teamId.trim() === '',
      sponsorId: !newContribution.sponsorId || newContribution.sponsorId.trim() === '',
      amount: !newContribution.amount || parseFloat(newContribution.amount) <= 0
    };

    setValidationErrors(errors);

    if (errors.teamId || errors.sponsorId || errors.amount) {
      alert('Por favor completa todos los campos obligatorios correctamente');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/sponsors/contributions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newContribution,
          amount: parseFloat(newContribution.amount)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Aporte registrado. Nuevo presupuesto: $${data.data.newBudget}`);
        setNewContribution({
          sponsorId: '',
          teamId: '',
          teamName: '',
          amount: '',
          description: ''
        });
        setValidationErrors({
          teamId: false,
          sponsorId: false,
          amount: false
        });
        setShowAddContribution(false);
        
        await fetchTeamContributions();
        await fetchTeamBudget();
        await fetchSponsors();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err: any) {
      alert('Error al registrar aporte: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSponsors = sponsors.filter((sponsor) =>
    sponsor.Name.toLowerCase().includes(search.toLowerCase())
  );

  const sponsorsWithStats = filteredSponsors.map(sponsor => {
    const sponsorContributions = contributions.filter(c => c.Sponsor_id === sponsor.Sponsor_id);
    const totalContribution = sponsorContributions.reduce((sum, c) => sum + c.Amount, 0);
    const lastContribution = sponsorContributions[0]?.Date || 'N/A';
    
    return {
      ...sponsor,
      totalContribution,
      lastContribution,
      contributionsCount: sponsorContributions.length
    };
  });

  const noTeamAssigned =
    !loadingSession &&
    sessionUser &&
    (!sessionUser.teamId || sessionUser.teamId === null) &&
    sessionUser.role !== 'admin';

  return (
    <MainLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Sponsors Management
            </h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? "Manage sponsors and contributions for all teams"
                : `Contributions to ${selectedTeamName || 'your team'}`}
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Button 
                variant="racing" 
                size="lg"
                onClick={() => setShowAddSponsor(true)}
              >
                <Plus className="w-5 h-5" />
                ADD SPONSOR
              </Button>
            )}
            {isAdmin && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowAddContribution(true)}
              >
                <DollarSign className="w-5 h-5" />
                REGISTER CONTRIBUTION
              </Button>
            )}
          </div>
        </div>

        {/* ✅ ARREGLADO: Session / Team panel con z-index correcto */}
        <div
          className="glass-card rounded-xl p-6 mb-8 opacity-0 animate-fade-in relative z-10"
          style={{ animationDelay: "50ms" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="font-display font-semibold text-foreground">
              {isAdmin ? "View Mode" : "Team"}
            </h3>
          </div>

          {loadingSession ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading session...
            </div>
          ) : !sessionUser ? (
            <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                <p className="text-sm text-warning">
                  Not authenticated. Please login again.
                </p>
              </div>
            </div>
          ) : isAdmin ? (
            <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Administrator Mode</p>
                  <p className="font-display font-bold text-blue-400">Full Access - All Teams</p>
                  <p className="text-xs text-muted-foreground">
                    User: {sessionUser.username}
                  </p>
                </div>
              </div>
              {/* ✅ ARREGLADO: Sin label que tape, TeamSelector con z-index apropiado */}
              <div className="relative z-20">
                <TeamSelector
                  value={selectedTeamId}
                  onChange={(teamId, teamName) => {
                    setSelectedTeamId(teamId);
                    setSelectedTeamName(teamName);
                  }}
                  placeholder="Select a team to view contributions..."
                />
              </div>
            </div>
          ) : selectedTeamId ? (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Viewing Contributions for</p>
                  <p className="font-display font-bold text-primary">{selectedTeamName}</p>
                  <p className="text-xs text-muted-foreground">
                    User: {sessionUser.username} · Role: {sessionUser.role}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                <p className="text-sm text-warning">
                  No team assigned for this user in the database.
                </p>
              </div>
              {noTeamAssigned && (
                <p className="text-xs text-muted-foreground mt-2">
                  Contact an administrator to assign you to a team.
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 bg-red-500/10 border-red-500/20">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!selectedTeamId ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              {loadingSession ? "Loading..." : isAdmin ? "Select a Team" : "No Team Assigned"}
            </h3>
            <p className="text-muted-foreground">
              {loadingSession 
                ? "Please wait while we load your information..." 
                : isAdmin
                  ? "Select a team to view their contributions and budget"
                  : "You need a team assigned to view sponsor contributions"}
            </p>
          </div>
        ) : (
          <>
            {budget && (
              <div className="glass-card rounded-xl p-6 mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
                <div className="flex items-center gap-4 mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {selectedTeamName} Budget Overview
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Contributions</p>
                    <p className="font-display text-2xl font-bold text-success">
                      ${budget.totalBudget.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                    <p className="font-display text-2xl font-bold text-red-400">
                      ${budget.totalSpent.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Available Budget</p>
                    <p className="font-display text-2xl font-bold text-primary">
                      ${budget.availableBudget.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="relative max-w-md mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search Sponsor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
                Sponsors Contributing to {selectedTeamName} ({sponsorsWithStats.filter(s => s.contributionsCount > 0).length})
              </h2>
              
              {loading ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
                  <p className="text-muted-foreground mt-2">Loading sponsors...</p>
                </div>
              ) : sponsorsWithStats.filter(s => s.contributionsCount > 0).length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No sponsors have contributed to {selectedTeamName} yet
                  </p>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowAddContribution(true)}
                    >
                      Register First Contribution
                    </Button>
                  )}
                </div>
              ) : (
                sponsorsWithStats
                  .filter(s => s.contributionsCount > 0)
                  .map((sponsor, index) => (
                    <div
                      key={sponsor.Sponsor_id}
                      className="glass-card rounded-xl p-5 opacity-0 animate-fade-in hover:border-primary/50 transition-all duration-300"
                      style={{ animationDelay: `${250 + index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-display font-semibold text-foreground">
                              {sponsor.Name}
                            </h3>
                            <div className="flex gap-2 mt-1">
                              {sponsor.Industry && (
                                <span className="px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">
                                  {sponsor.Industry}
                                </span>
                              )}
                              {sponsor.Country && (
                                <span className="px-2 py-0.5 rounded text-xs bg-secondary/50 text-secondary-foreground">
                                  {sponsor.Country}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {sponsor.contributionsCount} contribution{sponsor.contributionsCount !== 1 ? 's' : ''} to {selectedTeamName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-success text-lg">
                            ${(sponsor.totalContribution / 1000).toFixed(0)}K
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Calendar className="w-3 h-3" />
                            {sponsor.lastContribution !== 'N/A' 
                              ? new Date(sponsor.lastContribution).toLocaleDateString()
                              : 'No contributions'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </>
        )}

        {showAddSponsor && isAdmin && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="font-display text-xl font-bold mb-4">Add New Sponsor</h2>
              <form onSubmit={handleCreateSponsor}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <Input
                      value={newSponsor.Name}
                      onChange={(e) => setNewSponsor({...newSponsor, Name: e.target.value})}
                      required
                      placeholder="e.g., Red Bull"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Industry</label>
                    <Input
                      value={newSponsor.Industry}
                      onChange={(e) => setNewSponsor({...newSponsor, Industry: e.target.value})}
                      placeholder="e.g., Energy Drinks"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Country</label>
                    <Input
                      value={newSponsor.Country}
                      onChange={(e) => setNewSponsor({...newSponsor, Country: e.target.value})}
                      placeholder="e.g., Austria"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button type="submit" variant="racing" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Sponsor'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddSponsor(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddContribution && isAdmin && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="font-display text-xl font-bold mb-4">Register Contribution</h2>
              <form onSubmit={handleCreateContribution}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Sponsor *</label>
                    <select
                      value={newContribution.sponsorId}
                      onChange={(e) => {
                        setNewContribution({...newContribution, sponsorId: e.target.value});
                        setValidationErrors({...validationErrors, sponsorId: false});
                      }}
                      className={`w-full px-3 py-2 bg-background border rounded-lg ${
                        validationErrors.sponsorId ? 'border-red-500' : 'border-border'
                      }`}
                    >
                      <option value="">Select sponsor</option>
                      {sponsors.map(sponsor => (
                        <option key={sponsor.Sponsor_id} value={sponsor.Sponsor_id}>
                          {sponsor.Name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.sponsorId && (
                      <p className="text-xs text-red-400 mt-1">Please select a sponsor</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Team *</label>
                    <div className={validationErrors.teamId ? 'border border-red-500 rounded-lg' : ''}>
                      <TeamSelector
                        value={newContribution.teamId}
                        onChange={(teamId, teamName) => {
                          setNewContribution({
                            ...newContribution, 
                            teamId: teamId,
                            teamName: teamName
                          });
                          setValidationErrors({...validationErrors, teamId: false});
                        }}
                        placeholder="Search and select team..."
                        required
                      />
                    </div>
                    {validationErrors.teamId && (
                      <p className="text-xs text-red-400 mt-1">Please select a team</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newContribution.amount}
                      onChange={(e) => {
                        setNewContribution({...newContribution, amount: e.target.value});
                        setValidationErrors({...validationErrors, amount: false});
                      }}
                      placeholder="e.g., 100000.00"
                      className={validationErrors.amount ? 'border-red-500' : ''}
                    />
                    {validationErrors.amount && (
                      <p className="text-xs text-red-400 mt-1">Amount must be greater than 0</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Input
                      value={newContribution.description}
                      onChange={(e) => setNewContribution({...newContribution, description: e.target.value})}
                      placeholder="e.g., Q1 2026 Contribution"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button type="submit" variant="racing" disabled={loading}>
                    {loading ? 'Registering...' : 'Register Contribution'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddContribution(false);
                      setValidationErrors({
                        teamId: false,
                        sponsorId: false,
                        amount: false
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default Sponsors;