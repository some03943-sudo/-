export interface Reminder {
  id: string;
  type: 'mileage' | 'date';
  targetValue: number | string; // mileage (number) or date (ISO string)
  label: string;
  interval?: number; // optional recurrance (e.g. every 5000km or 6 months)
  intervalUnit?: 'km' | 'months';
  notificationMethod: 'in-app' | 'email' | 'both';
  completed: boolean;
  notified: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  carPhoto?: string;
  licensePlate: string;
  carType: string;
  model?: string;
  year?: number;
  driverName?: string;
  driverPhoto?: string;
  driverPhone?: string;
  lastOilChangeDate?: string;
  oilType?: string;
  currentMileage: number;
  nextServiceMileage: number;
  location?: { lat: number; lng: number };
  lastLocationUpdate?: string;
  notes?: string;
  driverNotes?: string;
  reminders?: Reminder[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  ownerId: string;
  type: 'maintenance' | 'issue';
  severity?: 'low' | 'medium' | 'high';
  date: string;
  invoicePhoto?: string;
  filterType?: string;
  mechanicName?: string;
  cost: number;
  beforePhoto?: string;
  afterPhoto?: string;
  mileage: number;
  notes?: string;
  createdAt: string;
}

export interface OilOperation {
  id: string;
  ownerId: string;
  barcode: string;
  driverName: string;
  vehicleType: string;
  plateNumber: string;
  oilType: string;
  oilQuantity: string;
  oilChangeDate: string;
  nextOilChangeDate: string;
  currentMileage: number;
  nextMileage: number;
  notes?: string;
  createdAt: string;
}

export type OilLifeStatus = 'excellent' | 'near' | 'overdue';

export function getOilLifeStatus(current: number, next: number): OilLifeStatus {
  const remaining = next - current;
  if (remaining <= 0) return 'overdue';
  if (remaining <= 1000) return 'near';
  return 'excellent';
}

export function getOilLifePercentage(current: number, last: number, next: number): number {
  const total = next - last;
  if (total <= 0) return 0;
  const used = current - last;
  const percentage = 100 - (used / total) * 100;
  return Math.max(0, Math.min(100, percentage));
}
