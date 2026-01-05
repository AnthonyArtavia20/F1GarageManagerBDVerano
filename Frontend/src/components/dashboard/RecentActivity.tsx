import { Activity, ShoppingCart, Wrench, Trophy, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "purchase",
    title: "Parte comprada",
    description: "Red Bull Racing adquirió Power Unit V6 Turbo",
    time: "Hace 2 min",
    icon: ShoppingCart,
    iconBg: "bg-success/20",
    iconColor: "text-success",
  },
  {
    id: 2,
    type: "assembly",
    title: "Carro armado",
    description: "Ferrari completó el armado del RB19-02",
    time: "Hace 15 min",
    icon: Wrench,
    iconBg: "bg-warning/20",
    iconColor: "text-warning",
  },
  {
    id: 3,
    type: "race",
    title: "Simulación completada",
    description: "GP de Mónaco - Ganador: Max Verstappen",
    time: "Hace 1 hora",
    icon: Trophy,
    iconBg: "bg-f1-gold/20",
    iconColor: "text-f1-gold",
  },
  {
    id: 4,
    type: "sponsor",
    title: "Nuevo aporte",
    description: "Oracle aportó $5,000,000 a Red Bull Racing",
    time: "Hace 2 horas",
    icon: DollarSign,
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
  },
];

export const RecentActivity = () => {
  return (
    <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg font-semibold text-foreground">
          Actividad Reciente
        </h2>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200 opacity-0 animate-fade-in"
            style={{ animationDelay: `${400 + index * 100}ms` }}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                activity.iconBg
              )}
            >
              <activity.icon className={cn("w-5 h-5", activity.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {activity.title}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {activity.description}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
