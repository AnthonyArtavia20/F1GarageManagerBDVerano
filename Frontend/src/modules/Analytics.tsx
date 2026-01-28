import { MainLayout } from "@/components/layout/MainLayout";
import { ExternalLink, Shield, Users, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// Importar los datos desde el JSON
import panelData from "@/../../Grafana/grafana-panels.json";

// Definición de tipo para paneles
type PanelType = {
  id: string;
  title: string;
  description: string;
  url: string;
  tag: string; // 'admin', 'engineer', 'all'
};

// Interface para usuario de sesión
interface SessionUser {
  id: number;
  username: string;
  role: string; // 'admin', 'engineer', 'driver'
  teamId?: number | null;
  teamName?: string | null;
}

const Analytics = () => {
  // Cargar paneles desde el JSON
  const panels: PanelType[] = panelData.panels;
  
  // Estado para manejar carga de iframes
  const [loadingPanels, setLoadingPanels] = useState<Record<string, boolean>>({});
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const { res, data } = await apiFetch("/api/auth/me");
      
      if (res.ok && data?.success && data?.user) {
        setSessionUser(data.user);
      } else {
        setError("Failed to load user session");
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setError("Error loading user information");
    } finally {
      setLoading(false);
    }
  };

  // Manejar carga de cada panel
  const handlePanelLoad = (panelId: string) => {
    setLoadingPanels(prev => ({ ...prev, [panelId]: false }));
  };

  // Filtrar paneles según el rol del usuario
  const getFilteredPanels = () => {
    if (!sessionUser) return [];
    
    const userRole = sessionUser.role;
    
    return panels.filter(panel => {
      // Admin puede ver todo
      if (userRole === 'admin') return true;
      
      // Engineer solo ve sus paneles
      if (userRole === 'engineer') {
        return panel.tag === 'engineer';
      }
      
      // Driver no ve ningún panel
      return false;
    });
  };

  // Modificar URLs para ingenieros (agregar team_id)
  const getPanelUrl = (panel: PanelType) => {
    let url = panel.url;
    
    // Si el usuario es ingeniero y tiene teamId, agregar parámetro team_id
    if (sessionUser?.role === 'engineer' && sessionUser.teamId && panel.tag === 'engineer') {
      // Si la URL ya tiene parámetros
      const hasParams = url.includes('?');
      const paramChar = hasParams ? '&' : '?';
      
      // Agregar var-team_id
      url += `${paramChar}var-team_id=${sessionUser.teamId}`;
    }
    
    return url;
  };

  // URL para abrir dashboard completo
  const getFullDashboardUrl = () => {
    const baseUrl = "http://localhost:3002/d/adbc4jx/f1-garage-manager";
    
    if (sessionUser?.role === 'engineer' && sessionUser.teamId) {
      return `${baseUrl}?var-team_id=${sessionUser.teamId}`;
    }
    
    return baseUrl;
  };

  // Función para obtener color según tag
  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      'admin': 'bg-red-500 text-white',
      'engineer': 'bg-blue-500 text-white'
    };
    return colors[tag] || 'bg-gray-500 text-white';
  };

  // Función para obtener nombre legible del tag
  const getTagName = (tag: string) => {
    const names: Record<string, string> = {
      'admin': 'Admin Only',
      'engineer': 'Engineer Only'
    };
    return names[tag] || tag;
  };

  const filteredPanels = getFilteredPanels();
  const fullDashboardUrl = getFullDashboardUrl();

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading user session...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="glass-card rounded-xl p-8 text-center bg-red-500/10 border-red-500/20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-foreground mb-2">
              Session Error
            </h3>
            <p className="text-muted-foreground">{error}</p>
            <button 
              onClick={fetchSession}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              {sessionUser ? 
                `Viewing as ${sessionUser.role.charAt(0).toUpperCase() + sessionUser.role.slice(1)}` : 
                'Embedded Grafana Visualizations'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {sessionUser && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                {sessionUser.role === 'admin' ? (
                  <Shield className="w-4 h-4 text-red-500" />
                ) : (
                  <Users className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-sm font-medium">
                  {sessionUser.username}
                  {sessionUser.teamName && ` • ${sessionUser.teamName}`}
                </span>
              </div>
            )}
            
            <a 
              href={fullDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Full Dashboard
            </a>
          </div>
        </div>

        {/* User Info Panel */}
        {sessionUser && (
          <div className="glass-card rounded-xl p-6 mb-8 opacity-0 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-accent/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Role</p>
                <div className="flex items-center gap-2 mt-1">
                  {sessionUser.role === 'admin' ? (
                    <>
                      <Shield className="w-5 h-5 text-red-500" />
                      <span className="text-lg font-bold text-red-500">Administrator</span>
                    </>
                  ) : sessionUser.role === 'engineer' ? (
                    <>
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-lg font-bold text-blue-500">Engineer</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold">Driver</span>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-accent/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Team</p>
                <p className="text-lg font-bold text-foreground">
                  {sessionUser.teamName || 'Not assigned'}
                </p>
                {sessionUser.teamId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {sessionUser.teamId}
                  </p>
                )}
              </div>
              
              <div className="p-4 bg-accent/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Access</p>
                <p className="text-lg font-bold text-foreground">
                  {filteredPanels.length} panel{filteredPanels.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Role-based access control
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Panel Único */}
        {filteredPanels.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            {sessionUser?.role === 'driver' ? (
              <>
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-foreground mb-2">
                  Driver Access
                </h3>
                <p className="text-muted-foreground">
                  Analytics dashboard is not available for drivers.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Contact an administrator or engineer for performance data.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-foreground mb-2">
                  No Access
                </h3>
                <p className="text-muted-foreground">
                  You don't have access to any analytics panels.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPanels.map((panel) => {
              const colorClass = getTagColor(panel.tag);
              
              return (
                <div 
                  key={panel.id}
                  className="glass-card rounded-xl p-6 opacity-0 animate-fade-in"
                >
                  {/* Panel Header */}
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>
                          {getTagName(panel.tag)}
                        </span>
                        <h2 className="font-display text-lg font-semibold text-foreground">
                          {panel.title}
                        </h2>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {panel.description}
                      </p>
                    </div>
                    
                    <a 
                      href={getPanelUrl(panel).replace('d-solo', 'd').split('&panelId')[0] + `&viewPanel=${panel.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in Grafana
                    </a>
                  </div>

                  {/* Contenedor del Iframe */}
                  <div className="relative bg-black rounded-lg overflow-hidden border border-border">
                    {/* Estado de carga */}
                    {loadingPanels[panel.id] !== false && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                          <p className="text-muted-foreground">Loading Grafana panel...</p>
                        </div>
                      </div>
                    )}

                    {/* Iframe de Grafana */}
                    <iframe
                      src={getPanelUrl(panel)}
                      title={`Grafana Panel - ${panel.title}`}
                      width="100%"
                      height="600"
                      frameBorder="0"
                      onLoad={() => handlePanelLoad(panel.id)}
                      onError={() => handlePanelLoad(panel.id)}
                      style={{ 
                        display: 'block',
                        backgroundColor: '#1a1a1a'
                      }}
                      sandbox="allow-same-origin allow-scripts"
                    />
                  </div>

                  {/* Panel Footer */}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Auto-refresh: 30s</span>
                      <span className="px-2 py-1 bg-muted rounded">Panel ID: {panel.id}</span>
                      {sessionUser?.role === 'engineer' && panel.tag === 'engineer' && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded">
                          Team: {sessionUser.teamName || `ID ${sessionUser.teamId}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        loadingPanels[panel.id] === false ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span>{loadingPanels[panel.id] === false ? 'Live' : 'Loading...'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Technical Info */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>
              <p>Grafana instance: <code className="bg-muted px-2 py-1 rounded">http://localhost:3002</code></p>
              <p className="mt-1">Dashboard UID: <code className="bg-muted px-2 py-1 rounded">adbc4jx</code></p>
              {sessionUser?.role === 'engineer' && sessionUser.teamId && (
                <p className="mt-1">Team Filter Applied: <code className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded">team_id={sessionUser.teamId}</code></p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Connected to F1GarageManager database</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
