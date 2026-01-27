import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type SubscriptionPlan = 'free' | 'premium_monthly' | 'premium_yearly';

interface SubscriptionState {
  isSubscribed: boolean;
  plan: SubscriptionPlan;
  subscriptionEnd: string | null;
  priceId: string | null;
  isLoading: boolean;
}

// Stripe price IDs
export const STRIPE_PRICES = {
  premium_monthly: 'price_1SnrAqFVUNnbAKuOnqCUvXnQ',
  premium_yearly: 'price_1SnrFiFVUNnbAKuORJKxYjRX',
} as const;

export const PLAN_DETAILS = {
  free: {
    name: 'Free',
    price: 0,
    interval: null,
    features: [
      '10 AI chat messages per day',
      '3 note summaries per day',
      '20 tasks per day',
      'Basic study planner',
    ],
  },
  premium_monthly: {
    name: 'Premium Monthly',
    price: 9.99,
    interval: 'month',
    features: [
      'Unlimited AI chat messages',
      'Unlimited note summaries',
      'Unlimited tasks',
      'AI-powered study planning',
      'Advanced analytics',
      'Priority support',
    ],
  },
  premium_yearly: {
    name: 'Premium Yearly',
    price: 79.99,
    interval: 'year',
    features: [
      'Everything in Premium',
      '2 months free (save $40)',
      'Early access to new features',
    ],
  },
} as const;

export function useSubscription() {
  const { session, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    plan: 'free',
    subscriptionEnd: null,
    priceId: null,
    isLoading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!isAuthenticated || !session) {
      setState({
        isSubscribed: false,
        plan: 'free',
        subscriptionEnd: null,
        priceId: null,
        isLoading: false,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      setState({
        isSubscribed: data.subscribed,
        plan: data.plan as SubscriptionPlan,
        subscriptionEnd: data.subscription_end,
        priceId: data.price_id,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, session]);

  useEffect(() => {
    checkSubscription();
    
    // Auto-refresh subscription status every minute
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const createCheckout = async (priceId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to subscribe',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Error',
        description: 'Failed to create checkout session',
        variant: 'destructive',
      });
    }
  };

  const openCustomerPortal = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to manage your subscription',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open subscription management portal',
        variant: 'destructive',
      });
    }
  };

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
