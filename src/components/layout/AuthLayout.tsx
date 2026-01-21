import { ReactNode } from 'react';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary font-heading">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {APP_TAGLINE}
          </p>
        </div>
        
        {/* Auth Form Container */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-soft">
          {children}
        </div>
      </div>
    </div>
  );
}
