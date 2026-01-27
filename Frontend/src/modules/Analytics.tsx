import { MainLayout } from "@/components/layout/MainLayout";
import { ExternalLink, Shield, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import panelData from "@/../../Grafana/grafana-panels.json";

type PanelType = {
  id: string;
  title: string;
  description: string;
  url: string;
  tag: string;
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
    let url = panel.url;
    
    if (sessionUser?.role === 'engineer' && sessionUser.teamId && panel.tag === 'engineer') {
      url = url.replace(/var-team_id=\d+/, `var-team_id=${sessionUser.teamId}`);
    }
    
    return `${url}?orgId=1&theme=dark&kiosk`;
  };

  const getFullDashboardUrl = () => {
    const baseUrl = "http://localhost:3000/d/adbc4jx/f1-garage-manager";
    
    if (sessionUser?.role === 'engineer' && sessionUser.teamId) {
      return `${baseUrl}?orgId=1&var-team_id=${sessionUser.teamId}`;
    }
    
    return `${baseUrl}?orgId=1`;
  };

  const handlePanelLoad = (panelId: string) => {
    setLoadedPanels(prev => ({ ...prev, [panelId]: true }));
  };

  const getLayoutClass = (panelCount: number) => {
    switch (panelCount) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 lg:grid-cols-2";
      case 3:
        return "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3";
      case 4:
        return "grid-cols-1 lg:grid-cols-2 xl:grid-cols-4";
      default:
        return "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3";
    }
  };

  const filteredPanels = getFilteredPanels();
  const layoutClass = getLayoutClass(filteredPanels.length);
  const fullDashboardUrl = getFullDashboardUrl();

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

        {/* Dynamic Grid Layout */}
        <div className={`grid ${layoutClass} gap-6`}>
          {filteredPanels.map((panel) => {
            const panelUrl = getPanelUrl(panel);
            const isLoaded = loadedPanels[panel.id];
            
            return (
              <div 
                key={panel.id}
                className="border rounded-lg overflow-hidden bg-card"
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
                    onLoad={() => handlePanelLoad(panel.id)}
                    sandbox="allow-scripts allow-same-origin"
                    loading="lazy"
                  />
                </div>

                {/* Panel Footer */}
                <div className="p-3 border-t text-xs text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span>Panel: {panel.id}</span>
                    {sessionUser?.role === 'engineer' && panel.tag === 'engineer' && (
                      <span className="text-blue-500">
                        Team {sessionUser.teamId}
                      </span>
                    )}
                  </div>
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

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>
              <p>Grafana Dashboard • UID: adbc4jx</p>
              {sessionUser?.role === 'engineer' && sessionUser.teamId && (
                <p className="mt-1">Team Filter: team_id={sessionUser.teamId}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Connected</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
