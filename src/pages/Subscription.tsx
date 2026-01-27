import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, Zap, RefreshCw, Settings } from 'lucide-react';
import { useSubscription, STRIPE_PRICES, PLAN_DETAILS } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Subscription() {
  const { 
    plan, 
    isSubscribed, 
    subscriptionEnd, 
    isLoading, 
    createCheckout, 
    openCustomerPortal,
    checkSubscription 
  } = useSubscription();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast({
        title: '🎉 Welcome to Premium!',
        description: 'Your subscription is now active. Enjoy unlimited access!',
      });
      checkSubscription();
    } else if (canceled === 'true') {
      toast({
        title: 'Checkout canceled',
        description: 'Your subscription was not changed.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast, checkSubscription]);

  const handleUpgrade = async (priceId: string) => {
    await createCheckout(priceId);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Upgrade to Premium
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock unlimited AI features and supercharge your study sessions
          </p>
        </div>

        {/* Current Plan Status */}
        {isSubscribed && (
          <Card className="mb-8 border-primary/50 bg-primary/5">
            <CardContent className="flex items-center justify-between py-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">You're on {PLAN_DETAILS[plan].name}</p>
                  {subscriptionEnd && (
                    <p className="text-sm text-muted-foreground">
                      Renews on {formatDate(subscriptionEnd)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={checkSubscription} disabled={isLoading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={openCustomerPortal}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <Card className={cn(
            "relative transition-all duration-200",
            plan === 'free' && "border-primary ring-2 ring-primary/20"
          )}>
            {plan === 'free' && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Current Plan
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Free
              </CardTitle>
              <CardDescription>Get started with basic features</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLAN_DETAILS.free.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                {plan === 'free' ? 'Current Plan' : 'Downgrade'}
              </Button>
            </CardFooter>
          </Card>

          {/* Monthly Plan */}
          <Card className={cn(
            "relative transition-all duration-200 border-2",
            plan === 'premium_monthly' 
              ? "border-primary ring-2 ring-primary/20" 
              : "border-primary/50 hover:border-primary"
          )}>
            {plan === 'premium_monthly' && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Current Plan
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Premium Monthly
              </CardTitle>
              <CardDescription>Unlock all features</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">${PLAN_DETAILS.premium_monthly.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLAN_DETAILS.premium_monthly.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan === 'premium_monthly' ? (
                <Button variant="outline" className="w-full" onClick={openCustomerPortal}>
                  Manage Subscription
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => handleUpgrade(STRIPE_PRICES.premium_monthly)}
                  disabled={isLoading}
                >
                  {plan === 'free' ? 'Upgrade Now' : 'Switch to Monthly'}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Yearly Plan */}
          <Card className={cn(
            "relative transition-all duration-200 border-2",
            plan === 'premium_yearly' 
              ? "border-accent ring-2 ring-accent/20" 
              : "border-accent/50 hover:border-accent"
          )}>
            <Badge variant="secondary" className="absolute -top-3 right-4 bg-accent text-accent-foreground">
              Best Value
            </Badge>
            {plan === 'premium_yearly' && (
              <Badge className="absolute -top-3 left-4">
                Current Plan
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-accent" />
                Premium Yearly
              </CardTitle>
              <CardDescription>Save 33% with annual billing</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">${PLAN_DETAILS.premium_yearly.price}</span>
                <span className="text-muted-foreground">/year</span>
                <p className="text-sm text-accent mt-1">
                  Only ${(PLAN_DETAILS.premium_yearly.price / 12).toFixed(2)}/month
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLAN_DETAILS.premium_yearly.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan === 'premium_yearly' ? (
                <Button variant="outline" className="w-full" onClick={openCustomerPortal}>
                  Manage Subscription
                </Button>
              ) : (
                <Button 
                  className="w-full bg-accent hover:bg-accent/90" 
                  onClick={() => handleUpgrade(STRIPE_PRICES.premium_yearly)}
                  disabled={isLoading}
                >
                  {plan === 'free' ? 'Get Best Value' : 'Switch to Yearly'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens to my data?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your data is always yours. If you downgrade, you'll retain access to all your notes and tasks, just with free-tier limits.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
