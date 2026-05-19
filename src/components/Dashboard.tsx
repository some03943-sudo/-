import React from 'react';
import { Vehicle, getOilLifeStatus, getOilLifePercentage } from '../types';
import { Car, AlertTriangle, CheckCircle2, Clock, MapPin, TrendingUp } from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import { motion } from 'motion/react';

interface DashboardProps {
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
  onStatusFilter: (status: 'all' | 'excellent' | 'near' | 'overdue') => void;
}

export function Dashboard({ vehicles, onSelectVehicle, onStatusFilter }: DashboardProps) {
  const excellentCount = vehicles.filter(v => getOilLifeStatus(v.currentMileage, v.nextServiceMileage) === 'excellent').length;
  const nearCount = vehicles.filter(v => getOilLifeStatus(v.currentMileage, v.nextServiceMileage) === 'near').length;
  const overdueCount = vehicles.filter(v => getOilLifeStatus(v.currentMileage, v.nextServiceMileage) === 'overdue').length;
  
  const nearService = vehicles.filter(v => getOilLifeStatus(v.currentMileage, v.nextServiceMileage) !== 'excellent');
  
  const topMilage = [...vehicles].sort((a, b) => b.currentMileage - a.currentMileage).slice(0, 4);

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 underline decoration-brand-orange decoration-4 underline-offset-8">تحليل أداء الأسطول</h2>
          <p className="text-text-muted">مراقبة استهلاك المحركات والجاهزية التشغيلية.</p>
        </div>
        {overdueCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-status-overdue shadow-[0_0_20px_rgba(239,68,68,0.3)] px-6 py-3 rounded-2xl flex items-center gap-3 animate-pulse"
          >
            <AlertTriangle className="h-6 w-6 text-white" />
            <div className="text-white">
              <p className="text-xs font-bold uppercase tracking-widest leading-none">تنبيه حرج</p>
              <p className="text-lg font-black leading-none mt-1">{overdueCount} مركبات متجاوزة</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          onClick={() => onStatusFilter('excellent')}
          className="bg-brand-card p-6 rounded-3xl border border-white/5 cursor-pointer hover:border-status-excellent/30 transition-all group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div className="h-10 w-10 rounded-xl bg-status-excellent/10 flex items-center justify-center text-status-excellent">
                <CheckCircle2 className="h-6 w-6" />
             </div>
             <span className="text-2xl font-mono font-bold text-white">{excellentCount}</span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest relative z-10">مركبات بحالة ممتازة</p>
          <p className="text-[10px] text-status-excellent mt-1 font-bold relative z-10 transition-transform group-hover:translate-x-[-4px]">عرض الكل ←</p>
          <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-status-excellent/5 rounded-full blur-2xl" />
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5 }}
          onClick={() => onStatusFilter('near')}
          className="bg-brand-card p-6 rounded-3xl border border-white/5 cursor-pointer hover:border-status-near/30 transition-all group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div className="h-10 w-10 rounded-xl bg-status-near/10 flex items-center justify-center text-status-near">
                <Clock className="h-6 w-6" />
             </div>
             <span className="text-2xl font-mono font-bold text-white">{nearCount}</span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest relative z-10">تنبيهات صيانة قريبة</p>
          <p className="text-[10px] text-status-near mt-1 font-bold relative z-10 transition-transform group-hover:translate-x-[-4px]">عرض الكل ←</p>
          <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-status-near/5 rounded-full blur-2xl" />
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          onClick={() => onStatusFilter('overdue')}
          className="bg-brand-card p-6 rounded-3xl border border-white/5 cursor-pointer hover:border-status-overdue/30 transition-all group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div className="h-10 w-10 rounded-xl bg-status-overdue/10 flex items-center justify-center text-status-overdue">
                <AlertTriangle className="h-6 w-6" />
             </div>
             <span className="text-2xl font-mono font-bold text-white">{overdueCount}</span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest relative z-10">مركبات متجاوزة</p>
          <p className="text-[10px] text-status-overdue mt-1 font-bold relative z-10 transition-transform group-hover:translate-x-[-4px]">عرض الكل ←</p>
          <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-status-overdue/5 rounded-full blur-2xl" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-brand-card rounded-3xl border border-white/5 p-8 relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="text-brand-orange h-5 w-5" />
                تحليل الاستهلاك
              </h3>
            </div>
            
            <div className="space-y-6">
              {topMilage.map((v, i) => {
                const percentage = getOilLifePercentage(v.currentMileage, v.currentMileage - 5000, v.nextServiceMileage);
                return (
                  <div key={v.id} onClick={() => onSelectVehicle(v.id)} className="group cursor-pointer">
                    <div className="flex justify-between mb-2">
                       <span className="text-sm font-bold">{v.licensePlate} - {v.driverName}</span>
                       <span className="text-xs font-mono text-text-muted">{formatNumber(v.currentMileage)} كم</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={cn("h-full", percentage < 20 ? "bg-status-overdue" : percentage < 50 ? "bg-status-near" : "bg-status-excellent")}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Car className="absolute -bottom-10 -left-10 h-40 w-40 opacity-5 -rotate-12" />
          </div>

          <div className="bg-brand-card rounded-3xl border border-white/5 p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Clock className="text-brand-orange h-5 w-5" />
              تنبيهات الصيانة العاجلة
            </h3>
            <div className="grid gap-4">
              {nearService.length > 0 ? nearService.slice(0, 3).map(v => (
                <div 
                  key={v.id} 
                  onClick={() => onSelectVehicle(v.id)}
                  className={cn(
                    "flex items-center justify-between p-4 bg-brand-black/40 rounded-2xl border transition-all cursor-pointer group",
                    getOilLifeStatus(v.currentMileage, v.nextServiceMileage) === 'overdue' 
                      ? "border-status-overdue shadow-[0_0_10px_rgba(239,68,68,0.1)] pulse-red" 
                      : "border-status-near shadow-[0_0_10px_rgba(251,191,36,0.1)] pulse-amber"
                  )}
                >
                  <div className="flex items-center gap-4">
                     <div className={cn("p-2 rounded-xl", getOilLifeStatus(v.currentMileage, v.nextServiceMileage) === 'overdue' ? "bg-status-overdue/10 text-status-overdue" : "bg-status-near/10 text-status-near")}>
                        <AlertTriangle className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold">{v.licensePlate}</p>
                        <p className="text-xs text-text-muted tracking-tight">{v.driverName}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">{v.nextServiceMileage - v.currentMileage} كم متبقي</p>
                    <p className="text-[10px] text-text-muted uppercase">يجب المراجعة</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-text-muted">جميع المركبات بجاهزية تامة.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-8">
          <div className="bg-brand-orange p-8 rounded-3xl text-black relative overflow-hidden group">
            <h3 className="text-2xl font-black mb-4 relative z-10 leading-tight">كفاءة الأسطول</h3>
            <p className="text-black/70 text-sm mb-6 relative z-10 font-bold">الالتزام بنسبة 95% بمواعيد الصيانة يطيل عمر المحرك بنسبة 3 سنوات إضافية.</p>
            <div className="h-24 w-24 border-8 border-black/10 rounded-full flex items-center justify-center relative z-10">
               <span className="text-2xl font-black">{vehicles.length ? Math.round(((vehicles.length - nearService.length) / vehicles.length) * 100) : 100}%</span>
            </div>
            <Car className="absolute -bottom-6 -right-6 h-32 w-32 opacity-10 group-hover:rotate-12 transition-transform duration-500" />
          </div>

          <div className="bg-brand-card border border-white/5 p-8 rounded-3xl">
            <h3 className="text-lg font-bold mb-6">مزامنة البيانات</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
                 <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                 <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">مزامنة سحابية نشطة</p>
              </div>
              <p className="text-xs text-text-muted text-center pt-4 italic">آخر نسخة احتياطية: {new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
