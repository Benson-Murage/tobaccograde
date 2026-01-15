/**
 * Manual Entry Field
 * 
 * Hardware-first input with collapsible manual fallback.
 * Manual entries are clearly marked and audited.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Scale,
  Droplets,
  Pencil,
  CheckCircle,
  Bluetooth,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  type DeviceReading,
  type ManualEntryReason,
  MANUAL_ENTRY_REASONS,
} from '@/lib/hardware-devices';

interface ManualEntryFieldProps {
  label: string;
  icon: 'scale' | 'moisture';
  unit: string;
  hardwareValue: number | null;
  hardwareDeviceName?: string;
  isHardwareConnected: boolean;
  isHardwareReading: boolean;
  onHardwareRead: () => Promise<void>;
  onManualEntry: (value: number, reason: ManualEntryReason) => void;
  value: DeviceReading<number> | null;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

const IconComponent = ({ icon }: { icon: 'scale' | 'moisture' }) => {
  switch (icon) {
    case 'scale':
      return <Scale className="h-5 w-5" />;
    case 'moisture':
      return <Droplets className="h-5 w-5" />;
  }
};

export function ManualEntryField({
  label,
  icon,
  unit,
  hardwareValue,
  hardwareDeviceName,
  isHardwareConnected,
  isHardwareReading,
  onHardwareRead,
  onManualEntry,
  value,
  min = 0,
  max = 100,
  step = 0.1,
  className,
}: ManualEntryFieldProps) {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState<string>('');
  const [manualReason, setManualReason] = useState<ManualEntryReason | ''>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleManualSubmit = () => {
    if (!manualReason || !manualValue) return;
    setShowConfirmDialog(true);
  };

  const confirmManualEntry = () => {
    const numValue = parseFloat(manualValue);
    if (isNaN(numValue) || !manualReason) return;
    onManualEntry(numValue, manualReason);
    setShowConfirmDialog(false);
    setIsManualOpen(false);
    setManualValue('');
    setManualReason('');
  };

  const isOutOfRange = value && (value.value < min || value.value > max);

  return (
    <>
      <div className={cn("card-elevated overflow-hidden", className)}>
        {/* Header */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <IconComponent icon={icon} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{label}</h3>
                {value?.source === 'manual' && (
                  <Badge variant="outline" className="mt-1 bg-warning/10 text-warning border-warning/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Manual Entry
                  </Badge>
                )}
                {value?.source === 'hardware' && (
                  <Badge variant="outline" className="mt-1 bg-success/10 text-success border-success/30">
                    <Bluetooth className="h-3 w-3 mr-1" />
                    {value.deviceName || 'Hardware'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Current Value Display */}
            {value && (
              <div className={cn(
                "text-right px-4 py-2 rounded-lg",
                value.source === 'manual' 
                  ? "bg-warning/10 border border-warning/30" 
                  : "bg-success/10 border border-success/30",
                isOutOfRange && "bg-destructive/10 border-destructive/30"
              )}>
                <div className={cn(
                  "text-2xl font-mono font-bold",
                  value.source === 'manual' ? "text-warning" : "text-success",
                  isOutOfRange && "text-destructive"
                )}>
                  {value.value.toFixed(1)}{unit}
                </div>
                <div className="text-xs text-muted-foreground">
                  {value.source === 'hardware' ? 'From device' : 'Manual'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hardware Read Section */}
        <div className="p-4 space-y-3">
          {isHardwareConnected ? (
            <Button
              className="w-full h-14"
              variant="enterprise"
              onClick={onHardwareRead}
              disabled={isHardwareReading}
            >
              {isHardwareReading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Reading from {hardwareDeviceName || 'device'}...
                </>
              ) : (
                <>
                  <Bluetooth className="h-5 w-5 mr-2" />
                  Read from {hardwareDeviceName || 'Device'}
                  {hardwareValue !== null && (
                    <span className="ml-2 font-mono">({hardwareValue}{unit})</span>
                  )}
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center justify-center p-4 rounded-lg bg-muted/50 border-2 border-dashed">
              <div className="text-center">
                <Bluetooth className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No device connected</p>
                <p className="text-xs text-muted-foreground mt-1">Connect a {label.toLowerCase()} device or use emergency manual entry</p>
              </div>
            </div>
          )}

          {/* Manual Entry Collapsible */}
          <Collapsible open={isManualOpen} onOpenChange={setIsManualOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between text-muted-foreground hover:text-foreground",
                  isManualOpen && "bg-warning/10 text-warning hover:text-warning"
                )}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Emergency Manual Entry
                </span>
                {isManualOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="p-4 rounded-lg border-2 border-warning/30 bg-warning/5 space-y-4">
                <div className="flex items-start gap-2 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Manual entries are heavily audited and require supervisor review. 
                    Use only when hardware devices are unavailable.
                  </p>
                </div>

                {/* Reason Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Reason for Manual Entry <span className="text-destructive">*</span>
                  </label>
                  <Select value={manualReason} onValueChange={(v) => setManualReason(v as ManualEntryReason)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(MANUAL_ENTRY_REASONS) as ManualEntryReason[]).map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          <div className="flex items-center gap-2">
                            <span>{MANUAL_ENTRY_REASONS[reason].label}</span>
                            <Badge variant="outline" className="text-xs">
                              Risk: {MANUAL_ENTRY_REASONS[reason].riskScore}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {manualReason && (
                    <p className="text-xs text-muted-foreground">
                      {MANUAL_ENTRY_REASONS[manualReason].description}
                    </p>
                  )}
                </div>

                {/* Value Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {label} Value <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={manualValue}
                      onChange={(e) => setManualValue(e.target.value)}
                      min={min}
                      max={max}
                      step={step}
                      placeholder={`Enter ${label.toLowerCase()}...`}
                      className="bg-background font-mono"
                    />
                    <span className="flex items-center px-3 bg-muted rounded-md text-sm font-mono">
                      {unit}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Expected range: {min} - {max} {unit}
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  variant="outline"
                  className="w-full border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                  onClick={handleManualSubmit}
                  disabled={!manualReason || !manualValue}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Submit Manual Entry
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Manual Entry
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>You are about to submit a manual entry which will be:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Permanently logged in the audit trail</li>
                <li>Flagged for supervisor review</li>
                <li>Assigned a higher risk score</li>
              </ul>
              <div className="mt-4 p-3 rounded-lg bg-muted">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-mono font-medium">{manualValue}{unit}</span>
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="font-medium">{manualReason && MANUAL_ENTRY_REASONS[manualReason].label}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmManualEntry}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Confirm Manual Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
