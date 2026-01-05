import { useState } from "react";
import { Plus, Search, DollarSign, Calendar, Building2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Sponsors information

const sponsorsData = [
  {
    id: "[Sponsors' ID]",
    name: "[Sponsors' Name]",
    teams: ["Team_1", "Team_2"],
    totalContribution: 0,
    lastContribution: "2026-01-01",
  },
];


// Individual contributions 

const contributions = [
  {
    id: "[Sponsors' ID]",
    sponsor: "[Sponsors' Name]",
    team: "[Team_1]",
    amount: 0,
    date: "2026-01-01",
  },
];

const Sponsors = () => {
  const [search, setSearch] = useState("");

  const filteredSponsors = sponsorsData.filter((sponsor) =>
    sponsor.name.toLowerCase().includes(search.toLowerCase())
  );

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
              Manage available sponsors and their contributions
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="racing" size="lg">
              <Plus className="w-5 h-5" />
              ADD SPONSOR
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search Sponsor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sponsors List */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
              Active Sponsors
            </h2>
            {filteredSponsors.map((sponsor, index) => (
              <div
                key={sponsor.id}
                className="glass-card rounded-xl p-5 opacity-0 animate-fade-in hover:border-primary/50 transition-all duration-300"
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">
                        {sponsor.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sponsor.teams.map((team) => (
                          <span
                            key={team}
                            className="px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground"
                          >
                            {team}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-success text-lg">
                      ${(sponsor.totalContribution / 1000000).toFixed(0)}M
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {sponsor.lastContribution}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Sponsors;
