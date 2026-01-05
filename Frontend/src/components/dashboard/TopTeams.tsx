import { Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const teams = [
  {
    id: 1,
    name: "Red Bull Racing",
    wins: 15,
    points: 642,
    budget: "$145,000,000",
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "Scuderia Ferrari",
    wins: 8,
    points: 478,
    budget: "$138,000,000",
    color: "bg-primary",
  },
  {
    id: 3,
    name: "Mercedes AMG",
    wins: 5,
    points: 389,
    budget: "$142,000,000",
    color: "bg-teal-400",
  },
  {
    id: 4,
    name: "McLaren F1",
    wins: 3,
    points: 312,
    budget: "$125,000,000",
    color: "bg-orange-500",
  },
];

export const TopTeams = () => {
  return (
    <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-f1-gold" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Top Equipos
          </h2>
        </div>
        <button className="text-sm text-primary hover:underline">Ver todos</button>
      </div>
      <div className="space-y-4">
        {teams.map((team, index) => (
          <div
            key={team.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200 opacity-0 animate-fade-in"
            style={{ animationDelay: `${500 + index * 100}ms` }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm",
                  index === 0 ? "bg-f1-gold/20 text-f1-gold" :
                  index === 1 ? "bg-f1-silver/20 text-f1-silver" :
                  index === 2 ? "bg-f1-bronze/20 text-f1-bronze" :
                  "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </div>
              <div className={cn("w-1 h-8 rounded-full", team.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {team.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {team.wins} victorias • {team.points} pts
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{team.budget}</p>
              <div className="flex items-center gap-1 text-success text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>+12%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
