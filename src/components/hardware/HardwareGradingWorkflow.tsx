/**
 * Hardware Grading Workflow
 * 
 * Complete hardware-first grading workflow with manual fallback.
 * Integrates QR scanning, weight, moisture, and image capture.
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  QrCode,
  Scale,
  Droplets,
  Camera,
  CheckCircle,
  AlertTriangle,
  Bluetooth,
  Clock,
  ArrowRight,
  Lock,
  FileCheck,
  Shield,
} from 'lucide-react';
import { DeviceStatusPanel } from './DeviceStatusPanel';
import { ManualEntryField } from './ManualEntryField';
import {
  type ScaleDevice,
  type MoistureMeterDevice,
  type DeviceReading,
  type ManualEntryReason,
  connectBluetoothScale,
  connectBluetoothMoistureMeter,
  readScaleWeight,
  readMoistureLevel,
  calculateManualEntryRiskScore,
} from '@/lib/hardware-devices';

interface BaleInfo {
  id: string;
  code: string;
  farmerName: string;
  farmerId: string;
  warehouseId?: string;
}

interface WorkflowStep {
  id: string;
  label: string;
  icon: 'qr' | 'scale' | 'moisture' | 'camera' | 'grade' | 'lock';
  status: 'pending' | 'active' | 'complete' | 'skipped';
  source?: 'hardware' | 'manual';
}

interface HardwareGradingWorkflowProps {
  onComplete: (data: {
    bale: BaleInfo;
    weight: DeviceReading<number>;
    moisture: DeviceReading<number>;
    riskScore: number;
    requiresSupervisorApproval: boolean;
  }) => void;
  className?: string;
}

export function HardwareGradingWorkflow({ onComplete, className }: HardwareGradingWorkflowProps) {
  // Device state
  const [scale, setScale] = useState<ScaleDevice | null>(null);
  const [moistureMeter, setMoistureMeter] = useState<MoistureMeterDevice | null>(null);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  // Reading state
  const [isReadingScale, setIsReadingScale] = useState(false);
  const [isReadingMoisture, setIsReadingMoisture] = useState(false);

  // Workflow data
  const [scannedBale, setScannedBale] = useState<BaleInfo | null>(null);
  const [weightReading, setWeightReading] = useState<DeviceReading<number> | null>(null);
  const [moistureReading, setMoistureReading] = useState<DeviceReading<number> | null>(null);

  // Confirmation dialogs
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  // Workflow steps
  const steps: WorkflowStep[] = [
    {
      id: 'scan',
      label: 'Scan Bale QR',
      icon: 'qr',
      status: scannedBale ? 'complete' : 'active',
    },
    {
      id: 'weight',
      label: 'Capture Weight',
      icon: 'scale',
      status: weightReading ? 'complete' : scannedBale ? 'active' : 'pending',
      source: weightReading?.source,
    },
    {
      id: 'moisture',
      label: 'Capture Moisture',
      icon: 'moisture',
      status: moistureReading ? 'complete' : weightReading ? 'active' : 'pending',
      source: moistureReading?.source,
    },
    {
      id: 'capture',
      label: 'Capture Image',
      icon: 'camera',
      status: moistureReading ? 'active' : 'pending',
    },
    {
      id: 'grade',
      label: 'Grade & Review',
      icon: 'grade',
      status: 'pending',
    },
    {
      id: 'lock',
      label: 'Lock Record',
      icon: 'lock',
      status: 'pending',
    },
  ];

  const completedSteps = steps.filter(s => s.status === 'complete').length;
  const progress = (completedSteps / steps.length) * 100;

  // Device connection handlers
  const handleConnectScale = async () => {
    const device = await connectBluetoothScale();
    if (device) {
      setScale(device);
    }
  };

  const handleConnectMoistureMeter = async () => {
    const device = await connectBluetoothMoistureMeter();
    if (device) {
      setMoistureMeter(device);
    }
  };

  // Hardware reading handlers
  const handleReadWeight = async () => {
    if (!scale) return;
    setIsReadingScale(true);
    try {
      const weight = await readScaleWeight(scale);
      if (weight !== null) {
        setWeightReading({
          value: weight,
          source: 'hardware',
          deviceId: scale.id,
          deviceName: scale.name,
          timestamp: new Date(),
          batteryLevel: scale.batteryLevel,
        });
        setScale(prev => prev ? { ...prev, lastReading: weight } : null);
      }
    } finally {
      setIsReadingScale(false);
    }
  };

  const handleReadMoisture = async () => {
    if (!moistureMeter) return;
    setIsReadingMoisture(true);
    try {
      const moisture = await readMoistureLevel(moistureMeter);
      if (moisture !== null) {
        setMoistureReading({
          value: moisture,
          source: 'hardware',
          deviceId: moistureMeter.id,
          deviceName: moistureMeter.name,
          timestamp: new Date(),
          batteryLevel: moistureMeter.batteryLevel,
        });
        setMoistureMeter(prev => prev ? { ...prev, lastReading: moisture } : null);
      }
    } finally {
      setIsReadingMoisture(false);
    }
  };

  // Manual entry handlers
  const handleManualWeight = (value: number, reason: ManualEntryReason) => {
    setWeightReading({
      value,
      source: 'manual',
      timestamp: new Date(),
      manualReason: reason,
    });
  };

  const handleManualMoisture = (value: number, reason: ManualEntryReason) => {
    setMoistureReading({
      value,
      source: 'manual',
      timestamp: new Date(),
      manualReason: reason,
    });
  };

  // Calculate risk score
  const riskScore = calculateManualEntryRiskScore(
    [weightReading, moistureReading].filter(Boolean) as DeviceReading<number>[]
  );

  // Check if supervisor approval is required
  const requiresSupervisorApproval = riskScore.level === 'high' || riskScore.level === 'critical';

  // Mock QR scan (replace with actual scanner integration)
  const handleMockScan = () => {
    setScannedBale({
      id: 'bale-001',
      code: 'BL-2024-00848',
      farmerName: 'Peter Nyambi',
      farmerId: 'FRM-001234',
      warehouseId: 'warehouse-001',
    });
  };

  const StepIcon = ({ icon, status }: { icon: WorkflowStep['icon']; status: WorkflowStep['status'] }) => {
    const iconClass = cn(
      "h-5 w-5",
      status === 'complete' ? "text-success" : 
      status === 'active' ? "text-primary" : 
      "text-muted-foreground"
    );

    switch (icon) {
      case 'qr': return <QrCode className={iconClass} />;
      case 'scale': return <Scale className={iconClass} />;
      case 'moisture': return <Droplets className={iconClass} />;
      case 'camera': return <Camera className={iconClass} />;
      case 'grade': return <FileCheck className={iconClass} />;
      case 'lock': return <Lock className={iconClass} />;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Header */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Grading Workflow</h3>
          <Badge variant="outline" className={cn(
            riskScore.level === 'low' && "bg-success/10 text-success border-success/30",
            riskScore.level === 'medium' && "bg-warning/10 text-warning border-warning/30",
            riskScore.level === 'high' && "bg-destructive/10 text-destructive border-destructive/30",
            riskScore.level === 'critical' && "bg-destructive text-destructive-foreground",
          )}>
            <Shield className="h-3 w-3 mr-1" />
            Risk: {riskScore.score}
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mb-4" />
        
        {/* Step indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                step.status === 'complete' && "bg-success/10",
                step.status === 'active' && "bg-primary/10",
                step.status === 'pending' && "bg-muted"
              )}>
                {step.status === 'complete' ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <StepIcon icon={step.icon} status={step.status} />
                )}
                <span className={cn(
                  "hidden sm:inline font-medium",
                  step.status === 'complete' ? "text-success" : 
                  step.status === 'active' ? "text-primary" : 
                  "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                {step.source === 'manual' && (
                  <AlertTriangle className="h-3 w-3 text-warning" />
                )}
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 hidden md:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Device Status */}
      <DeviceStatusPanel
        scale={scale}
        moistureMeter={moistureMeter}
        isEmergencyMode={isEmergencyMode}
        onConnectScale={handleConnectScale}
        onConnectMoistureMeter={handleConnectMoistureMeter}
        onEnterEmergencyMode={() => setIsEmergencyMode(true)}
        onExitEmergencyMode={() => setIsEmergencyMode(false)}
      />

      {/* Scanned Bale Info */}
      {scannedBale ? (
        <div className="card-elevated p-4 gradient-hero text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                <span className="font-mono text-lg font-bold">{scannedBale.code}</span>
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <p className="text-sm text-primary-foreground/80 mt-1">
                Farmer: {scannedBale.farmerName} ({scannedBale.farmerId})
              </p>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setScannedBale(null)}
            >
              Scan Different Bale
            </Button>
          </div>
        </div>
      ) : (
        <div className="card-elevated p-6">
          <div className="text-center">
            <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Step 1: Scan Bale QR Code</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Scan the bale's QR code to begin the grading process
            </p>
            <Button variant="enterprise" onClick={handleMockScan}>
              <QrCode className="h-4 w-4 mr-2" />
              Scan Bale QR
            </Button>
          </div>
        </div>
      )}

      {/* Weight Input */}
      {scannedBale && (
        <ManualEntryField
          label="Weight"
          icon="scale"
          unit="kg"
          hardwareValue={scale?.lastReading ?? null}
          hardwareDeviceName={scale?.name}
          isHardwareConnected={scale?.status === 'connected'}
          isHardwareReading={isReadingScale}
          onHardwareRead={handleReadWeight}
          onManualEntry={handleManualWeight}
          value={weightReading}
          min={10}
          max={100}
          step={0.1}
        />
      )}

      {/* Moisture Input */}
      {weightReading && (
        <ManualEntryField
          label="Moisture"
          icon="moisture"
          unit="%"
          hardwareValue={moistureMeter?.lastReading ?? null}
          hardwareDeviceName={moistureMeter?.name}
          isHardwareConnected={moistureMeter?.status === 'connected'}
          isHardwareReading={isReadingMoisture}
          onHardwareRead={handleReadMoisture}
          onManualEntry={handleManualMoisture}
          value={moistureReading}
          min={8}
          max={25}
          step={0.1}
        />
      )}

      {/* Risk Summary */}
      {(weightReading || moistureReading) && (
        <div className={cn(
          "card-elevated p-4 border-2",
          riskScore.level === 'low' && "border-success/30 bg-success/5",
          riskScore.level === 'medium' && "border-warning/30 bg-warning/5",
          riskScore.level === 'high' && "border-destructive/30 bg-destructive/5",
          riskScore.level === 'critical' && "border-destructive bg-destructive/10",
        )}>
          <div className="flex items-start gap-3">
            <Shield className={cn(
              "h-6 w-6 mt-0.5",
              riskScore.level === 'low' && "text-success",
              riskScore.level === 'medium' && "text-warning",
              (riskScore.level === 'high' || riskScore.level === 'critical') && "text-destructive",
            )} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Audit Risk Assessment</h4>
                <span className={cn(
                  "font-mono font-bold text-lg",
                  riskScore.level === 'low' && "text-success",
                  riskScore.level === 'medium' && "text-warning",
                  (riskScore.level === 'high' || riskScore.level === 'critical') && "text-destructive",
                )}>
                  {riskScore.score}/100
                </span>
              </div>
              {riskScore.factors.length > 0 ? (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1">Risk factors:</p>
                  <div className="flex flex-wrap gap-1">
                    {riskScore.factors.map((factor, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-success mt-1">
                  All readings from hardware devices - low audit risk
                </p>
              )}
              {requiresSupervisorApproval && (
                <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-destructive font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Supervisor approval required before locking
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      {moistureReading && (
        <Button
          className="w-full h-14"
          variant="enterprise"
          onClick={() => {
            if (scannedBale && weightReading && moistureReading) {
              onComplete({
                bale: scannedBale,
                weight: weightReading,
                moisture: moistureReading,
                riskScore: riskScore.score,
                requiresSupervisorApproval,
              });
            }
          }}
        >
          <Camera className="h-5 w-5 mr-2" />
          Continue to Image Capture & Grading
        </Button>
      )}
    </div>
  );
}
