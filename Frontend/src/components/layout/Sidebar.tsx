// Frontend/src/components/layout/Sidebar.tsx
import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Headset,
  Users,
  Wrench,
  Store,
  Package,
  Flag,
  Play,
  BarChart3,
  LogOut,
  Trophy,
  UserPen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/Logo.png";
import { apiFetch } from "@/lib/api";

type NavItem = {
  name: string;
  href: string;
  icon: any;
};

const navigation: NavItem[] = [
  { name: "Analytics*", href: "/Analytics", icon: BarChart3 },
  { name: "Teams", href: "/Teams", icon: Headset },
  { name: "Drivers", href: "/Drivers", icon: Trophy },
  { name: "Sponsors", href: "/Sponsors", icon: Users },
  { name: "Store*", href: "/Store", icon: Store },
  { name: "Inventory*", href: "/Inventory", icon: Package },
  { name: "Car Assembly*", href: "/CarAssembly", icon: Wrench },
  { name: "Circuits [X]", href: "/Circuits", icon: Flag },
  { name: "Simulation [X]", href: "/Simulation", icon: Play },
  { name: "User Management", href: "/UserManagement", icon: UserPen },
];

function hasAsterisk(name: string) {
  return name.trim().endsWith("*");
}

export const Sidebar = ({
  userRole = "[Role]",
  userName = "[Username]",
}: {
  userRole?: string;
  userName?: string;
}) => {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  // Local session user state (fetched from /api/auth/me)
  const [sessionUser, setSessionUser] = useState<{ username?: string; role?: string } | null>(null);

  useEffect(() => {
    // Try to read a cached user from localStorage for instant render
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      if (stored) {
        setSessionUser({ username: stored.username || stored.Username, role: stored.role || stored.Role });
      }
    } catch {
      // ignore parse errors
    }

    // Fetch authoritative session user from backend
    (async () => {
      try {
        const { res, data } = await apiFetch("/api/auth/me", { method: "GET" });
        if (res.ok && data && data.success && data.user) {
          setSessionUser({
            username: data.user.username || data.user.Username || data.user.user || "",
            role: (data.user.role || data.user.Role || "").toString(),
          });
        }
      } catch (err) {
        // ignore network issues
      }
    })();
  }, []);

  // Compute display name & role (falling back to props if needed)
  const displayUserName = sessionUser?.username || userName;
  const displayUserRole = sessionUser?.role || userRole;

  // Normalizar rol
  const role = (displayUserRole || "").toLowerCase().trim();

  // Si por algún motivo el rol no viene aún (por ejemplo al refrescar),
  // usamos fallback "admin" para NO dejar el sidebar vacío.
  const effectiveRole = role || "admin";

  const filteredNavigation = useMemo(() => {
    if (effectiveRole === "admin") return navigation;

    if (effectiveRole === "engineer") {
      // Engineer: SOLO items con *
      return navigation.filter((item) => hasAsterisk(item.name));
    }

    // Si quisieras restringir driver, lo haces aquí.
    // Por ahora devolvemos todo para no romper navegación.
    return navigation;
  }, [effectiveRole]);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // aunque falle, igual limpiamos el front
    } finally {
      navigate("/");
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border/50">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/5 shadow-glow">
          <img src={logo} alt="F1 Logo" className="w-10 h-10 object-contain" />
        </div>

        <div>
          <h1 className="font-display text-lg font-bold tracking-wider text-foreground">
            F1&nbsp;&nbsp;G-MGR
          </h1>
          <p className="text-xs text-muted-foreground">CE-3101 DB</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {filteredNavigation.map((item) => {
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
              <span className="text-primary font-display font-bold">•‿•</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {displayUserName}
              </p>
              <p className="text-xs text-muted-foreground">{displayUserRole}</p>
            </div>
          </div>
        </div>

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
    </aside>
  );
};
