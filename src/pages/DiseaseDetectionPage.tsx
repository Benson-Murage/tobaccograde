import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Bug, Upload, ShieldAlert, TrendingUp, Activity, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface DiseaseResult {
  name: string;
  confidence: number;
  risk_level: string;
  affected_area_percent: number;
  symptoms_observed: string;
  recommended_action: string;
  location_on_leaf?: string;
}

interface AnalysisResult {
  diseases: DiseaseResult[];
  overall_health: {
    status: string;
    score: number;
    summary: string;
    grade_impact: string;
  };
  batch_recommendation: string;
  processing_time_ms: number;
}

const riskColors: Record<string, string> = {
  low: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  critical: 'bg-destructive text-destructive-foreground',
};

const healthIcons: Record<string, typeof CheckCircle> = {
  healthy: CheckCircle,
  mild_issues: AlertTriangle,
  moderate_issues: AlertTriangle,
  severe_issues: XCircle,
  critical: XCircle,
};

export default function DiseaseDetectionPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch recent detections for trends dashboard
  const { data: recentDetections } = useQuery({
    queryKey: ['disease-detections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disease_detections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Disease trend stats
  const diseaseStats = recentDetections?.reduce((acc: Record<string, number>, d: any) => {
    acc[d.disease_name] = (acc[d.disease_name] || 0) + 1;
    return acc;
  }, {}) || {};

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedImage(reader.result as string);
      analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('detect-leaf-disease', {
        body: { image_base64: base64 },
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.analysis);
        toast.success('Disease analysis complete');

        // Store results
        const { data: { user } } = await supabase.auth.getUser();
        if (user && data.analysis.diseases?.length > 0) {
          for (const disease of data.analysis.diseases) {
            const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
            if (profile?.company_id) {
              await supabase.from('disease_detections').insert({
                company_id: profile.company_id,
                grader_id: user.id,
                disease_name: disease.name,
                confidence: disease.confidence,
                risk_level: disease.risk_level,
                recommended_action: disease.recommended_action,
                affected_area_percent: disease.affected_area_percent,
                ai_raw_response: data.analysis,
                processing_time_ms: data.analysis.processing_time_ms,
              });
            }
          }
        }
      } else {
        toast.error(data.error || 'Analysis failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Disease detection failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const HealthIcon = result ? (healthIcons[result.overall_health.status] || AlertTriangle) : CheckCircle;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Disease Detection</h1>
            <p className="text-muted-foreground">AI-powered tobacco leaf disease analysis</p>
          </div>
        </div>

        <Tabs defaultValue="analyze">
          <TabsList>
            <TabsTrigger value="analyze">Analyze Leaf</TabsTrigger>
            <TabsTrigger value="trends">Disease Trends</TabsTrigger>
            <TabsTrigger value="history">Detection History</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Leaf Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedImage ? (
                    <div className="relative">
                      <img src={selectedImage} alt="Leaf" className="w-full rounded-lg border border-border" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => { setSelectedImage(null); setResult(null); }}
                      >
                        Clear
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Bug className="h-10 w-10 text-muted-foreground mb-3" />
                      <span className="text-sm text-muted-foreground">Upload leaf photo for disease analysis</span>
                      <span className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                  {analyzing && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing for diseases...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results Section */}
              <div className="space-y-4">
                {result && (
                  <>
                    {/* Overall Health */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                            result.overall_health.score >= 80 ? 'bg-success/10' : result.overall_health.score >= 50 ? 'bg-warning/10' : 'bg-destructive/10'
                          }`}>
                            <HealthIcon className={`h-6 w-6 ${
                              result.overall_health.score >= 80 ? 'text-success' : result.overall_health.score >= 50 ? 'text-warning' : 'text-destructive'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold capitalize">{result.overall_health.status.replace(/_/g, ' ')}</h3>
                              <span className="text-2xl font-bold">{result.overall_health.score}/100</span>
                            </div>
                            <Progress value={result.overall_health.score} className="mt-2 h-2" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.overall_health.summary}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Grade Impact:</span>
                          <Badge variant="outline" className={
                            result.overall_health.grade_impact === 'none' ? 'border-success/30 text-success' :
                            result.overall_health.grade_impact === 'reject' ? 'border-destructive/30 text-destructive' :
                            'border-warning/30 text-warning'
                          }>
                            {result.overall_health.grade_impact.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Detected Diseases */}
                    {result.diseases.map((disease, i) => (
                      <Card key={i}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="h-5 w-5 text-destructive" />
                              <h4 className="font-semibold">{disease.name}</h4>
                            </div>
                            <Badge className={riskColors[disease.risk_level]}>
                              {disease.risk_level} risk
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <span className="text-xs text-muted-foreground">Confidence</span>
                              <div className="flex items-center gap-2">
                                <Progress value={disease.confidence} className="h-2" />
                                <span className="text-sm font-medium">{disease.confidence}%</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Affected Area</span>
                              <p className="text-sm font-medium">{disease.affected_area_percent}%</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{disease.symptoms_observed}</p>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <span className="text-xs font-medium text-foreground">Recommended Action</span>
                            <p className="text-sm text-muted-foreground mt-1">{disease.recommended_action}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {result.diseases.length === 0 && (
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
                          <p className="font-medium">No Diseases Detected</p>
                          <p className="text-sm text-muted-foreground">Leaf appears healthy</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Batch Recommendation */}
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">Batch Recommendation</h4>
                        <p className="text-sm text-muted-foreground">{result.batch_recommendation}</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Activity className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{recentDetections?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Scans</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-8 w-8 text-destructive" />
                    <div>
                      <p className="text-2xl font-bold">
                        {recentDetections?.filter((d: any) => d.risk_level === 'high' || d.risk_level === 'critical').length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">High Risk Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-warning" />
                    <div>
                      <p className="text-2xl font-bold">{Object.keys(diseaseStats).length}</p>
                      <p className="text-sm text-muted-foreground">Disease Types Found</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Disease Distribution</CardTitle></CardHeader>
              <CardContent>
                {Object.entries(diseaseStats).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(diseaseStats).sort(([,a], [,b]) => (b as number) - (a as number)).map(([name, count]) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-48 truncate">{name}</span>
                        <div className="flex-1">
                          <Progress value={((count as number) / (recentDetections?.length || 1)) * 100} className="h-3" />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">{count as number}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No disease data yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Disease</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Area %</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDetections?.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm">{format(new Date(d.created_at), 'MMM d, HH:mm')}</TableCell>
                        <TableCell className="font-medium">{d.disease_name}</TableCell>
                        <TableCell>{d.confidence}%</TableCell>
                        <TableCell>
                          <Badge className={riskColors[d.risk_level] || ''}>{d.risk_level}</Badge>
                        </TableCell>
                        <TableCell>{d.affected_area_percent}%</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{d.recommended_action}</TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">No detections yet</TableCell>
                      </TableRow>
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
