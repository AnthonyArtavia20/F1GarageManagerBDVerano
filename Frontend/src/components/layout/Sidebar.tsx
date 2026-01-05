import { useNavigate } from "react-router-dom";
import { 
  Headset,
  Users,
  Car,
  Wrench,
  Store,
  Package,
  Flag,
  Play,
  BarChart3,
  Settings,
  LogOut,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import logo from "@/assets/Logo.png";

const navigation = [
  { name: "Analytics*", href: "/Analytics", icon: BarChart3 },
  { name: "Teams", href: "/Teams", icon: Headset },
  { name: "Drivers", href: "/Drivers", icon: Trophy },
  { name: "Sponsors", href: "/Sponsors", icon: Users },
  { name: "Store*", href: "/Store", icon: Store },
  { name: "Inventory*", href: "/Inventory", icon: Package },
  { name: "Car Assembly*", href: "/Car-assembly", icon: Wrench },
  { name: "Circuits", href: "/Circuits", icon: Flag },
  { name: "Simulation", href: "/Simulation", icon: Play },
];

export const Sidebar = ({ userRole = "[Role]", userName = "[Username]"}) => {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  const handleLogout = () => {
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border/50">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/5 shadow-glow">
          <img 
            src={logo} 
            alt="F1 Logo" 
            className="w-10 h-10 object-contain" 
          />
        </div>

        <div>
          <h1 className="font-display text-lg font-bold tracking-wider text-foreground">
            F1  G-MGR
          </h1>
          <p className="text-xs text-muted-foreground">CE-3101 DB</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <li key={item.name}>
                <button
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                    "hover:bg-primary/5 hover:text-primary",
                    "text-muted-foreground",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="border-t border-border/50 p-4">
        <div className="bg-card/30 backdrop-blur-sm rounded-lg p-3 mb-3 border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/10">
              <span className="text-primary font-display font-bold">
                •‿•
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground">
                {userRole}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">

          {/* Logout button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full border-primary text-primary hover:bg-primary/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log-out
          </Button>
        </div>
      </div>
    </aside>
  );
};
