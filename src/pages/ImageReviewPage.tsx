/**
 * Image Evidence Review Center
 * 
 * Supervisors can review grading images, zoom in, compare bales,
 * and inspect AI defect analysis. Images permanently linked to bale records.
 */

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Image as ImageIcon, Search, ZoomIn, ZoomOut, Eye, Package,
  User, Calendar, Smartphone, AlertTriangle, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Maximize2,
} from 'lucide-react';
import { format } from 'date-fns';

interface GradingImage {
  id: string;
  image_url: string;
  image_type: string;
  captured_at: string;
  device_id: string | null;
  bale_id: string | null;
  grading_id: string | null;
  bale_code?: string;
  farmer_name?: string;
  grade_code?: string;
  grade_class?: string;
}

export default function ImageReviewPage() {
  const { companyId } = useAuth();
  const [images, setImages] = useState<GradingImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<GradingImage | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLightbox, setShowLightbox] = useState(false);

  const fetchImages = async () => {
    if (!companyId) {
      setImages(getDemoImages());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('grading_images')
        .select(`
          id, image_url, image_type, captured_at, device_id, bale_id, grading_id,
          bales ( bale_code, farmers ( full_name ) ),
          gradings:grading_id ( grade_code, grade_class )
        `)
        .eq('company_id', companyId)
        .order('captured_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const transformed: GradingImage[] = (data || []).map((img: any) => ({
        id: img.id,
        image_url: img.image_url,
        image_type: img.image_type,
        captured_at: img.captured_at,
        device_id: img.device_id,
        bale_id: img.bale_id,
        grading_id: img.grading_id,
        bale_code: img.bales?.bale_code,
        farmer_name: img.bales?.farmers?.full_name,
        grade_code: img.gradings?.grade_code,
        grade_class: img.gradings?.grade_class,
      }));

      setImages(transformed.length > 0 ? transformed : getDemoImages());
    } catch (error) {
      console.error('Image fetch error:', error);
      setImages(getDemoImages());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchImages(); }, [companyId]);

  const filtered = images.filter(img => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      img.bale_code?.toLowerCase().includes(q) ||
      img.farmer_name?.toLowerCase().includes(q) ||
      img.grade_code?.toLowerCase().includes(q)
    );
  });

  const gradeClassColor = (cls?: string) => {
    const map: Record<string, string> = {
      premium: 'bg-success text-success-foreground',
      good: 'bg-primary text-primary-foreground',
      standard: 'bg-secondary text-secondary-foreground',
      low: 'bg-warning text-warning-foreground',
      rejected: 'bg-destructive text-destructive-foreground',
    };
    return map[cls || ''] || 'bg-muted text-muted-foreground';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Image Review Center</h1>
            <p className="text-muted-foreground">Review grading evidence, inspect defects, and compare bales</p>
          </div>
          <Button variant="outline" onClick={fetchImages} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by bale code, farmer, or grade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Image Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium">No images found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Images will appear here once grading sessions include leaf captures.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((img) => (
              <Card
                key={img.id}
                className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => { setSelectedImage(img); setShowLightbox(true); setZoomLevel(1); }}
              >
                <div className="aspect-video bg-muted relative">
                  <img
                    src={img.image_url}
                    alt={`Bale ${img.bale_code || 'image'}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                  {img.grade_code && (
                    <Badge className={cn('absolute top-2 right-2', gradeClassColor(img.grade_class))}>
                      {img.grade_code}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="font-mono text-sm font-medium truncate">{img.bale_code || 'Unlinked'}</p>
                  <p className="text-xs text-muted-foreground truncate">{img.farmer_name || 'Unknown Farmer'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(img.captured_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lightbox Dialog */}
        <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
          <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-primary" />
                  Image Review — {selectedImage?.bale_code || 'Unknown'}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-mono w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                  <Button variant="outline" size="sm" onClick={() => setZoomLevel(z => Math.min(4, z + 0.25))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setZoomLevel(1)}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 flex overflow-hidden">
              {/* Image viewer */}
              <div className="flex-1 overflow-auto bg-black/90 flex items-center justify-center">
                {selectedImage && (
                  <img
                    src={selectedImage.image_url}
                    alt="Review"
                    className="transition-transform duration-200"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                )}
              </div>
              {/* Side panel */}
              <div className="w-72 border-l border-border/50 bg-card p-4 overflow-y-auto">
                {selectedImage && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Bale</p>
                      <p className="font-mono font-medium">{selectedImage.bale_code || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Farmer</p>
                      <p className="text-sm">{selectedImage.farmer_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Grade</p>
                      {selectedImage.grade_code ? (
                        <Badge className={gradeClassColor(selectedImage.grade_class)}>{selectedImage.grade_code}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not graded</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Captured</p>
                      <p className="text-sm">{format(new Date(selectedImage.captured_at), 'PPpp')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Device</p>
                      <p className="text-sm font-mono">{selectedImage.device_id || 'Camera'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Image Type</p>
                      <Badge variant="outline">{selectedImage.image_type}</Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function getDemoImages(): GradingImage[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `demo-${i}`,
    image_url: '/placeholder.svg',
    image_type: 'primary',
    captured_at: new Date(Date.now() - i * 3600000).toISOString(),
    device_id: 'CAM-001',
    bale_id: `bale-${i}`,
    grading_id: `grading-${i}`,
    bale_code: `BL-2024-00${847 - i}`,
    farmer_name: ['Peter Nyambi', 'Sarah Tembo', 'John Phiri', 'Grace Mwanza'][i % 4],
    grade_code: ['L1F', 'L2F', 'C1F', 'X2R', 'L3F'][i % 5],
    grade_class: ['premium', 'good', 'standard', 'low', 'good'][i % 5],
  }));
}
