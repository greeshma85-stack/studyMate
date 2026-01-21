import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header will be added here */}
      <main className="flex-1">
        {children}
      </main>
      {/* Bottom Navigation will be added here for mobile */}
    </div>
  );
}
