/**
 * Hardware Device Integration
 * 
 * Bluetooth scale, moisture meter, and barcode scanner integration.
 * Hardware values are ALWAYS preferred over manual input.
 */

// Device connection states
export type DeviceStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface DeviceReading<T> {
  value: T;
  source: 'hardware' | 'manual';
  deviceId?: string;
  deviceName?: string;
  timestamp: Date;
  batteryLevel?: number;
  signalStrength?: number;
  // Manual entry metadata (only when source === 'manual')
  manualReason?: ManualEntryReason;
  manualApprovedBy?: string;
  manualApprovedAt?: Date;
}

export type ManualEntryReason = 
  | 'device_unavailable'
  | 'bluetooth_failure'
  | 'battery_dead'
  | 'device_maintenance'
  | 'emergency_mode'
  | 'calibration_issue'
  | 'network_timeout';

export const MANUAL_ENTRY_REASONS: Record<ManualEntryReason, { label: string; description: string; riskScore: number }> = {
  device_unavailable: {
    label: 'Device Unavailable',
    description: 'Hardware device not present at grading station',
    riskScore: 30,
  },
  bluetooth_failure: {
    label: 'Bluetooth Connection Failed',
    description: 'Unable to establish Bluetooth connection',
    riskScore: 20,
  },
  battery_dead: {
    label: 'Battery Dead',
    description: 'Device battery depleted during operation',
    riskScore: 15,
  },
  device_maintenance: {
    label: 'Under Maintenance',
    description: 'Device scheduled for maintenance or repair',
    riskScore: 10,
  },
  emergency_mode: {
    label: 'Emergency Mode',
    description: 'Warehouse operating in emergency/backup mode',
    riskScore: 40,
  },
  calibration_issue: {
    label: 'Calibration Issue',
    description: 'Device readings inconsistent, requires recalibration',
    riskScore: 35,
  },
  network_timeout: {
    label: 'Network Timeout',
    description: 'Device communication timed out',
    riskScore: 25,
  },
};

// Bluetooth scale interface
export interface ScaleDevice {
  id: string;
  name: string;
  status: DeviceStatus;
  lastReading?: number;
  unit: 'kg' | 'lb';
  batteryLevel?: number;
  isCalibrated: boolean;
  lastCalibration?: Date;
}

// Moisture meter interface
export interface MoistureMeterDevice {
  id: string;
  name: string;
  status: DeviceStatus;
  lastReading?: number;
  batteryLevel?: number;
  sensorType: 'pin' | 'pinless' | 'probe';
  isCalibrated: boolean;
  lastCalibration?: Date;
}

// Device manager state
export interface DeviceManagerState {
  scale: ScaleDevice | null;
  moistureMeter: MoistureMeterDevice | null;
  isEmergencyMode: boolean;
  lastDeviceCheck: Date;
}

// Check if Web Bluetooth API is available
export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

// Mock scale UUIDs (replace with actual device UUIDs)
const SCALE_SERVICE_UUID = '0000181d-0000-1000-8000-00805f9b34fb'; // Weight Scale Service
const SCALE_CHARACTERISTIC_UUID = '00002a9d-0000-1000-8000-00805f9b34fb'; // Weight Measurement

// Mock moisture meter UUIDs
const MOISTURE_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb'; 
const MOISTURE_CHARACTERISTIC_UUID = '00002a19-0000-1000-8000-00805f9b34fb';

// Web Bluetooth API type helpers (simplified for cross-browser compatibility)
interface WebBluetoothNavigator extends Navigator {
  bluetooth: {
    requestDevice: (options: unknown) => Promise<{
      id: string;
      name: string | null;
      gatt: {
        connect: () => Promise<{
          getPrimaryService: (uuid: string) => Promise<{
            getCharacteristic: (uuid: string) => Promise<{
              readValue: () => Promise<DataView>;
            }>;
          }>;
        }>;
      };
    }>;
  };
}

// Connect to Bluetooth scale
export async function connectBluetoothScale(): Promise<ScaleDevice | null> {
  if (!isBluetoothSupported()) {
    console.warn('Web Bluetooth not supported');
    return null;
  }

  try {
    const nav = navigator as WebBluetoothNavigator;
    const device = await nav.bluetooth.requestDevice({
      filters: [
        { services: [SCALE_SERVICE_UUID] },
        { namePrefix: 'Scale' },
        { namePrefix: 'KERN' },
        { namePrefix: 'OHAUS' },
      ],
      optionalServices: ['battery_service'],
    });

    const server = await device.gatt.connect();
    
    // Get battery level if available
    let batteryLevel: number | undefined;
    try {
      const batteryService = await server.getPrimaryService('battery_service');
      const batteryChar = await batteryService.getCharacteristic('battery_level');
      const batteryValue = await batteryChar.readValue();
      batteryLevel = batteryValue.getUint8(0);
    } catch {
      // Battery service not available
    }

    return {
      id: device.id,
      name: device.name || 'Bluetooth Scale',
      status: 'connected',
      unit: 'kg',
      batteryLevel,
      isCalibrated: true,
      lastCalibration: new Date(),
    };
  } catch (error) {
    console.error('Failed to connect scale:', error);
    return null;
  }
}

