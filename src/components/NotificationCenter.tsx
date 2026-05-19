import React from 'react';
import { Vehicle, Reminder } from '../types';
import { Bell, AlertTriangle, CheckCircle2, Clock, Gauge, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate, formatNumber } from '../lib/utils';

interface NotificationCenterProps {
  vehicles: Vehicle[];
  onClose: () => void;
  onClear: (vehicleId: string, reminderId: string) => Promise<void>;
}

export function NotificationCenter({ vehicles, onClose, onClear }: NotificationCenterProps) {
  const activeNotifications: { vehicle: Vehicle; reminder: Reminder }[] = [];

  vehicles.forEach(vehicle => {
    (vehicle.reminders || []).forEach(reminder => {
      let isTriggered = false;
      if (reminder.type === 'mileage') {
        if (vehicle.currentMileage >= (reminder.targetValue as number)) {
          isTriggered = true;
        }
      } else {
        if (new Date() >= new Date(reminder.targetValue as string)) {
          isTriggered = true;
        }
      }

      if (isTriggered && !reminder.completed) {
        activeNotifications.push({ vehicle, reminder });
      }
    });
  });

  return (
    <div className="absolute top-16 left-6 w-96 max-h-[calc(100vh-10rem)] bg-brand-card border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-brand-orange" />
          <h3 className="font-bold text-white">مركز التنبيهات</h3>
        </div>
        <button onClick={onClose} className="p-2 text-text-muted hover:text-white transition-all">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-status-excellent mx-auto mb-4 opacity-20" />
            <p className="text-sm text-text-muted font-medium">كل شيء تحت السيطرة!</p>
            <p className="text-[10px] text-text-muted uppercase mt-1">لا توجد تنبيهات نشطة حالياً</p>
          </div>
        ) : (
          activeNotifications.map(({ vehicle, reminder }) => (
            <div key={`${vehicle.id}-${reminder.id}`} className="bg-brand-surface border border-white/5 rounded-2xl p-4 relative group">
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-status-overdue/10 flex items-center justify-center text-status-overdue">
                  {reminder.type === 'mileage' ? <Gauge className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white mb-1 truncate">{reminder.label}</p>
                  <p className="text-[10px] text-text-muted font-medium mb-2">
                    المركبة: <span className="text-brand-orange font-bold">{vehicle.licensePlate}</span>
                  </p>
                  <div className="flex items-center justify-between mt-3">
                     <span className="text-[10px] text-status-overdue font-black uppercase flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        موعد مستحق
                     </span>
                     <button 
                       onClick={() => onClear(vehicle.id, reminder.id)}
                       className="text-[10px] font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg hover:bg-brand-orange hover:text-black transition-all"
                     >
                       تم الإنجاز
                     </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {activeNotifications.length > 0 && (
        <div className="p-4 bg-status-overdue/5 border-t border-white/5 text-center">
          <p className="text-[10px] text-status-overdue font-bold uppercase tracking-widest">يوجد {activeNotifications.length} تنبيهات تتطلب إجراءً عاجلاً</p>
        </div>
      )}
    </div>
  );
}
