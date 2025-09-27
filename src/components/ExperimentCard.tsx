import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ExternalLink } from 'lucide-react';

interface Experiment {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  status: string;
  accepting_joiners: boolean;
  start_date?: string;
  end_date?: string;
}

interface ExperimentCardProps {
  experiment: Experiment;
  onClick: () => void;
  showTreatmentButton?: boolean;
  treatmentUrl?: string;
  onTreatmentClick?: () => void;
}

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

const calculateProgress = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  return ((now - start) / (end - start)) * 100;
};

export const ExperimentCard = ({ 
  experiment, 
  onClick, 
  showTreatmentButton = false, 
  treatmentUrl,
  onTreatmentClick 
}: ExperimentCardProps) => {
  const progress = calculateProgress(experiment.start_date, experiment.end_date);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        {experiment.image_url && (
          <img 
            src={experiment.image_url} 
            alt={experiment.title}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}
        <CardTitle className="text-lg">{experiment.title}</CardTitle>
        <Badge variant={getStatusColor(experiment.status, experiment.accepting_joiners)}>
          {getStatusText(experiment.status, experiment.accepting_joiners)}
        </Badge>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
          {experiment.description}
        </p>
        
        {experiment.start_date && experiment.end_date && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
      
      {showTreatmentButton && treatmentUrl && onTreatmentClick && (
        <CardFooter>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onTreatmentClick();
            }}
            className="w-full"
            variant="default"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Go to Treatment
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};