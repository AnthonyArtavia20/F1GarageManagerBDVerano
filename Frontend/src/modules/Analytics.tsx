import { BarChart3, ExternalLink, TrendingUp, Activity, Clock } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

const Analytics = () => {
  return (
    <MainLayout>
      <div className="p-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Analytics
            </h1>
            <p className="text-muted-foreground">
              Data visualization with Grafana
            </p>
          </div>
        </div>

        {/* Grafana Embed Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                Statistics_1
              </h2>
            </div>
            <div className="aspect-video bg-accent/50 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Grafana Panel 
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-success" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                Statistics_2
              </h2>
            </div>
            <div className="aspect-video bg-accent/50 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Grafana Panel 
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default Analytics;
