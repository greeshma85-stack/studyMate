import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { BookOpen, CheckSquare, Calendar, MessageSquare, FileText } from 'lucide-react';

const features = [
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Organize your study tasks with priorities and deadlines',
  },
  {
    icon: Calendar,
    title: 'Smart Planner',
    description: 'AI-powered study schedules optimized for your goals',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat Assistant',
    description: 'Get instant help with any subject or concept',
  },
  {
    icon: FileText,
    title: 'Notes Summarizer',
    description: 'Transform lengthy notes into concise summaries',
  },
];

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6">
              <BookOpen className="h-10 w-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold font-heading text-foreground">
                {APP_NAME}
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              {APP_TAGLINE}
            </p>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Transform your study habits with AI-powered task management, 
              intelligent planning, instant doubt resolution, and smart note summarization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gradient-primary text-primary-foreground w-full sm:w-auto"
                onClick={() => navigate('/auth')}
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center font-heading mb-12">
            Everything You Need to Excel
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-lg border border-border p-6 shadow-soft hover:shadow-glow transition-shadow duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold font-heading mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-heading mb-4">
            Ready to Transform Your Studies?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of students who are already studying smarter with {APP_NAME}.
          </p>
          <Button 
            size="lg" 
            className="gradient-primary text-primary-foreground"
            onClick={() => navigate('/auth')}
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
