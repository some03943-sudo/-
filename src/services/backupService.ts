import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vehicle, MaintenanceLog } from '../types';

export async function exportAllData(userId: string) {
  try {
    // 1. Get all vehicles
    const vehiclesQ = query(collection(db, 'vehicles'), where('ownerId', '==', userId));
    const vehiclesSnap = await getDocs(vehiclesQ);
    const vehicles = vehiclesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. Get all logs
    const logsQ = query(collection(db, 'maintenance_logs'), where('ownerId', '==', userId));
    const logsSnap = await getDocs(logsQ);
    const logs = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      vehicles,
      logs
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OilTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Backup failed:', error);
    return false;
  }
}

export function setupLocalNotifications() {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }

  if (Notification.permission === "granted") {
    // Already granted
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}

export function sendLocalServiceReminder(vehicle: Vehicle) {
  if (Notification.permission === "granted") {
    new Notification(`OilTrack: ${vehicle.licensePlate}`, {
      body: `موعد تبديل الزيت اقترب! العداد المتبقي: ${vehicle.nextServiceMileage - vehicle.currentMileage} كم.`,
      icon: "/favicon.ico"
    });
  }
}
