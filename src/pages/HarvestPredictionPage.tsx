import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Sprout, Upload, TrendingUp, DollarSign, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface HarvestPrediction {
  predicted_grade: { grade: string; grade_class: string; confidence: number; reasoning: string };
  yield_estimate: { kg_per_hectare: number; confidence: number; notes?: string };
  growth_stage: { stage: string; days_to_harvest: number; notes?: string };
  potential_issues: Array<{ issue: string; severity: string; recommendation: string }>;
  harvest_recommendation: string;
  value_estimate: { usd_per_kg: number; total_estimate_per_hectare: number; notes?: string };
  processing_time_ms: number;
}

const gradeColors: Record<string, string> = {
  A: 'bg-success/10 text-success border-success/20',
  B: 'bg-primary/10 text-primary border-primary/20',
  C: 'bg-warning/10 text-warning border-warning/20',
  Reject: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function HarvestPredictionPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<HarvestPrediction | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: predictions } = useQuery({
    queryKey: ['harvest-predictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('harvest_predictions')
        .select(`*, farmers(full_name, farmer_code)`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedImage(reader.result as string);
      analyzePrediction(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzePrediction = async (base64: string) => {
    setAnalyzing(true);
    setPrediction(null);
    try {
      const { data, error } = await supabase.functions.invoke('predict-harvest', {
        body: { image_base64: base64 },
      });
      if (error) throw error;
      if (data.success) {
        setPrediction(data.prediction);
        toast.success('Harvest prediction complete');

        // Store prediction
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
          if (profile?.company_id) {
            await supabase.from('harvest_predictions').insert({
              company_id: profile.company_id,
              farmer_id: user.id, // Placeholder; real flow would select farmer
              predicted_grade: data.prediction.predicted_grade.grade,
              predicted_grade_class: data.prediction.predicted_grade.grade_class,
              confidence: data.prediction.predicted_grade.confidence,
              predicted_yield_kg: data.prediction.yield_estimate.kg_per_hectare,
              predicted_value: data.prediction.value_estimate.total_estimate_per_hectare,
              ai_analysis: data.prediction,
              processing_time_ms: data.prediction.processing_time_ms,
            });
          }
        }
      } else {
        toast.error(data.error || 'Prediction failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Prediction failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sprout className="h-6 w-6 text-primary" />
            Pre-Harvest Prediction
          </h1>
          <p className="text-muted-foreground">AI-powered grade and yield prediction from field images</p>
        </div>

        <Tabs defaultValue="predict">
          <TabsList>
            <TabsTrigger value="predict">New Prediction</TabsTrigger>
            <TabsTrigger value="history">Prediction History</TabsTrigger>
          </TabsList>

          <TabsContent value="predict" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Field Image</CardTitle></CardHeader>
                <CardContent>
                  {selectedImage ? (
                    <div className="relative">
                      <img src={selectedImage} alt="Field" className="w-full rounded-lg border border-border" />
                      <Button variant="outline" size="sm" className="absolute top-2 right-2"
                        onClick={() => { setSelectedImage(null); setPrediction(null); }}>Clear</Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Sprout className="h-10 w-10 text-muted-foreground mb-3" />
                      <span className="text-sm text-muted-foreground">Upload field photo for prediction</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                  {analyzing && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />Analyzing field conditions...</div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                {prediction && (
                  <>
                    {/* Grade Prediction */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Predicted Grade</h3>
                          <Badge className={`text-lg px-4 py-1 ${gradeColors[prediction.predicted_grade.grade] || ''}`}>
                            Grade {prediction.predicted_grade.grade}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-muted-foreground">Confidence</span>
                          <Progress value={prediction.predicted_grade.confidence} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{prediction.predicted_grade.confidence}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{prediction.predicted_grade.reasoning}</p>
                      </CardContent>
                    </Card>

                    {/* Yield & Value */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <TrendingUp className="h-6 w-6 text-primary mb-2" />
                          <p className="text-2xl font-bold">{prediction.yield_estimate.kg_per_hectare.toLocaleString()} kg</p>
                          <p className="text-sm text-muted-foreground">per hectare</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <DollarSign className="h-6 w-6 text-success mb-2" />
                          <p className="text-2xl font-bold">${prediction.value_estimate.total_estimate_per_hectare.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">est. value/ha</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Growth Stage */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Growth Stage</h4>
                        </div>
                        <p className="text-sm capitalize">{prediction.growth_stage.stage.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground mt-1">~{prediction.growth_stage.days_to_harvest} days to harvest</p>
                        <p className="text-sm text-muted-foreground mt-2">{prediction.harvest_recommendation}</p>
                      </CardContent>
                    </Card>

                    {/* Issues */}
                    {prediction.potential_issues.length > 0 && (
                      <Card>
                        <CardContent className="pt-6">
                          <h4 className="font-semibold flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-5 w-5 text-warning" />Potential Issues
                          </h4>
                          <div className="space-y-3">
                            {prediction.potential_issues.map((issue, i) => (
                              <div key={i} className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{issue.issue}</span>
                                  <Badge variant="outline">{issue.severity}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{issue.recommendation}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Farmer</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Yield (kg/ha)</TableHead>
                      <TableHead>Value ($/ha)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions?.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{format(new Date(p.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="font-medium">{p.farmers?.full_name || '—'}</TableCell>
                        <TableCell><Badge className={gradeColors[p.predicted_grade] || ''}>{p.predicted_grade}</Badge></TableCell>
                        <TableCell>{p.confidence}%</TableCell>
                        <TableCell>{p.predicted_yield_kg?.toLocaleString() || '—'}</TableCell>
                        <TableCell>${p.predicted_value?.toLocaleString() || '—'}</TableCell>
                      </TableRow>
                    )) || (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No predictions yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
