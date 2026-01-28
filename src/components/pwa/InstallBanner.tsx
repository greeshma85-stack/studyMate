import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BANNER_DISMISSED_KEY = "studymate-install-banner-dismissed";

export const InstallBanner = () => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    // Show banner again after a week
    if (!dismissed || Date.now() - dismissedTime > oneWeek) {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      handleDismiss();
    } else {
      navigate("/install");
    }
  };

  if (isInstalled || isDismissed || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-fade-in">
      <div className="bg-primary text-primary-foreground rounded-lg p-4 shadow-lg flex items-center gap-3">
        <div className="flex-1">
          <p className="font-medium text-sm">Install StudyMate</p>
          <p className="text-xs opacity-90">Get quick access from your home screen</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleInstall}
          className="shrink-0 gap-1"
        >
          <Download className="w-4 h-4" />
          Install
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-primary-foreground/10 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
