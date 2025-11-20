import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, Download, Smartphone, Check } from "lucide-react";
import { Link } from "react-router-dom";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-white mb-8 hover:text-white/80 transition-colors">
          <Apple className="h-6 w-6" />
          <span className="text-xl font-bold">Eats'Kale</span>
        </Link>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-gradient-primary">
                <Smartphone className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Install Eats'Kale</CardTitle>
            <CardDescription className="text-lg">
              Get the full app experience on your device
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isInstalled ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mb-4">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-2">App Installed!</h3>
                <p className="text-muted-foreground mb-6">
                  Eats'Kale is now installed on your device
                </p>
                <Link to="/dashboard">
                  <Button size="lg">Open App</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Works Offline</h4>
                      <p className="text-sm text-muted-foreground">
                        Access your meal logs even without internet
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Fast & Responsive</h4>
                      <p className="text-sm text-muted-foreground">
                        Instant loading and smooth animations
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Home Screen Icon</h4>
                      <p className="text-sm text-muted-foreground">
                        Quick access from your device's home screen
                      </p>
                    </div>
                  </div>
                </div>

                {isInstallable ? (
                  <Button onClick={handleInstall} size="lg" className="w-full">
                    <Download className="h-5 w-5 mr-2" />
                    Install App
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <h4 className="font-semibold mb-2">On iPhone/iPad:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Tap the Share button in Safari</li>
                        <li>Scroll down and tap "Add to Home Screen"</li>
                        <li>Tap "Add" in the top right</li>
                      </ol>
                    </div>

                    <div className="p-4 rounded-lg border border-border bg-card">
                      <h4 className="font-semibold mb-2">On Android:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Tap the menu (⋮) in your browser</li>
                        <li>Tap "Install app" or "Add to Home screen"</li>
                        <li>Follow the prompts</li>
                      </ol>
                    </div>

                    <Link to="/dashboard" className="block">
                      <Button variant="outline" size="lg" className="w-full">
                        Continue in Browser
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Install;
