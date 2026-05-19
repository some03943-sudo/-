import React, { useState } from 'react';
import { Reminder, Vehicle } from '../types';
import { Bell, Plus, Trash2, Calendar, Gauge, Mail, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate, formatNumber } from '../lib/utils';

interface VehicleRemindersProps {
  vehicle: Vehicle;
  onUpdate: (reminders: Reminder[]) => Promise<void>;
}

export function VehicleReminders({ vehicle, onUpdate }: VehicleRemindersProps) {
  const [showAdd, setShowAdd] = useState(false);
  const reminders = vehicle.reminders || [];

  const addReminder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const newReminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      type: fd.get('type') as 'mileage' | 'date',
      targetValue: fd.get('type') === 'mileage' ? Number(fd.get('targetValue')) : fd.get('targetValue') as string,
      label: fd.get('label') as string,
      interval: fd.get('interval') ? Number(fd.get('interval')) : undefined,
      intervalUnit: fd.get('intervalUnit') as 'km' | 'months' | undefined,
      notificationMethod: fd.get('notification') as 'in-app' | 'email' | 'both',
      completed: false,
      notified: false,
      createdAt: new Date().toISOString()
    };

    await onUpdate([...reminders, newReminder]);
    setShowAdd(false);
  };

  const deleteReminder = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التنبيه؟')) {
      await onUpdate(reminders.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">التنبيهات المخصصة</h3>
        <button 
          onClick={() => setShowAdd(true)}
          className="text-brand-orange hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
        >
          <Plus className="h-4 w-4" />
          إضافة تنبيه
        </button>
      </div>

      <div className="space-y-3">
        {reminders.length === 0 ? (
          <div className="bg-white/5 rounded-2xl p-8 text-center border border-dashed border-white/10">
            <Bell className="h-8 w-8 text-text-muted mx-auto mb-3 opacity-20" />
            <p className="text-xs text-text-muted font-medium">لا توجد تنبيهات مخصصة لهذه المركبة حالياً</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <motion.div 
              key={reminder.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-surface border border-white/5 rounded-2xl p-5 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  reminder.type === 'mileage' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                )}>
                  {reminder.type === 'mileage' ? <Gauge className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">{reminder.label}</p>
                  <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
                    {reminder.type === 'mileage' 
                      ? `عند الوصول لـ ${formatNumber(reminder.targetValue as number)} كم` 
                      : `بتاريخ ${formatDate(reminder.targetValue as string)}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                  <Mail className={cn("h-3 w-3", (reminder.notificationMethod === 'email' || reminder.notificationMethod === 'both') ? "text-brand-orange" : "text-white/20")} />
                  <Bell className={cn("h-3 w-3", (reminder.notificationMethod === 'in-app' || reminder.notificationMethod === 'both') ? "text-brand-orange" : "text-white/20")} />
                </div>
                <button 
                  onClick={() => deleteReminder(reminder.id)}
                  className="p-2 text-text-muted hover:text-status-overdue transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-black/90 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-brand-card w-full max-w-md rounded-[2rem] p-8 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
                <Bell className="h-5 w-5 text-brand-orange" />
                إعداد تنبيه مخصص
              </h2>
              <form onSubmit={addReminder} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">نوع التنبيه</label>
                  <select name="type" className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 outline-none appearance-none" required>
                    <option value="mileage">بناءً على عداد المسافة (كم)</option>
                    <option value="date">بناءً على التاريخ (زمن)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">عنوان التنبيه</label>
                  <input name="label" placeholder="مثال: فحص المكابح" className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 outline-none focus:ring-1 focus:ring-brand-orange transition-all" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">القيمة المستهدفة</label>
                  <input name="targetValue" placeholder="أدخل الرقم أو التاريخ" className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 outline-none focus:ring-1 focus:ring-brand-orange transition-all" required />
                  <p className="text-[10px] text-text-muted mt-2 italic flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    أدخل رقم العداد أو التاريخ بصيغة YYYY-MM-DD
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">طريقة التنبيه</label>
                  <select name="notification" className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 outline-none appearance-none" required>
                    <option value="in-app">تنبيه داخل التطبيق فقط</option>
                    <option value="email">عبر البريد الإلكتروني</option>
                    <option value="both">كلاهما</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button className="flex-1 bg-brand-orange text-black py-4 rounded-xl font-bold hover:bg-orange-400 transition-all">حفظ التنبيه</button>
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/5 transition-all">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
