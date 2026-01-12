import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, RotateCcw, Flashlight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose?: () => void;
  className?: string;
}

export function QRScanner({ onScan, onClose, className }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCamera, setCurrentCamera] = useState<number>(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>("qr-reader-" + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
        } else {
          setError("No cameras found on this device");
        }
      })
      .catch((err) => {
        setError("Camera access denied. Please allow camera permissions.");
        console.error("Camera error:", err);
      });

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!cameras.length) {
      setError("No cameras available");
      return;
    }

    setError(null);
    setIsScanning(true);

    try {
      scannerRef.current = new Html5Qrcode(containerRef.current);
      
      await scannerRef.current.start(
        cameras[currentCamera].id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {
          // QR code not found - this is called frequently, ignore
        }
      );
    } catch (err) {
      setError("Failed to start camera. Please try again.");
      setIsScanning(false);
      console.error("Scanner error:", err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Stop error:", err);
      }
    }
    setIsScanning(false);
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    
    await stopScanning();
    setCurrentCamera((prev) => (prev + 1) % cameras.length);
    setTimeout(startScanning, 100);
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Scanner Container */}
      <div className="relative w-full max-w-sm">
        <div
          id={containerRef.current}
          className={cn(
            "w-full aspect-square rounded-xl overflow-hidden bg-muted",
            !isScanning && "flex items-center justify-center"
          )}
        >
          {!isScanning && !error && (
            <div className="text-center p-8">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Click "Start Scanning" to activate camera
              </p>
            </div>
          )}
          {error && (
            <div className="text-center p-8">
              <CameraOff className="h-16 w-16 text-destructive mx-auto mb-4" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-4 border-primary/50 rounded-xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary animate-pulse" 
                   style={{ animation: "scan 2s ease-in-out infinite" }} />
            </div>
          </div>
        )}

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mt-4">
        {!isScanning ? (
          <Button onClick={startScanning} variant="enterprise" disabled={!!error && !cameras.length}>
            <Camera className="h-4 w-4 mr-2" />
            Start Scanning
          </Button>
        ) : (
          <>
            <Button onClick={stopScanning} variant="outline">
              <CameraOff className="h-4 w-4 mr-2" />
              Stop
            </Button>
            {cameras.length > 1 && (
              <Button onClick={switchCamera} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Switch Camera
              </Button>
            )}
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Position the QR code within the frame to scan
        </p>
        {cameras.length > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            Using: {cameras[currentCamera]?.label || "Camera " + (currentCamera + 1)}
          </p>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(248px); }
        }
      `}</style>
    </div>
  );
}
