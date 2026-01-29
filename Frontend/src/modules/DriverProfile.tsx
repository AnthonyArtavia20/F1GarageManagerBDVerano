import { LogOut, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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

const DriverProfile = () => {
  const navigate = useNavigate();
  const panels: PanelType[] = panelData.panels;
  
  const [driverData, setDriverData] = useState({
    name: "[Driver's Name]",
    teamName: "---",
    initials: "•‿•",
    driverId: 1,
    teamId: 1
  });
  
  const [loading, setLoading] = useState(true);
  const [loadedPanels, setLoadedPanels] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    try {
      const { res, data } = await apiFetch("/api/auth/me");
      if (res.ok && data?.success) {
        const user = data.user;
        setDriverData({
          name: user.username || "[Driver's Name]",
          teamName: user.teamName || "---",
          initials: user.username?.charAt(0) || "•‿•",
          driverId: user.id || 1,
          teamId: user.teamId || 1
        });
      }
    } catch (error) {
      console.error("Session error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    navigate("/");
  };

  const getFilteredPanels = () => {
    return panels.filter(panel => panel.tag === 'driver');
  };

  const getPanelUrl = (panel: PanelType) => {
    const baseUrl = "http://localhost:3000";
    const params = new URLSearchParams();
    
    params.set('orgId', '1');
    params.set('theme', 'dark');
    params.set('viewPanel', panel.panelId);
    params.set('kiosk', '');
    
    params.set('var-Driver', driverData.driverId.toString());
    
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
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Bg Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-3/4 left-4/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            
            {/* Title */}
            <div className="text-center">
              <h1 className="text-xl font-display font-bold text-foreground">
                Drivers Profile
              </h1>
              <p className="text-sm text-muted-foreground">F1 Garage Manager</p>
            </div>

            {/* Logout button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-primary text-primary hover:bg-primary/10"
            >
              <LogOut className="w-4 h-4" />
              Log-out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-8">
        {/* Profile */}
        <div className="mb-8 opacity-0 animate-fade-in">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary">
              <span className="text-4xl font-display font-bold text-primary">
                {driverData.initials}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-1">
                {driverData.name}
              </h1>
              <p className="text-lg text-primary font-medium">{driverData.teamName}</p>
              <p className="text-muted-foreground">Professional F1 Driver</p>
            </div>
          </div>
        </div>

        {/* Paneles de Grafana para Drivers */}
        {filteredPanels.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                      title={`${panel.title} - Driver Analytics`}
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
        )}
      </div>
    </div>
  );
};

export default DriverProfile;
