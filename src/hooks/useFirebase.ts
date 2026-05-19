import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc, Timestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, OperationType, handleFirestoreError } from '../lib/firebase';
import { Vehicle, MaintenanceLog, OilOperation } from '../types';
import { useAuth } from '../lib/AuthContext';

export async function uploadVehicleImage(file: File, vehicleId: string) {
  const fileRef = ref(storage, `vehicles/${vehicleId}/${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export function useOilOperations() {
  const { user } = useAuth();
  const [operations, setOperations] = useState<OilOperation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOperations([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'oil_operations'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OilOperation));
      setOperations(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'oil_operations');
    });

    return unsubscribe;
  }, [user]);

  const addOperation = async (op: Omit<OilOperation, 'id' | 'ownerId' | 'createdAt'>) => {
    if (!user) return null;
    try {
      const docRef = await addDoc(collection(db, 'oil_operations'), {
        ...op,
        ownerId: user.uid,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'oil_operations');
      return null;
    }
  };

  const updateOperation = async (id: string, data: Partial<OilOperation>) => {
    try {
      await updateDoc(doc(db, 'oil_operations', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `oil_operations/${id}`);
    }
  };

  const deleteOperation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'oil_operations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `oil_operations/${id}`);
    }
  };

  return { operations, loading, addOperation, updateOperation, deleteOperation };
}

export function usePublicOperation(barcode: string | null) {
  const [operation, setOperation] = useState<OilOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!barcode) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'oil_operations'),
      where('barcode', '==', barcode)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setOperation({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as OilOperation);
      } else {
        setOperation(null);
        setError('Operation not found');
      }
      setLoading(false);
    }, (err) => {
      setError('Access denied or record missing');
      setLoading(false);
    });

    return unsubscribe;
  }, [barcode]);

  return { operation, loading, error };
}

export function useVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'vehicles'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      setVehicles(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vehicles');
    });

    return unsubscribe;
  }, [user]);

  const addVehicle = async (vehicle: Omit<Vehicle, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'vehicles'), {
        ...vehicle,
        ownerId: user.uid,
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'vehicles');
    }
  };

  const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    try {
      await updateDoc(doc(db, 'vehicles', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vehicles/${id}`);
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vehicles/${id}`);
    }
  };

  return { vehicles, loading, addVehicle, updateVehicle, deleteVehicle };
}

export function useMaintenanceLogs(vehicleId?: string) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !vehicleId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'maintenance_logs'),
      where('ownerId', '==', user.uid),
      where('vehicleId', '==', vehicleId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceLog));
      setLogs(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'maintenance_logs');
    });

    return unsubscribe;
  }, [user, vehicleId]);

  const addLog = async (log: Omit<MaintenanceLog, 'id' | 'ownerId' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'maintenance_logs'), {
        ...log,
        ownerId: user.uid,
        createdAt: new Date().toISOString()
      });
      
      // Update vehicle's current mileage
      const updateData: any = {
        currentMileage: log.mileage,
        updatedAt: new Date().toISOString()
      };

      // Only update last oil change date if this is specifically a maintenance/oil change log
      if (log.type === 'maintenance') {
        updateData.lastOilChangeDate = log.date;
      }

      await updateDoc(doc(db, 'vehicles', log.vehicleId), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'maintenance_logs');
    }
  };

  return { logs, loading, addLog };
}

export function usePublicVehicle(id: string | null) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'vehicles', id), (snapshot) => {
      if (snapshot.exists()) {
        setVehicle({ id: snapshot.id, ...snapshot.data() } as Vehicle);
      } else {
        setError('Vehicle not found');
      }
      setLoading(false);
    }, (err) => {
      setError('Access denied or record missing');
      setLoading(false);
    });

    return unsubscribe;
  }, [id]);

  return { vehicle, loading, error };
}
