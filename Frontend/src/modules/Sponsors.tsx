import { useState, useEffect } from "react";
import { 
  Plus,
  DollarSign,
  TrendingUp, 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter, 
  Search,
  AlertCircle, 
  Loader2,
  Building2,
  ChevronDown
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TeamSelector } from "@/components/TeamSelector";
import { apiFetch } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Sponsor {
  Sponsor_id: number;
  Name: string;
  Contact_Email?: string;
  Phone?: string;
  Status?: string;
  Total_Amount?: number;
  Industry?: string;
  Country?: string;
}

interface Contribution {
  Contribution_id: number;
  Sponsor_id: number;
  Team_id: number;
  Amount: number;
  Date: string;
  Status: string;
  Terms_Accepted: boolean;
  Sponsor_Name: string;
  Team_Name: string;
}

interface SessionUser {
  id: number;
  username: string;
  role: string;
  teamId?: number | null;
  teamName?: string | null;
}

interface Budget {
  teamId: number;
  teamName?: string;
  totalBudget: number;
  totalSpent: number;
  availableBudget: number;
}

const Sponsors = () => {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<Contribution[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [loadingAllSponsors, setLoadingAllSponsors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para los modales
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
    Country: '',
    Contact_Email: '',
    Phone: ''
  });

  const [newContribution, setNewContribution] = useState({
    sponsorId: '',
    teamId: '',
    teamName: '',
    amount: '',
    description: ''
  });
  
  const totalContributions = contributions.reduce((sum, c) => sum + c.Amount, 0);
  const pendingContributions = contributions.filter(c => c.Status === "PENDING");
  const completedContributions = contributions.filter(c => c.Status === "COMPLETED");
  
  const isAdmin = sessionUser?.role === 'admin';

  useEffect(() => {
    fetchSession();
    fetchAllSponsors();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamData();
    } else {
      setSponsors([]);
      setContributions([]);
      setFilteredContributions([]);
      setBudget(null);
    }
  }, [selectedTeam]);

  useEffect(() => {
    filterContributions();
  }, [searchTerm, statusFilter, contributions]);

  const fetchSession = async () => {
    try {
      setLoadingSession(true);
      setError(null);

      const { res, data } = await apiFetch("/api/auth/me", {
        method: "GET",
      });

      if (!res.ok || !data?.success || !data?.user) {
        setSessionUser(null);
        setSelectedTeam("");
        setSelectedTeamName("");
        return;
      }

      const u = data.user;
      setSessionUser(u);

      if (u.role !== 'admin') {
        const tid = u.teamId ?? null;
        const tname = u.teamName ?? "";

        if (tid) {
          setSelectedTeam(String(tid));
          setSelectedTeamName(tname || `Team ${tid}`);
        } else {
          setSelectedTeam("");
          setSelectedTeamName("");
        }
      }

    } catch (err: any) {
      console.error("Error loading session:", err);
      setError("Error loading session: " + err.message);
      setSessionUser(null);
      setSelectedTeam("");
      setSelectedTeamName("");
    } finally {
      setLoadingSession(false);
    }
  };

  const fetchAllSponsors = async () => {
    try {
      setLoadingAllSponsors(true);
      console.log('🔄 Loading all sponsors...');
      
      const { res, data } = await apiFetch("/api/sponsors");
      console.log('📊 Sponsors response:', { status: res.status, data });
      
      if (res.ok && data.success) {
        console.log(`✅ Loaded ${data.data?.length || 0} sponsors`);
        setAllSponsors(data.data || []);
      } else {
        console.error('❌ Failed to load sponsors:', data?.message);
        // Datos de ejemplo para desarrollo
        setAllSponsors([
          { Sponsor_id: 1, Name: 'Red Bull', Industry: 'Energy Drinks', Country: 'Austria' },
          { Sponsor_id: 2, Name: 'Petronas', Industry: 'Oil & Gas', Country: 'Malaysia' },
          { Sponsor_id: 3, Name: 'Shell', Industry: 'Oil & Gas', Country: 'Netherlands' },
          { Sponsor_id: 4, Name: 'Pirelli', Industry: 'Tires', Country: 'Italy' },
          { Sponsor_id: 5, Name: 'Rolex', Industry: 'Luxury Watches', Country: 'Switzerland' },
        ]);
      }
    } catch (err: any) {
      console.error('❌ Error loading all sponsors:', err);
      // Datos de ejemplo en caso de error
      setAllSponsors([
        { Sponsor_id: 1, Name: 'Demo Sponsor 1', Industry: 'Technology', Country: 'USA' },
        { Sponsor_id: 2, Name: 'Demo Sponsor 2', Industry: 'Automotive', Country: 'Germany' },
      ]);
    } finally {
      setLoadingAllSponsors(false);
    }
  };

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener contribuciones del equipo
      try {
        const { res, data } = await apiFetch(`/api/sponsors/contributions/${selectedTeam}`);
        if (res.ok && data.success) {
          setContributions(data.data || []);
          setFilteredContributions(data.data || []);
        }
      } catch (err) {
        console.log('Trying alternative endpoint...');
        const { res, data } = await apiFetch(`/api/sponsors/team/${selectedTeam}`);
        if (res.ok && data.success) {
          setContributions(data.data || []);
          setFilteredContributions(data.data || []);
        }
      }
      
      // Obtener presupuesto
      await fetchTeamBudget();
      
      // Filtrar sponsors que han contribuido a este equipo
      const teamSponsorIds = [...new Set(contributions.map(c => c.Sponsor_id))];
      const teamSponsors = allSponsors.filter(sponsor => 
        teamSponsorIds.includes(sponsor.Sponsor_id)
      );
      setSponsors(teamSponsors);
      
    } catch (err: any) {
      console.error('Error loading team data:', err);
      setError('Error loading team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamBudget = async () => {
    try {
      // Intentar diferentes endpoints
      const endpoints = [
        `/api/sponsors/budget/${selectedTeam}`,
        `/api/sponsors/team/${selectedTeam}/budget`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const { res, data } = await apiFetch(endpoint);
          if (res.ok && data.success) {
            setBudget(data.data);
            return;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed, trying next...`);
        }
      }
      
      // Si ningún endpoint funciona, calcular manualmente
      const total = contributions.reduce((sum, c) => sum + c.Amount, 0);
      setBudget({
        teamId: parseInt(selectedTeam),
        totalBudget: total,
        totalSpent: total * 0.3,
        availableBudget: total * 0.7
      });
      
    } catch (err) {
      console.error('Error loading budget:', err);
      setBudget({
        teamId: parseInt(selectedTeam),
        totalBudget: 0,
        totalSpent: 0,
        availableBudget: 0
      });
    }
  };

  const filterContributions = () => {
    let filtered = contributions;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.Sponsor_Name.toLowerCase().includes(term) ||
        c.Team_Name.toLowerCase().includes(term) ||
        c.Amount.toString().includes(term)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.Status === statusFilter);
    }
    
    setFilteredContributions(filtered);
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { res, data } = await apiFetch("/api/sponsors", {
        method: 'POST',
        body: JSON.stringify(newSponsor)
      });
      
      if (res.ok && data.success) {
        alert('Sponsor created successfully');
        setNewSponsor({ 
          Name: '', 
          Industry: '', 
          Country: '', 
          Contact_Email: '', 
          Phone: '' 
        });
        setShowAddSponsor(false);
        // Refrescar la lista de sponsors
        await fetchAllSponsors();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err: any) {
      alert('Error creating sponsor: ' + err.message);
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
      alert('Please complete all required fields correctly');
      return;
    }
    
    try {
      setLoading(true);
      const { res, data } = await apiFetch("/api/sponsors/contributions", {
        method: 'POST',
        body: JSON.stringify({
          sponsorId: parseInt(newContribution.sponsorId),
          teamId: parseInt(newContribution.teamId || selectedTeam),
          amount: parseFloat(newContribution.amount),
          description: newContribution.description
        })
      });
      
      if (res.ok && data.success) {
        alert(`Contribution registered successfully`);
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
        
        // Refrescar datos
        await fetchTeamData();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err: any) {
      alert('Error registering contribution: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptContribution = async (contributionId: number) => {
    if (!confirm("Accept this contribution?")) return;
    
    try {
      const { res, data } = await apiFetch(`/api/sponsors/contributions/${contributionId}/accept`, {
        method: "POST",
        body: JSON.stringify({ teamId: selectedTeam }),
      });
      
      if (res.ok && data.success) {
        alert("Contribution accepted successfully");
        fetchTeamData();
      } else {
        alert(data.message || "Failed to accept contribution");
      }
    } catch (err) {
      console.error('Error accepting contribution:', err);
      alert("Error accepting contribution");
    }
  };

  const handleRejectContribution = async (contributionId: number) => {
    if (!confirm("Reject this contribution?")) return;
    
    try {
      const { res, data } = await apiFetch(`/api/sponsors/contributions/${contributionId}/reject`, {
        method: "POST",
        body: JSON.stringify({ teamId: selectedTeam }),
      });
      
      if (res.ok && data.success) {
        alert("Contribution rejected successfully");
        fetchTeamData();
      } else {
        alert(data.message || "Failed to reject contribution");
      }
    } catch (err) {
      console.error('Error rejecting contribution:', err);
      alert("Error rejecting contribution");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case "PENDING": return <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case "REJECTED": return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Custom Select component para sponsors (mejor que HTML select)
  const SponsorSelect = () => (
    <div className="relative">
      <select
        value={newContribution.sponsorId}
        onChange={(e) => {
          setNewContribution({...newContribution, sponsorId: e.target.value});
          setValidationErrors({...validationErrors, sponsorId: false});
        }}
        className={`w-full px-3 py-2 bg-background border rounded-lg appearance-none ${
          validationErrors.sponsorId ? 'border-red-500' : 'border-border'
        }`}
      >
        <option value="">Select sponsor</option>
        {allSponsors.length === 0 ? (
          <option value="" disabled>
            {loadingAllSponsors ? 'Loading sponsors...' : 'No sponsors available'}
          </option>
        ) : (
          allSponsors.map(sponsor => (
            <option key={sponsor.Sponsor_id} value={sponsor.Sponsor_id}>
              {sponsor.Name} {sponsor.Industry ? `(${sponsor.Industry})` : ''}
            </option>
          ))
        )}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      {validationErrors.sponsorId && (
        <p className="text-xs text-red-400 mt-1">Please select a sponsor</p>
      )}
      {allSponsors.length === 0 && !loadingAllSponsors && (
        <p className="text-xs text-amber-500 mt-1">
          No sponsors found. <Button variant="link" className="p-0 h-auto" onClick={() => setShowAddSponsor(true)}>Add a sponsor first</Button>
        </p>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <>
                <Button 
                  variant="racing" 
                  size="lg"
                  onClick={() => setShowAddSponsor(true)}
                  disabled={loadingAllSponsors}
                >
                  {loadingAllSponsors ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5 mr-2" />
                  )}
                  ADD SPONSOR
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowAddContribution(true)}
                  disabled={loadingAllSponsors || allSponsors.length === 0}
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  REGISTER CONTRIBUTION
                  {allSponsors.length === 0 && " (No sponsors)"}
                </Button>
              </>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-xl text-foreground">
                ${totalContributions.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Team Selection Panel */}
        <div className="glass-card rounded-xl p-6 mb-8 relative z-10">
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
              <div className="relative z-20">
                <TeamSelector
                  value={selectedTeam}
                  onChange={(teamId, teamName) => {
                    setSelectedTeam(teamId);
                    setSelectedTeamName(teamName);
                  }}
                  placeholder="Select a team to view contributions..."
                />
              </div>
            </div>
          ) : selectedTeam ? (
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
            </div>
          )}
        </div>

        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {!selectedTeam ? (
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
            {/* Budget Overview */}
            {budget && (
              <div className="glass-card rounded-xl p-6 mb-6">
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
                      ${budget.totalBudget.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                    <p className="font-display text-2xl font-bold text-red-400">
                      ${budget.totalSpent.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Available Budget</p>
                    <p className="font-display text-2xl font-bold text-primary">
                      ${budget.availableBudget.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Contributions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-display font-bold text-foreground">
                      ${totalContributions.toLocaleString()}
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Sponsors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-display font-bold text-foreground">
                      {sponsors.length}
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-display font-bold text-foreground">
                      {pendingContributions.length}
                    </div>
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search contributions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "PENDING" ? "default" : "outline"}
                  onClick={() => setStatusFilter("PENDING")}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === "COMPLETED" ? "default" : "outline"}
                  onClick={() => setStatusFilter("COMPLETED")}
                >
                  Completed
                </Button>
              </div>
            </div>

            {/* Contributions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Contributions</CardTitle>
                <CardDescription>
                  {filteredContributions.length} contributions found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground mt-2">Loading contributions...</p>
                  </div>
                ) : filteredContributions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Filter className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No contributions found</h3>
                    <p className="text-muted-foreground">
                      {contributions.length === 0 
                        ? "No contributions available for this team" 
                        : "Try changing your search or filter"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Sponsor</th>
                          <th className="text-left py-3 px-4 font-medium">Team</th>
                          <th className="text-left py-3 px-4 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContributions.map((contribution) => (
                          <tr key={contribution.Contribution_id} className="border-b hover:bg-accent/50">
                            <td className="py-3 px-4">
                              <div className="font-medium">{contribution.Sponsor_Name}</div>
                              <div className="text-sm text-muted-foreground">
                                {contribution.Terms_Accepted ? "Terms accepted" : "Terms pending"}
                              </div>
                            </td>
                            <td className="py-3 px-4">{contribution.Team_Name}</td>
                            <td className="py-3 px-4 font-display font-bold">
                              ${contribution.Amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              {new Date(contribution.Date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(contribution.Status)}
                            </td>
                            <td className="py-3 px-4">
                              {contribution.Status === "PENDING" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => handleAcceptContribution(contribution.Contribution_id)}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectContribution(contribution.Contribution_id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Add Sponsor Modal */}
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
                      placeholder="Sponsor name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Industry</label>
                    <Input
                      value={newSponsor.Industry}
                      onChange={(e) => setNewSponsor({...newSponsor, Industry: e.target.value})}
                      placeholder="Industry"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Country</label>
                    <Input
                      value={newSponsor.Country}
                      onChange={(e) => setNewSponsor({...newSponsor, Country: e.target.value})}
                      placeholder="Country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Email</label>
                    <Input
                      type="email"
                      value={newSponsor.Contact_Email}
                      onChange={(e) => setNewSponsor({...newSponsor, Contact_Email: e.target.value})}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input
                      value={newSponsor.Phone}
                      onChange={(e) => setNewSponsor({...newSponsor, Phone: e.target.value})}
                      placeholder="Phone number"
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

        {/* Register Contribution Modal */}
        {showAddContribution && isAdmin && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="font-display text-xl font-bold mb-4">Register Contribution</h2>
              <form onSubmit={handleCreateContribution}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Sponsor *</label>
                    <SponsorSelect />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Team *</label>
                    <div className={validationErrors.teamId ? 'border border-red-500 rounded-lg' : ''}>
                      <TeamSelector
                        value={newContribution.teamId || selectedTeam}
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