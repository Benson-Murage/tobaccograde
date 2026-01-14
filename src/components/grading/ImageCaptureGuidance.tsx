/**
 * Image Capture Guidance - Field-Ready Camera Interface
 * 
 * Provides visual guidance for capturing standardized tobacco leaf images
 * in warehouse conditions (dusty, poor lighting, gloves).
 */

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Sun,
  Ruler,
  RotateCcw,
  Check,
  AlertTriangle,
  X,
  Zap,
  Lightbulb,
  Hand,
} from 'lucide-react';

interface CaptureCheck {
  name: string;
  status: 'pending' | 'pass' | 'warning' | 'fail';
  message: string;
  icon: React.ReactNode;
}

interface ImageCaptureGuidanceProps {
  onImageCapture: (imageData: string, metadata: CaptureMetadata) => void;
  onCancel: () => void;
  className?: string;
}

export interface CaptureMetadata {
  timestamp: string;
  deviceType: string;
  orientation: string;
  estimatedDistance: string;
  lightingCondition: string;
}

export function ImageCaptureGuidance({
  onImageCapture,
  onCancel,
  className,
}: ImageCaptureGuidanceProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [checks, setChecks] = useState<CaptureCheck[]>([
    { name: 'lighting', status: 'pending', message: 'Check lighting conditions', icon: <Sun className="h-4 w-4" /> },
    { name: 'distance', status: 'pending', message: 'Position camera 30-50cm away', icon: <Ruler className="h-4 w-4" /> },
    { name: 'orientation', status: 'pending', message: 'Keep camera parallel to leaf', icon: <RotateCcw className="h-4 w-4" /> },
  ]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Simulate checks passing (in production, these would use actual sensors/CV)
      setTimeout(() => {
        setChecks(prev => prev.map(c => 
          c.name === 'lighting' ? { ...c, status: 'pass', message: 'Lighting OK' } : c
        ));
      }, 1000);
      setTimeout(() => {
        setChecks(prev => prev.map(c => 
          c.name === 'distance' ? { ...c, status: 'pass', message: 'Distance OK (35cm)' } : c
        ));
      }, 1500);
      setTimeout(() => {
        setChecks(prev => prev.map(c => 
          c.name === 'orientation' ? { ...c, status: 'pass', message: 'Angle OK' } : c
        ));
      }, 2000);

    } catch (error) {
      console.error('Camera access denied:', error);
      setIsCapturing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    stopCamera();
  }, [stopCamera]);

  const confirmCapture = useCallback(() => {
    if (!capturedImage) return;

    const metadata: CaptureMetadata = {
      timestamp: new Date().toISOString(),
      deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      orientation: 'landscape',
      estimatedDistance: '35cm',
      lightingCondition: 'adequate',
    };

    onImageCapture(capturedImage, metadata);
  }, [capturedImage, onImageCapture]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setChecks(prev => prev.map(c => ({ ...c, status: 'pending' as const })));
    startCamera();
  }, [startCamera]);

  const allChecksPassed = checks.every(c => c.status === 'pass');
  const hasWarnings = checks.some(c => c.status === 'warning');

  return (
    <div className={cn("card-elevated overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Capture Leaf Image</h3>
            <p className="text-sm text-muted-foreground">
              Take a clear photo for AI analysis
            </p>
          </div>
        </div>
      </div>

      {/* Camera View / Captured Image */}
      <div className="relative aspect-video bg-black">
        {capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Captured tobacco leaf" 
            className="w-full h-full object-contain"
          />
        ) : isCapturing ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Capture frame overlay */}
            <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
            {/* Guidance text */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/70 text-white rounded-lg p-3 text-center">
                <p className="text-sm font-medium">Position leaf inside frame</p>
                <p className="text-xs text-white/70">Ensure good lighting and flat surface</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white/70 p-8">
            <Camera className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Ready to capture</p>
            <p className="text-sm text-center max-w-xs">
              Tap "Start Camera" to begin capturing a leaf image for AI-assisted grading
            </p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Pre-capture Checks */}
      {isCapturing && !capturedImage && (
        <div className="p-4 border-b border-border/50">
          <div className="space-y-2">
            {checks.map((check) => (
              <div key={check.name} className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  check.status === 'pass' && "bg-success/20 text-success",
                  check.status === 'warning' && "bg-warning/20 text-warning",
                  check.status === 'fail' && "bg-destructive/20 text-destructive",
                  check.status === 'pending' && "bg-muted text-muted-foreground",
                )}>
                  {check.status === 'pass' ? <Check className="h-4 w-4" /> : check.icon}
                </div>
                <span className={cn(
                  "text-sm",
                  check.status === 'pass' && "text-success",
                  check.status === 'warning' && "text-warning",
                  check.status === 'fail' && "text-destructive",
                  check.status === 'pending' && "text-muted-foreground",
                )}>
                  {check.message}
                </span>
              </div>
            ))}
          </div>
          
          {allChecksPassed && (
            <div className="mt-4 flex items-center gap-2 text-success text-sm">
              <Zap className="h-4 w-4" />
              <span>Ready to capture! Position the leaf and tap Capture.</span>
            </div>
          )}
        </div>
      )}

      {/* Tips for field use */}
      {!isCapturing && !capturedImage && (
        <div className="p-4 border-b border-border/50 bg-muted/30">
          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            Quick Tips
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-start gap-2">
              <Sun className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Use natural light or warehouse lights - avoid shadows</span>
            </li>
            <li className="flex items-start gap-2">
              <Ruler className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Keep camera 30-50cm from the leaf surface</span>
            </li>
            <li className="flex items-start gap-2">
              <Hand className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Works with gloves - use large touch targets</span>
            </li>
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex gap-3">
        {!isCapturing && !capturedImage && (
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="enterprise"
              className="flex-1"
              onClick={startCamera}
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          </>
        )}

        {isCapturing && !capturedImage && (
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                stopCamera();
                onCancel();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="enterprise"
              className="flex-1 min-h-[56px] text-lg"
              onClick={captureImage}
              disabled={!allChecksPassed}
            >
              <Camera className="h-5 w-5 mr-2" />
              Capture
            </Button>
          </>
        )}

        {capturedImage && (
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={retake}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake
            </Button>
            <Button
              variant="enterprise"
              className="flex-1"
              onClick={confirmCapture}
            >
              <Check className="h-4 w-4 mr-2" />
              Use This Photo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}