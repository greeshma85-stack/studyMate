 import { useEffect } from 'react';
 import { useAdMob } from '@/hooks/useAdMob';
 import { useSubscription } from '@/hooks/useSubscription';
 
 interface AdBannerProps {
   position?: 'top' | 'bottom';
 }
 
 export function AdBanner({ position = 'bottom' }: AdBannerProps) {
   const { isInitialized, isNative, showBanner, removeBanner } = useAdMob();
   const { isSubscribed } = useSubscription();
 
   useEffect(() => {
     // Don't show ads to premium subscribers
     if (isSubscribed) {
       removeBanner();
       return;
     }
 
     // Show banner when initialized on native platform
     if (isInitialized && isNative) {
       showBanner(position);
     }
 
     // Cleanup on unmount
     return () => {
       removeBanner();
     };
   }, [isInitialized, isNative, isSubscribed, position, showBanner, removeBanner]);
 
   // This component doesn't render anything visible in the DOM
   // The native AdMob SDK handles the actual ad display
   // On web, we show a placeholder for development/testing
   if (!isNative && process.env.NODE_ENV === 'development') {
     return (
       <div 
         className={`fixed ${position === 'top' ? 'top-16' : 'bottom-20 md:bottom-4'} left-0 right-0 z-40 flex justify-center pointer-events-none`}
       >
         <div className="bg-muted/80 backdrop-blur-sm border border-border rounded-lg px-4 py-2 text-xs text-muted-foreground">
           📱 AdMob Banner (Native Only)
         </div>
       </div>
     );
   }
 
   return null;
 }