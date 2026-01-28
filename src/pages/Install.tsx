import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, Smartphone, Check, Share, PlusSquare, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Install = () => {
  const { isInstallable, isInstalled, installApp, isIOS, isAndroid } = usePWAInstall();
  const navigate = useNavigate();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      navigate("/dashboard");
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Already Installed!</CardTitle>
            <CardDescription>
              StudyMate is already installed on your device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Open App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Install StudyMate</h1>
          <p className="text-muted-foreground">
            Get the full app experience with offline access and quick launch from your home screen.
          </p>
        </div>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Why Install?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm">Works offline - study anywhere</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm">Quick access from home screen</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm">Full-screen experience</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm">No app store needed</span>
            </div>
          </CardContent>
        </Card>

        {/* Install Instructions */}
        {isInstallable ? (
          <Button onClick={handleInstall} size="lg" className="w-full gap-2">
            <Download className="w-5 h-5" />
            Install StudyMate
          </Button>
        ) : isIOS ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Install on iOS</CardTitle>
              <CardDescription>Follow these steps:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tap the Share button</p>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                    <Share className="w-4 h-4" />
                    <span>at the bottom of Safari</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                    <PlusSquare className="w-4 h-4" />
                    <span>in the share menu</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tap "Add" to confirm</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    StudyMate will appear on your home screen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isAndroid ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Install on Android</CardTitle>
              <CardDescription>Follow these steps:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tap the menu button</p>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                    <MoreVertical className="w-4 h-4" />
                    <span>three dots in the top right</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Select "Install app" or "Add to Home screen"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tap "Install" to confirm</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    StudyMate will appear on your home screen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Install on Desktop</CardTitle>
              <CardDescription>
                Look for the install icon in your browser's address bar, or use your browser's menu.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Skip for now */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="w-full"
        >
          Continue in browser
        </Button>
      </div>
    </div>
  );
};

export default Install;
