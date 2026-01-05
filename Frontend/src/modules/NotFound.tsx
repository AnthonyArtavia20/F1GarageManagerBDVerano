import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: Attempt to access non-existent path", location.pathname);
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        
        {/* Icon */}
        <div className="mb-6 animate-bounce">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 border-4 border-destructive/30">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
        </div>

        {/* Tittle */}
        <div className="mb-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold tracking-wide text-destructive">
              !ERROR 404
            </h1>
          </div>
        </div>

        {/* Main Message */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <p className="text-xl text-accent-foreground mb-2">
            Page Not Found
          </p>
          <p className="text-muted-foreground">
            The path <code className="bg-muted px-2 py-1 rounded text-sm">{location.pathname}</code> doesn't exist.
          </p>
        </div>

        {/* Button : Return Home */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <Button 
            onClick={handleGoHome}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </div>

        {/* Footnote */}
        <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              F1 Garage Manager • Error logged at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              If this error persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
