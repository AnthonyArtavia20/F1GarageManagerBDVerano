import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/auth/authContext"; // ✅ IMPORTAR useAuth

import logo from "@/assets/Logo.png";
import { apiFetch } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      alert("Enter username and password");
      return;
    }

    setLoading(true);
    
    try {
      console.log(' [LOGIN] Starting login for:', username);
      console.log(' [LOGIN] Password:', password);
      
      const { res, data } = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      console.log('🔐 [LOGIN] Full response object:', res);
      console.log('🔐 [LOGIN] Response status:', res.status);
      console.log('🔐 [LOGIN] Response ok:', res.ok);
      console.log('🔐 [LOGIN] Response data:', data);
      console.log('🔐 [LOGIN] data.success:', data.success);
      console.log('🔐 [LOGIN] data.message:', data.message);

      if (data.success === false) {
        console.log('❌ [LOGIN] Login failed, showing message:', data.message);
        alert(data.message || "Login failed");
        return;
      }

      console.log('[LOGIN] Login successful!');

      if (!data.user || !data.user.role) {
        alert("Invalid user data received");
        return;
      }

      const role = data.user.role;
      console.log('🔐 [LOGIN] Role detected:', role);

      //Actualizar el AuthContext ANTES de navegar
      await refresh();
      console.log('[LOGIN] AuthContext refreshed');

      // Ahora sí navegar según rol
      if (role === "driver") {
        navigate("/DriverProfile");
      } else if (role === "admin" || role === "engineer") {
        navigate("/Analytics");
      } else {
        alert(`User has unknown role: ${role}`);
      }

    } catch (error: any) {
      console.error('🔐 [LOGIN] Error:', error);
      alert("Login error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">

      {/* Bg Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse duration-4000 delay-500" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse duration-5000" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8 opacity-0 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/5 shadow-glow mb-4">
            <img 
              src={logo} 
              alt="F1 Logo" 
              className="w-24 h-24 object-contain" 
            />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wider text-foreground">
            F1 GARAGE MANAGER
          </h1>
          <p className="text-muted-foreground mt-2">[ CE-3101 Data Bases ]</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h2 className="font-display text-xl font-semibold text-foreground text-center mb-6">
            Log-in 
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-accent/50 border-border"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-accent/50 border-border"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              variant="racing" 
              size="lg" 
              className="w-full" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  ENTER
                </>
              )}
            </Button>
          </form>
        
          <div className="mt-7 pt-2 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
                version 0.0.9
            </p>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Default users: winAdmin / winEngineer / winDriver
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          © 2026 F1 Garage Manager • Instituto Tecnológico de Costa Rica
        </p>
      </div>
    </div>
  );
};

export default Login;