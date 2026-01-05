import { LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const stats = [
  { name: "Random_Stat_1", value: 92 },
  { name: "Random_Stat_2", value: 16 },
  { name: "Random_Stat_3", value: 67 },
  { name: "Random_Stat_4", value: 38 },
  { name: "Random_Stat_5", value: 80 },
];

const driverData = {
  name: "[Driver's Name]",
  teamName: "[Driver's Team]",
  initials: "•‿•"
};

const DriverProfile = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

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
            
            {/* Tittle */}
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
              <p className="text-muted-foreground">Profesional F1 Driver</p>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card className="glass-card opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
            <CardContent className="p-4 text-center">
              <p className="text-6xl font-display text-f1-gold">H</p>
              <p className="text-2xl font-display font-bold text-foreground">10000</p>
              <p className="text-xs text-muted-foreground">Skill</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">

        {/* Stat */}
          <Card className="glass-card opacity-25 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <CardHeader>
              <CardTitle className="font-display text-foreground">STATS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.map((stats) => (
                <div key={stats.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-foreground">{stats.name}</span>
                    <span className="text-sm font-medium text-primary">{stats.value}%</span>
                  </div>
                  <Progress value={stats.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
