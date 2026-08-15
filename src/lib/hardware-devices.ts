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

// Bluetooth SIG standard Weight Scale service/characteristic
const SCALE_SERVICE_UUID = '0000181d-0000-1000-8000-00805f9b34fb'; // Weight Scale Service
const SCALE_CHARACTERISTIC_UUID = '00002a9d-0000-1000-8000-00805f9b34fb'; // Weight Measurement

// Moisture meters are not covered by a standard SIG profile.
// These are the environmental-sensing UUIDs used by the supported meters.
const MOISTURE_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb'; 
const MOISTURE_CHARACTERISTIC_UUID = '00002a19-0000-1000-8000-00805f9b34fb';

// Web Bluetooth API type helpers (simplified for cross-browser compatibility)
interface BleCharacteristic {
  readValue: () => Promise<DataView>;
}
interface BleServer {
  connected?: boolean;
  disconnect?: () => void;
  getPrimaryService: (uuid: string) => Promise<{
    getCharacteristic: (uuid: string) => Promise<BleCharacteristic>;
  }>;
}
interface BleDevice {
  id: string;
  name: string | null;
  gatt: { connect: () => Promise<BleServer> };
}
interface WebBluetoothNavigator extends Navigator {
  bluetooth: {
    requestDevice: (options: unknown) => Promise<BleDevice>;
  };
}

/**
 * Live GATT connections, keyed by device id. Readings are only ever taken from
 * a live connection - the app never synthesises a measurement.
 */
const gattConnections = new Map<string, BleServer>();

export class HardwareError extends Error {
  reason: ManualEntryReason;
  constructor(message: string, reason: ManualEntryReason) {
    super(message);
    this.name = 'HardwareError';
    this.reason = reason;
  }
}

/** Maps a Web Bluetooth failure to the manual-entry reason the grader must record. */
export function classifyBluetoothError(error: unknown): ManualEntryReason {
  if (!isBluetoothSupported()) return 'device_unavailable';
  const name = (error as { name?: string })?.name ?? '';
  const message = String((error as { message?: string })?.message ?? error ?? '');
  if (name === 'NotFoundError' || /cancel|no devices/i.test(message)) return 'device_unavailable';
  if (name === 'SecurityError' || /permission|denied/i.test(message)) return 'bluetooth_failure';
  if (name === 'NetworkError' || /disconnect|gatt/i.test(message)) return 'bluetooth_failure';
  if (/timeout/i.test(message)) return 'network_timeout';
  return 'bluetooth_failure';
}

/** True when the device still has a live GATT link. */
export function isDeviceConnected(deviceId: string): boolean {
  const server = gattConnections.get(deviceId);
  return !!server && server.connected !== false;
}

export function disconnectDevice(deviceId: string): void {
  const server = gattConnections.get(deviceId);
  try {
    server?.disconnect?.();
  } catch {
    // already gone
  }
  gattConnections.delete(deviceId);
}

async function readCharacteristic(
  deviceId: string,
  serviceUuid: string,
  characteristicUuid: string,
  timeoutMs = 8000,
): Promise<DataView> {
  const server = gattConnections.get(deviceId);
  if (!server || server.connected === false) {
    throw new HardwareError('Device is not connected', 'bluetooth_failure');
  }
  const read = (async () => {
    const service = await server.getPrimaryService(serviceUuid);
    const characteristic = await service.getCharacteristic(characteristicUuid);
    return characteristic.readValue();
  })();
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new HardwareError('Device did not respond in time', 'network_timeout')), timeoutMs),
  );
  return Promise.race([read, timeout]);
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
    gattConnections.set(device.id, server);

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
    gattConnections.set(device.id, server);

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

// Read weight from the connected scale.
// Returns null when no genuine hardware reading can be obtained - callers must
// then fall back to audited Emergency Manual Mode. Never fabricates a value.
export async function readScaleWeight(device: ScaleDevice): Promise<number | null> {
  try {
    const value = await readCharacteristic(device.id, SCALE_SERVICE_UUID, SCALE_CHARACTERISTIC_UUID);
    // Bluetooth SIG Weight Measurement (0x2A9D): flags byte, then uint16 weight.
    const flags = value.getUint8(0);
    const raw = value.getUint16(1, true);
    const imperial = (flags & 0x01) === 1;
    const kg = imperial ? raw * 0.01 * 0.45359237 : raw * 0.005;
    if (!Number.isFinite(kg) || kg <= 0) return null;
    return Math.round(kg * 10) / 10;
  } catch (error) {
    console.error('Scale read failed:', error);
    return null;
  }
}

// Read moisture from the connected meter.
// Returns null when no genuine hardware reading can be obtained.
export async function readMoistureLevel(device: MoistureMeterDevice): Promise<number | null> {
  try {
    const value = await readCharacteristic(device.id, MOISTURE_SERVICE_UUID, MOISTURE_CHARACTERISTIC_UUID);
    // Humidity characteristic (0x2A6F): uint16, hundredths of a percent.
    const percent = value.byteLength >= 2 ? value.getUint16(0, true) / 100 : value.getUint8(0);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return null;
    return Math.round(percent * 10) / 10;
  } catch (error) {
    console.error('Moisture read failed:', error);
    return null;
  }
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