// Connect to Bluetooth moisture meter
export async function connectBluetoothMoistureMeter(): Promise<MoistureMeterDevice | null> {
  if (!isBluetoothSupported()) {
    console.warn('Web Bluetooth not supported');
    return null;
  }

  try {
    const nav = navigator as WebBluetoothNavigator;
    const device = await nav.bluetooth.requestDevice({
      filters: [
        { services: [MOISTURE_SERVICE_UUID] },
        { namePrefix: 'Moisture' },
        { namePrefix: 'Delmhorst' },
        { namePrefix: 'Protimeter' },
      ],
      optionalServices: ['battery_service'],
    });

    const server = await device.gatt.connect();

    // Get battery level if available
    let batteryLevel: number | undefined;
    try {
      const batteryService = await server.getPrimaryService('battery_service');
      const batteryChar = await batteryService.getCharacteristic('battery_level');
      const batteryValue = await batteryChar.readValue();
      batteryLevel = batteryValue.getUint8(0);
    } catch {
      // Battery service not available
    }

    return {
      id: device.id,
      name: device.name || 'Moisture Meter',
      status: 'connected',
      batteryLevel,
      sensorType: 'probe',
      isCalibrated: true,
      lastCalibration: new Date(),
    };
  } catch (error) {
    console.error('Failed to connect moisture meter:', error);
    return null;
  }
}

// Read weight from connected scale
export async function readScaleWeight(device: ScaleDevice): Promise<number | null> {
  // In production, this would read from the Bluetooth characteristic
  // For demo, return simulated stable reading
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate scale reading between 30-60 kg
      const weight = 30 + Math.random() * 30;
      resolve(Math.round(weight * 10) / 10);
    }, 500);
  });
}

// Read moisture from connected meter
export async function readMoistureLevel(device: MoistureMeterDevice): Promise<number | null> {
  // In production, this would read from the Bluetooth characteristic
  // For demo, return simulated reading
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate moisture reading between 10-18%
      const moisture = 10 + Math.random() * 8;
      resolve(Math.round(moisture * 10) / 10);
    }, 500);
  });
}

// Calculate audit risk score for a grading session
export function calculateManualEntryRiskScore(readings: DeviceReading<unknown>[]): {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
} {
  let totalScore = 0;
  const factors: string[] = [];

  readings.forEach(reading => {
    if (reading.source === 'manual') {
      const reason = reading.manualReason;
      if (reason) {
        const reasonData = MANUAL_ENTRY_REASONS[reason];
        totalScore += reasonData.riskScore;
        factors.push(reasonData.label);
      } else {
        // Unknown manual entry reason is high risk
        totalScore += 50;
        factors.push('Unspecified manual entry');
      }
    }
  });

  // Normalize score
  const normalizedScore = Math.min(totalScore, 100);

  let level: 'low' | 'medium' | 'high' | 'critical';
  if (normalizedScore <= 20) level = 'low';
  else if (normalizedScore <= 40) level = 'medium';
  else if (normalizedScore <= 70) level = 'high';
  else level = 'critical';

  return { score: normalizedScore, level, factors };
}

// Check if supervisor approval is required
export function requiresSupervisorApproval(
  reading: DeviceReading<number>,
  expectedRange: { min: number; max: number }
): { required: boolean; reason?: string } {
  // Manual entries always require supervisor review
  if (reading.source === 'manual') {
    // Out-of-range manual values MUST be approved
    if (reading.value < expectedRange.min || reading.value > expectedRange.max) {
      return {
        required: true,
        reason: `Manual value ${reading.value} is outside expected range (${expectedRange.min}-${expectedRange.max})`,
      };
    }
    
    // High-risk manual reasons require approval
    if (reading.manualReason) {
      const riskScore = MANUAL_ENTRY_REASONS[reading.manualReason].riskScore;
      if (riskScore >= 30) {
        return {
          required: true,
          reason: `High-risk manual entry: ${MANUAL_ENTRY_REASONS[reading.manualReason].label}`,
        };
      }
    }
  }

  return { required: false };
}

// Format device status for UI
export function formatDeviceStatus(status: DeviceStatus): {
  label: string;
  color: string;
  icon: 'connected' | 'connecting' | 'disconnected' | 'error';
} {
  switch (status) {
    case 'connected':
      return { label: 'Connected', color: 'text-success', icon: 'connected' };
    case 'connecting':
      return { label: 'Connecting...', color: 'text-warning', icon: 'connecting' };
    case 'disconnected':
      return { label: 'Disconnected', color: 'text-muted-foreground', icon: 'disconnected' };
    case 'error':
      return { label: 'Error', color: 'text-destructive', icon: 'error' };
  }
}

// Get battery level indicator
export function getBatteryIndicator(level: number | undefined): {
  label: string;
  color: string;
  percentage: number;
} {
  if (level === undefined) {
    return { label: 'Unknown', color: 'text-muted-foreground', percentage: 0 };
  }

  if (level >= 75) return { label: 'Full', color: 'text-success', percentage: level };
  if (level >= 50) return { label: 'Good', color: 'text-primary', percentage: level };
  if (level >= 25) return { label: 'Low', color: 'text-warning', percentage: level };
  return { label: 'Critical', color: 'text-destructive', percentage: level };
}
