import { MainLayout } from "@/components/layout/MainLayout";
import { ExternalLink, Shield, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import panelData from "@/../../Grafana/grafana-panels.json";

type PanelType = {
  panelId: string;
  title: string;
  description: string;
  dashboardUid: string;
  dashboardSlug: string;
  tag: string;
  fullWidth?: boolean;
};

interface SessionUser {
  id: number;
  username: string;
  role: string;
  teamId?: number | null;
  teamName?: string | null;
}

const Analytics = () => {
  const panels: PanelType[] = panelData.panels;
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedPanels, setLoadedPanels] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const { res, data } = await apiFetch("/api/auth/me");
      if (res.ok && data?.success) {
        setSessionUser(data.user);
      }
    } catch (error) {
      console.error("Session error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPanels = () => {
    if (!sessionUser) return [];
    
    if (sessionUser.role === 'admin') {
      return panels.filter(panel => panel.tag === 'admin');
    }
    
    if (sessionUser.role === 'engineer') {
      return panels.filter(panel => panel.tag === 'engineer');
    }
    
    return [];
  };

  const getPanelUrl = (panel: PanelType) => {
    const baseUrl = "http://localhost:3000";
    const params = new URLSearchParams();
    
    // Parámetros básicos
    params.set('orgId', '1');
    params.set('theme', 'dark');
    
    // hide UI
    params.set('viewPanel', panel.panelId);
    params.set('kiosk', '');
    
    // On engineer user add team as parameter
    if (sessionUser?.role === 'engineer' && sessionUser.teamId && panel.tag === 'engineer') {
      params.set('var-team_id', sessionUser.teamId.toString());
    }
    
    return `${baseUrl}/d/${panel.dashboardUid}/${panel.dashboardSlug}?${params.toString()}`;
  };

  const handlePanelLoad = (panelId: string) => {
    setLoadedPanels(prev => ({ ...prev, [panelId]: true }));
  };

  const getPanelClasses = (panel: PanelType) => {
    return panel.fullWidth ? "lg:col-span-2" : "";
  };

  const filteredPanels = getFilteredPanels();

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!sessionUser) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please login to access analytics</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (filteredPanels.length === 0) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No dashboard available for your role</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Analytics Dashboard</h1>
              <div className="flex items-center gap-3">
                {sessionUser.role === 'admin' ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-600 rounded-full text-sm">
                    <Shield className="w-4 h-4" />
                    <span>Administrator View</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-sm">
                    <Users className="w-4 h-4" />
                    <span>Team: {sessionUser.teamName || `ID ${sessionUser.teamId}`}</span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  {filteredPanels.length} panel{filteredPanels.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPanels.map((panel) => {
            const panelUrl = getPanelUrl(panel);
            const isLoaded = loadedPanels[panel.panelId];
            const panelClasses = getPanelClasses(panel);
            
            return (
              <div 
                key={panel.panelId}
                className={`border rounded-lg overflow-hidden bg-card ${panelClasses}`}
              >
                {/* Panel Header */}
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{panel.title}</h3>
                      <p className="text-sm text-muted-foreground">{panel.description}</p>
                    </div>
                    <a 
                      href={panelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 whitespace-nowrap"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </a>
                  </div>
                </div>

                {/* Panel Content */}
                <div className="relative bg-black">
                  {/* Loading State */}
                  {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-gray-400">Loading dashboard...</p>
                      </div>
                    </div>
                  )}

                  {/* Iframe */}
                  <iframe
                    src={panelUrl}
                    title={`${panel.title} - Analytics Dashboard`}
                    className="w-full h-[400px]"
                    style={{ 
                      display: 'block',
                      border: 'none'
                    }}
                    onLoad={() => handlePanelLoad(panel.panelId)}
                    sandbox="allow-scripts allow-same-origin"
                    loading="lazy"
                  />
                </div>

                {/* Panel Footer */}
                <div className="p-3 border-t text-xs text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      isLoaded ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span>{isLoaded ? 'Loaded' : 'Loading'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
