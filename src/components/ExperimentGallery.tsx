import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExperimentCard } from './ExperimentCard';
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
  treatment_urls?: any;
}

interface UserExperiment {
  id: string;
  experiment_id: string;
  treatment_url?: string;
  left_at?: string;
  experiments: Experiment;
}

interface ExperimentGalleryProps {
  onExperimentClick: (experimentId: string) => void;
}

export const ExperimentGallery = ({ onExperimentClick }: ExperimentGalleryProps) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [userExperiments, setUserExperiments] = useState<UserExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchExperiments();
    if (user) {
      fetchUserExperiments();
    }
  }, [user]);

  const fetchExperiments = async () => {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExperiments(data || []);
    } catch (error) {
      console.error('Error fetching experiments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load experiments',
        variant: 'destructive'
      });
    }
  };

  const fetchUserExperiments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_experiments')
        .select(`
          *,
          experiments (*)
        `)
        .eq('user_id', user.id)
        .is('left_at', null);

      if (error) throw error;
      setUserExperiments(data || []);
    } catch (error) {
      console.error('Error fetching user experiments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your experiments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTreatmentClick = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted rounded-lg h-64"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* User's Joined Experiments */}
      {user && userExperiments.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Your Experiments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userExperiments.map((userExp) => (
              <ExperimentCard
                key={userExp.id}
                experiment={userExp.experiments}
                onClick={() => onExperimentClick(userExp.experiment_id)}
                showTreatmentButton={!!userExp.treatment_url}
                treatmentUrl={userExp.treatment_url || undefined}
                onTreatmentClick={() => userExp.treatment_url && handleTreatmentClick(userExp.treatment_url)}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Experiments Gallery */}
      <section>
        <h2 className="text-2xl font-bold mb-6">
          {user && userExperiments.length > 0 ? 'Discover More Experiments' : 'Experiments'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiments.map((experiment) => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              onClick={() => onExperimentClick(experiment.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};