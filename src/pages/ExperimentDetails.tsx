import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ExternalLink, Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Experiment {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  status: string;
  accepting_joiners: boolean;
  start_date?: string;
  end_date?: string;
  treatment_urls: any;
}

interface UserExperiment {
  id: string;
  treatment_url?: string;
  joined_at: string;
}

const ExperimentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [userExperiment, setUserExperiment] = useState<UserExperiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchExperiment();
      if (user) {
        fetchUserExperiment();
      }
    }
  }, [id, user]);

  const fetchExperiment = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setExperiment(data);
    } catch (error) {
      console.error('Error fetching experiment:', error);
      toast({
        title: 'Error',
        description: 'Experiment not found',
        variant: 'destructive'
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserExperiment = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('user_experiments')
        .select('*')
        .eq('user_id', user.id)
        .eq('experiment_id', id)
        .is('left_at', null)
        .maybeSingle();

      if (error) throw error;
      setUserExperiment(data);
    } catch (error) {
      console.error('Error fetching user experiment:', error);
    }
  };

  const joinExperiment = async () => {
    if (!user || !experiment) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to join experiments',
        variant: 'destructive'
      });
      return;
    }

    setActionLoading(true);

    try {
      // Call the allocation API to get a treatment
      const { data, error } = await supabase.functions.invoke('allocate-treatment', {
        body: { experimentId: experiment.id }
      });

      if (error) throw error;

      // Refresh user experiment data
      await fetchUserExperiment();
      
      toast({
        title: 'Success!',
        description: 'You have joined the experiment'
      });
    } catch (error) {
      console.error('Error joining experiment:', error);
      toast({
        title: 'Error',
        description: 'Failed to join experiment',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const leaveExperiment = async () => {
    if (!user || !userExperiment) return;

    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('user_experiments')
        .update({ left_at: new Date().toISOString() })
        .eq('id', userExperiment.id);

      if (error) throw error;

      setUserExperiment(null);
      toast({
        title: 'Success',
        description: 'You have left the experiment'
      });
    } catch (error) {
      console.error('Error leaving experiment:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave experiment',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTreatmentClick = () => {
    if (userExperiment?.treatment_url) {
      window.open(userExperiment.treatment_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Experiments
        </Button>
        <p>Experiment not found</p>
      </div>
    );
  }

  const progress = experiment.start_date && experiment.end_date ? 
    (() => {
      const start = new Date(experiment.start_date).getTime();
      const end = new Date(experiment.end_date).getTime();
      const now = new Date().getTime();
      
      if (now < start) return 0;
      if (now > end) return 100;
      
      return ((now - start) / (end - start)) * 100;
    })() : 0;

  const getStatusColor = (status: string, acceptingJoiners: boolean) => {
    if (status === 'ended') return 'destructive';
    if (status === 'ongoing' && acceptingJoiners) return 'default';
    if (status === 'ongoing' && !acceptingJoiners) return 'secondary';
    return 'outline';
  };

  const getStatusText = (status: string, acceptingJoiners: boolean) => {
    if (status === 'ended') return 'Ended';
    if (status === 'ongoing' && acceptingJoiners) return 'Accepting Joiners';
    if (status === 'ongoing' && !acceptingJoiners) return 'Not Accepting Joiners';
    return 'Not Started';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Experiments
      </Button>

      <Card>
        <CardHeader>
          {experiment.image_url && (
            <img 
              src={experiment.image_url} 
              alt={experiment.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
          
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl mb-2">{experiment.title}</CardTitle>
              <Badge variant={getStatusColor(experiment.status, experiment.accepting_joiners)}>
                {getStatusText(experiment.status, experiment.accepting_joiners)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-lg">{experiment.description}</p>

          {experiment.start_date && experiment.end_date && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(experiment.start_date).toLocaleDateString()} - {new Date(experiment.end_date).toLocaleDateString()}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {!user ? (
              <p className="text-muted-foreground">
                <Users className="w-4 h-4 inline mr-1" />
                Sign in to join this experiment
              </p>
            ) : userExperiment ? (
              <div className="flex gap-4">
                {userExperiment.treatment_url && (
                  <Button onClick={handleTreatmentClick} size="lg">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Go to Treatment
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={leaveExperiment}
                  disabled={actionLoading}
                  size="lg"
                >
                  Leave Experiment
                </Button>
              </div>
            ) : (
              <Button 
                onClick={joinExperiment}
                disabled={actionLoading || !experiment.accepting_joiners || experiment.status === 'ended'}
                size="lg"
              >
                {actionLoading ? 'Joining...' : 'Join Experiment'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExperimentDetails;