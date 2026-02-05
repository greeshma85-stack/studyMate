 import { useEffect, useState, useCallback } from 'react';
 import { Capacitor } from '@capacitor/core';
 
 // AdMob configuration
 const ADMOB_APP_ID = 'ca-app-pub-6280078297134833~4454573990';
 const BANNER_AD_UNIT_ID = 'ca-app-pub-6280078297134833/5392650527';
 
 // Test ad unit IDs for development
 const TEST_BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';
 
 interface AdMobState {
   isInitialized: boolean;
   isBannerVisible: boolean;
   isNative: boolean;
 }
 
 export function useAdMob() {
   const [state, setState] = useState<AdMobState>({
     isInitialized: false,
     isBannerVisible: false,
     isNative: Capacitor.isNativePlatform(),
   });
 
   const initialize = useCallback(async () => {
     if (!state.isNative) {
       console.log('AdMob: Running in web, skipping initialization');
       return;
     }
 
     try {
       const { AdMob } = await import('@capacitor-community/admob');
       
       await AdMob.initialize({
         initializeForTesting: process.env.NODE_ENV === 'development',
       });
 
       setState(prev => ({ ...prev, isInitialized: true }));
       console.log('AdMob initialized successfully');
     } catch (error) {
       console.error('Failed to initialize AdMob:', error);
     }
   }, [state.isNative]);
 
   const showBanner = useCallback(async (position: 'top' | 'bottom' = 'bottom') => {
     if (!state.isNative) {
       console.log('AdMob: Running in web, skipping banner');
       return;
     }
 
     try {
       const { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } = await import('@capacitor-community/admob');
 
       // Add listener for when banner is loaded
       AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
         console.log('Banner ad loaded');
         setState(prev => ({ ...prev, isBannerVisible: true }));
       });
 
       AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
         console.error('Banner ad failed to load:', error);
       });
 
       // Use test ads in development
       const adId = process.env.NODE_ENV === 'development' 
         ? TEST_BANNER_AD_UNIT_ID 
         : BANNER_AD_UNIT_ID;
 
       await AdMob.showBanner({
         adId,
         adSize: BannerAdSize.ADAPTIVE_BANNER,
         position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
         margin: position === 'bottom' ? 60 : 0, // Account for bottom nav
         isTesting: process.env.NODE_ENV === 'development',
       });
     } catch (error) {
       console.error('Failed to show banner:', error);
     }
   }, [state.isNative]);
 
   const hideBanner = useCallback(async () => {
     if (!state.isNative) return;
 
     try {
       const { AdMob } = await import('@capacitor-community/admob');
       await AdMob.hideBanner();
       setState(prev => ({ ...prev, isBannerVisible: false }));
     } catch (error) {
       console.error('Failed to hide banner:', error);
     }
   }, [state.isNative]);
 
   const removeBanner = useCallback(async () => {
     if (!state.isNative) return;
 
     try {
       const { AdMob } = await import('@capacitor-community/admob');
       await AdMob.removeBanner();
       setState(prev => ({ ...prev, isBannerVisible: false }));
     } catch (error) {
       console.error('Failed to remove banner:', error);
     }
   }, [state.isNative]);
 
   useEffect(() => {
     initialize();
   }, [initialize]);
 
   return {
     ...state,
     showBanner,
     hideBanner,
     removeBanner,
     initialize,
     adUnitId: BANNER_AD_UNIT_ID,
     appId: ADMOB_APP_ID,
   };
 }