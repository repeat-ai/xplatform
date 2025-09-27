import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const CreateExperiment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    start_date: '',
    end_date: ''
  });
  
  const [treatmentUrls, setTreatmentUrls] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTreatmentUrlChange = (index: number, value: string) => {
    const newUrls = [...treatmentUrls];
    newUrls[index] = value;
    setTreatmentUrls(newUrls);
  };

  const addTreatmentUrl = () => {
    setTreatmentUrls(prev => [...prev, '']);
  };

  const removeTreatmentUrl = (index: number) => {
    if (treatmentUrls.length > 2) {
      setTreatmentUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create experiments',
        variant: 'destructive'
      });
      return;
    }

    // Validate form
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and description are required',
        variant: 'destructive'
      });
      return;
    }

    const validTreatmentUrls = treatmentUrls.filter(url => url.trim());
    if (validTreatmentUrls.length < 2) {
      toast({
        title: 'Validation Error',
        description: 'At least 2 treatment URLs are required',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('experiments')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          image_url: formData.image_url.trim() || null,
          creator_id: user.id,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          treatment_urls: validTreatmentUrls
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Experiment created successfully'
      });

      navigate(`/experiment/${data.id}`);
    } catch (error) {
      console.error('Error creating experiment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create experiment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Experiments
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please sign in to create experiments.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Experiments
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Experiment</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter experiment title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your experiment"
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Treatment URLs * (minimum 2)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTreatmentUrl}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add URL
                </Button>
              </div>
              
              <div className="space-y-3">
                {treatmentUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => handleTreatmentUrlChange(index, e.target.value)}
                      placeholder={`Treatment URL ${index + 1}`}
                      className="flex-1"
                    />
                    {treatmentUrls.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeTreatmentUrl(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              size="lg"
            >
              {loading ? 'Creating...' : 'Create Experiment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateExperiment;