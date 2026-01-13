import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Database, Wifi, CheckCircle, XCircle, Home, RefreshCw, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

const Test = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState({ db: false, api: false, all: false });
  const [results, setResults] = useState({ db: null, api: null, all: null });
  const [testData, setTestData] = useState("F1 Garage Connection Test");

  const API_URL = "http://localhost:9090/api/test";

  const handleGoHome = () => {
    navigate("/");
  };

  const testDBConnection = async () => {
    setLoading(prev => ({ ...prev, db: true }));
    setResults(prev => ({ ...prev, db: null }));
    
    try {
      const response = await fetch(`${API_URL}/connection`);
      const data = await response.json();
      setResults(prev => ({ ...prev, db: data }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        db: { 
          success: false, 
          message: "Failed to connect to database",
          error: error.message 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, db: false }));
    }
  };

  const testAPIConnection = async () => {
    setLoading(prev => ({ ...prev, api: true }));
    setResults(prev => ({ ...prev, api: null }));
    
    try {
      const response = await fetch(`${API_URL}/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testData })
      });
      
      const data = await response.json();
      setResults(prev => ({ ...prev, api: data }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        api: { 
          success: false, 
          message: "Failed to communicate with API",
          error: error.message 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, api: false }));
    }
  };

  const testAllConnections = async () => {
    setLoading(prev => ({ ...prev, all: true }));
    setResults(prev => ({ ...prev, all: null }));
    
    try {
      const response = await fetch(`${API_URL}/all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testData })
      });
      
      const data = await response.json();
      setResults(prev => ({ ...prev, all: data }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        all: { 
          success: false, 
          message: "Failed to complete all tests",
          error: error.message 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, all: false }));
    }
  };

  const clearResults = () => {
    setResults({ db: null, api: null, all: null });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
     
      {/* Bg Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="text-center max-w-2xl w-full z-10">
        
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/30 mb-4">
            <Server className="w-10 h-10 text-primary" />
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold tracking-wide text-primary">
              Connection Tester
            </h1>
          </div>
          
          <p className="text-muted-foreground">
            Test backend connections and API endpoints
          </p>
        </div>

        {/* Input Field */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="relative">
            <input
              type="text"
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              placeholder="Enter test data..."
              className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            />
            <Button
              onClick={clearResults}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
            >
              Clear
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-left">
            Data will be sent to: <code className="bg-muted px-1 rounded">POST /api/test/api</code>
          </p>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Button
            onClick={testDBConnection}
            disabled={loading.db}
            variant="outline"
            className="border-secondary text-secondary hover:bg-secondary/10 h-auto py-4 flex flex-col gap-2"
          >
            {loading.db ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Database className="w-5 h-5" />
            )}
            <span className="font-medium">Test Database</span>
            <span className="text-xs text-muted-foreground">GET /connection</span>
          </Button>

          <Button
            onClick={testAPIConnection}
            disabled={loading.api}
            variant="outline"
            className="border-accent text-accent hover:bg-accent/10 h-auto py-4 flex flex-col gap-2"
          >
            {loading.api ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Wifi className="w-5 h-5" />
            )}
            <span className="font-medium">Test API</span>
            <span className="text-xs text-muted-foreground">POST /api</span>
          </Button>

          <Button
            onClick={testAllConnections}
            disabled={loading.all}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-auto py-4 flex flex-col gap-2"
          >
            {loading.all ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span className="font-medium">Test All</span>
            <span className="text-xs opacity-90">Complete test</span>
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-4 mb-8">
          {/* Database Result */}
          {results.db && (
            <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
              <div className={`p-4 rounded-lg border ${results.db.success ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <h3 className="font-semibold">Database Connection</h3>
                  </div>
                  {results.db.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <p className={`text-sm ${results.db.success ? 'text-green-600' : 'text-destructive'}`}>
                  {results.db.message}
                </p>
                {results.db.database && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <code className="bg-muted px-2 py-1 rounded">{results.db.database}</code>
                  </div>
                )}
                {results.db.error && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded">
                    <p className="text-xs text-destructive">{results.db.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* API Result */}
          {results.api && (
            <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className={`p-4 rounded-lg border ${results.api.success ? 'border-blue-500/30 bg-blue-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    <h3 className="font-semibold">API Communication</h3>
                  </div>
                  {results.api.success ? (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <p className={`text-sm ${results.api.success ? 'text-blue-600' : 'text-destructive'}`}>
                  {results.api.message}
                </p>
                {results.api.received && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Data received:</p>
                    <code className="bg-muted px-2 py-1 rounded text-xs">{results.api.received}</code>
                  </div>
                )}
                {results.api.error && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded">
                    <p className="text-xs text-destructive">{results.api.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Test Result */}
          {results.all && (
            <div className="animate-fade-in" style={{ animationDelay: "250ms" }}>
              <div className={`p-4 rounded-lg border ${results.all.success ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <h3 className="font-semibold">Complete Test</h3>
                  </div>
                  {results.all.success ? (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <p className={`text-sm ${results.all.success ? 'text-primary' : 'text-destructive'}`}>
                  {results.all.message}
                </p>
                
                {results.all.tests && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className={`text-center p-2 rounded ${results.all.tests.database.includes('✅') ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                      <p className={`text-xs font-medium ${results.all.tests.database.includes('✅') ? 'text-green-600' : 'text-destructive'}`}>
                        Database
                      </p>
                      <p className="text-sm">{results.all.tests.database}</p>
                    </div>
                    <div className={`text-center p-2 rounded ${results.all.tests.api.includes('✅') ? 'bg-blue-500/10' : 'bg-destructive/10'}`}>
                      <p className={`text-xs font-medium ${results.all.tests.api.includes('✅') ? 'text-blue-600' : 'text-destructive'}`}>
                        API
                      </p>
                      <p className="text-sm">{results.all.tests.api}</p>
                    </div>
                    <div className={`text-center p-2 rounded ${results.all.tests.frontend.includes('✅') ? 'bg-accent/10' : 'bg-yellow-500/10'}`}>
                      <p className={`text-xs font-medium ${results.all.tests.frontend.includes('✅') ? 'text-accent' : 'text-yellow-600'}`}>
                        Frontend
                      </p>
                      <p className="text-sm">{results.all.tests.frontend}</p>
                    </div>
                  </div>
                )}
                
                {results.all.data && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Data sent:</p>
                    <code className="bg-muted px-2 py-1 rounded text-xs">{results.all.data}</code>
                  </div>
                )}
                
                {results.all.error && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded">
                    <p className="text-xs text-destructive">{results.all.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <Button 
            onClick={handleGoHome}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
          
          <Button 
            onClick={testAllConnections}
            disabled={loading.all}
            variant="secondary"
          >
            {loading.all ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Run All Tests Again
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="animate-fade-in" style={{ animationDelay: "350ms" }}>
          <div className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              F1 Garage Manager • Connection Tester
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Backend running at: <code className="bg-muted px-1 rounded">http://localhost:9090</code>
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Tested at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
