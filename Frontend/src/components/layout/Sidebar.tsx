import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
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
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Equipos", href: "/teams", icon: Users },
  { name: "Conductores", href: "/drivers", icon: Trophy },
  { name: "Patrocinadores", href: "/sponsors", icon: Users },
  { name: "Tienda de Partes", href: "/store", icon: Store },
  { name: "Inventario", href: "/inventory", icon: Package },
  { name: "Armado de Carros", href: "/car-assembly", icon: Wrench },
  { name: "Circuitos", href: "/circuits", icon: Flag },
  { name: "Simulación", href: "/simulation", icon: Play },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

interface SidebarProps {
  userRole?: "Admin" | "Engineer" | "Driver";
  userName?: string;
  teamName?: string;
}

const handleLogout = (navigate: ReturnType<typeof useNavigate>) => {
  navigate("/login");
};

export const Sidebar = ({ userRole = "Admin", userName = "Admin User", teamName }: SidebarProps) => {
  const navigate = useNavigate();
  
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-glow">
          <Car className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold tracking-wider text-foreground">
            F1 GARAGE
          </h1>
          <p className="text-xs text-muted-foreground">Manager System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "nav-link",
                    isActive && "active"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-4">
        <div className="glass-card rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-display font-bold">
                {userName.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground">
                {userRole} {teamName && `• ${teamName}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 nav-link justify-center text-sm">
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleLogout(navigate)}
            className="flex-1 nav-link justify-center text-sm text-destructive hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
