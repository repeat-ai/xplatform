import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, LogIn, LogOut } from 'lucide-react';
import { ExperimentGallery } from '@/components/ExperimentGallery';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { toast } = useToast();
  const [authLoading, setAuthLoading] = useState(false);

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'Sign In Error',
        description: 'Failed to sign in with Google. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.'
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Sign Out Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleExperimentClick = (experimentId: string) => {
    navigate(`/experiment/${experimentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ExperiMarket</h1>
            <p className="text-muted-foreground text-sm">
              Discover and join crowdsourced experiments
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.user_metadata?.full_name || user.email}
                </span>
                <Button
                  onClick={() => navigate('/create')}
                  variant="default"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Experiment
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={handleSignIn}
                disabled={authLoading}
                variant="default"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {authLoading ? 'Signing in...' : 'Sign in with Google'}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!user && (
          <Card className="mb-8 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-xl">Welcome to ExperiMarket</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Join crowdsourced experiments and contribute to research! 
                Sign in with Google to participate in experiments and create your own.
              </p>
              <Button onClick={handleSignIn} disabled={authLoading}>
                <LogIn className="w-4 h-4 mr-2" />
                {authLoading ? 'Signing in...' : 'Get Started with Google'}
              </Button>
            </CardContent>
          </Card>
        )}

        <ExperimentGallery onExperimentClick={handleExperimentClick} />
      </main>
    </div>
  );
};

export default Index;
