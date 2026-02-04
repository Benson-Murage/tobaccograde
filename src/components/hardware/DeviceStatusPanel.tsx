/**
 * Device Status Panel
 * 
 * Shows connection status of Bluetooth devices (scale, moisture meter).
 * Allows manual reconnection and displays battery levels.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  BluetoothSearching,
  Scale,
  Droplets,
  Battery,
  BatteryLow,
  BatteryWarning,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  type ScaleDevice,
  type MoistureMeterDevice,
  type DeviceStatus,
  formatDeviceStatus,
  getBatteryIndicator,
  isBluetoothSupported,
} from '@/lib/hardware-devices';

interface DeviceStatusPanelProps {
  scale: ScaleDevice | null;
  moistureMeter: MoistureMeterDevice | null;
  isEmergencyMode: boolean;
  onConnectScale: () => Promise<void>;
  onConnectMoistureMeter: () => Promise<void>;
  onEnterEmergencyMode: () => void;
  onExitEmergencyMode: () => void;
  className?: string;
}

const StatusIcon = ({ status }: { status: DeviceStatus }) => {
  switch (status) {
    case 'connected':
      return <BluetoothConnected className="h-4 w-4 text-success" />;
    case 'connecting':
      return <BluetoothSearching className="h-4 w-4 text-warning animate-pulse" />;
    case 'disconnected':
      return <BluetoothOff className="h-4 w-4 text-muted-foreground" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive" />;
  }
};

const BatteryIcon = ({ level }: { level: number | undefined }) => {
  if (level === undefined) return <Battery className="h-4 w-4 text-muted-foreground" />;
  if (level >= 50) return <Battery className="h-4 w-4 text-success" />;
  if (level >= 25) return <BatteryLow className="h-4 w-4 text-warning" />;
  return <BatteryWarning className="h-4 w-4 text-destructive" />;
};

export function DeviceStatusPanel({
  scale,
  moistureMeter,
  isEmergencyMode,
  onConnectScale,
  onConnectMoistureMeter,
  onEnterEmergencyMode,
  onExitEmergencyMode,
  className,
}: DeviceStatusPanelProps) {
  const [isConnectingScale, setIsConnectingScale] = useState(false);
  const [isConnectingMoisture, setIsConnectingMoisture] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const bluetoothSupported = isBluetoothSupported();

  const handleConnectScale = async () => {
    setIsConnectingScale(true);
    setConnectionError(null);
    try {
      await onConnectScale();
    } catch (error) {
      console.error('Scale connection error:', error);
      setConnectionError('Failed to connect scale. Please try again or use manual entry.');
    } finally {
      setIsConnectingScale(false);
    }
  };

  const handleConnectMoisture = async () => {
    setIsConnectingMoisture(true);
    setConnectionError(null);
    try {
      await onConnectMoistureMeter();
    } catch (error) {
      console.error('Moisture meter connection error:', error);
      setConnectionError('Failed to connect moisture meter. Please try again or use manual entry.');
    } finally {
      setIsConnectingMoisture(false);
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("card-elevated", className)}>
        {/* Emergency Mode Banner */}
        {isEmergencyMode && (
          <div className="bg-warning/20 border-b border-warning/30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Emergency Mode Active</span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onExitEmergencyMode}
              className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
            >
              Exit Emergency Mode
            </Button>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bluetooth className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Hardware Devices</h3>
            </div>
            {!bluetoothSupported ? (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Demo Mode</Badge>
            ) : null}
            {connectionError && (
              <Badge variant="destructive" className="text-xs">{connectionError}</Badge>
            )}
          </div>

          <div className="space-y-3">
            {/* Bluetooth Scale */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {scale?.name || 'Bluetooth Scale'}
                    </span>
                    <StatusIcon status={scale?.status || 'disconnected'} />
                  </div>
                  {scale?.status === 'connected' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <BatteryIcon level={scale.batteryLevel} />
                      <span>{scale.batteryLevel ?? '--'}%</span>
                      {scale.lastReading !== undefined && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{scale.lastReading} kg</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant={scale?.status === 'connected' ? 'outline' : 'default'}
                onClick={handleConnectScale}
                disabled={isConnectingScale || !bluetoothSupported}
              >
                {isConnectingScale ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : scale?.status === 'connected' ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  'Connect'
                )}
              </Button>
            </div>

            {/* Moisture Meter */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Droplets className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {moistureMeter?.name || 'Moisture Meter'}
                    </span>
                    <StatusIcon status={moistureMeter?.status || 'disconnected'} />
                  </div>
                  {moistureMeter?.status === 'connected' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <BatteryIcon level={moistureMeter.batteryLevel} />
                      <span>{moistureMeter.batteryLevel ?? '--'}%</span>
                      {moistureMeter.lastReading !== undefined && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{moistureMeter.lastReading}%</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant={moistureMeter?.status === 'connected' ? 'outline' : 'default'}
                onClick={handleConnectMoisture}
                disabled={isConnectingMoisture || !bluetoothSupported}
              >
                {isConnectingMoisture ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : moistureMeter?.status === 'connected' ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
          </div>

          {/* Emergency Mode Button */}
          {!isEmergencyMode && (
            <div className="mt-4 pt-4 border-t">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-warning/50 text-warning hover:bg-warning/10"
                    onClick={onEnterEmergencyMode}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Enter Emergency Mode
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enable manual input when all hardware is unavailable</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
