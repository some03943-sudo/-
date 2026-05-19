import React from 'react';
import { Vehicle, getOilLifeStatus, getOilLifePercentage } from '../types';
import { Car, AlertTriangle } from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import { motion } from 'motion/react';

interface VehicleListProps {
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
  activeFilter?: 'all' | 'excellent' | 'near' | 'overdue';
  onFilterChange?: (filter: 'all' | 'excellent' | 'near' | 'overdue') => void;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
  index: number;
  key?: string;
}

function VehicleCard({ vehicle, onClick, index }: VehicleCardProps) {
  const status = getOilLifeStatus(vehicle.currentMileage, vehicle.nextServiceMileage);
  const percentage = getOilLifePercentage(vehicle.currentMileage, vehicle.currentMileage - 5000, vehicle.nextServiceMileage);
  const remaining = vehicle.nextServiceMileage - vehicle.currentMileage;

  const cardConfig = {
    overdue: { 
      border: 'border-status-overdue shadow-[0_0_15px_rgba(239,68,68,0.2)]', 
      shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)] pulse-red', 
      bar: 'bg-status-overdue shadow-[0_0_8px_rgba(239,68,68,0.6)]', 
      label: 'تجاوز الحد', 
      labelBg: 'bg-status-overdue text-white' 
    },
    near: { 
      border: 'border-status-near shadow-[0_0_15px_rgba(251,191,36,0.15)]', 
      shadow: 'shadow-[0_0_20px_rgba(251,191,36,0.1)] pulse-amber', 
      bar: 'bg-status-near shadow-[0_0_8px_rgba(251,191,36,0.6)]', 
      label: 'قريب جداً', 
      labelBg: 'bg-status-near text-black font-bold' 
    },
    excellent: { 
      border: 'border-white/10', 
      shadow: '', 
      bar: 'bg-status-excellent shadow-[0_0_8px_rgba(16,185,129,0.6)]', 
      label: 'حالة جيدة', 
      labelBg: 'bg-white/10 text-white/50' 
    },
  }[status];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={cn(
        "bg-brand-card rounded-3xl overflow-hidden flex flex-col cursor-pointer transition-all border",
        cardConfig.border,
        cardConfig.shadow
      )}
    >
      <div className="h-36 bg-brand-surface flex items-center justify-center overflow-hidden relative">
        {vehicle.carPhoto && (
          <img src={vehicle.carPhoto} className="absolute inset-0 w-full h-full object-cover" alt={vehicle.carType} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-brand-card/40 to-transparent" />
        <div className="w-full h-full flex items-center justify-center text-white/5 uppercase font-black text-3xl text-center px-4 leading-none select-none relative z-10">
          {vehicle.carType}
        </div>
        <div className={cn("absolute top-4 left-4 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider", cardConfig.labelBg)}>
          {cardConfig.label}
        </div>
        {status === 'overdue' && (
          <div className="absolute top-4 right-4 bg-status-overdue/20 p-2 rounded-full text-status-overdue animate-pulse">
            <AlertTriangle className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <img 
              src={vehicle.driverPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${vehicle.driverName}`} 
              className="w-11 h-11 rounded-xl border-2 border-brand-orange/30 bg-brand-black" 
              alt={vehicle.driverName} 
            />
            <div>
              <p className="text-sm font-bold text-white">{vehicle.driverName}</p>
              <p className="text-[10px] text-text-muted font-medium">{vehicle.driverPhone || 'بدون هاتف'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono font-bold text-brand-orange">{vehicle.licensePlate}</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              {vehicle.carType}
              {vehicle.model && ` | ${vehicle.model}`}
              {vehicle.year && ` (${vehicle.year})`}
            </p>
            {vehicle.createdAt && (
              <p className="text-[8px] text-white/30 uppercase mt-1">سجل في: {new Date(vehicle.createdAt).toLocaleDateString('ar-EG')}</p>
            )}
          </div>
        </div>

        <div className="space-y-4 mt-auto">
          <div className="flex justify-between items-end">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest leading-none">حالة الزيت</span>
            <span className={cn("text-xs font-mono font-bold leading-none", status === 'overdue' ? "text-status-overdue" : status === 'near' ? "text-status-near" : "text-status-excellent")}>
              {status === 'overdue' ? `-${Math.abs(remaining)} كم` : percentage > 0 ? `${percentage}%` : '0%'}
            </span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, percentage)}%` }}
              className={cn("h-full transition-all duration-1000", cardConfig.bar)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <p className="text-[8px] uppercase text-text-muted mb-1 font-bold">آخر تبديل</p>
              <p className="text-xs font-mono font-bold">{formatNumber(vehicle.currentMileage)} كم</p>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <p className="text-[8px] uppercase text-text-muted mb-1 font-bold">التبديل القادم</p>
              <p className={cn("text-xs font-mono font-bold text-right", status === 'overdue' ? "text-status-overdue" : status === 'near' ? "text-status-near" : "text-white")}>
                {formatNumber(vehicle.nextServiceMileage)} كم
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function VehicleList({ vehicles, onSelectVehicle, activeFilter = 'all', onFilterChange }: VehicleListProps) {
  const filters = [
    { id: 'all', label: 'الكل', count: null },
    { id: 'excellent', label: 'ممتازة', color: 'bg-status-excellent' },
    { id: 'near', label: 'تحتاج انتباه', color: 'bg-status-near' },
    { id: 'overdue', label: 'تجاوزت الحد', color: 'bg-status-overdue' },
  ];

  return (
    <div className="space-y-8">
      {onFilterChange && (
        <div className="flex flex-wrap gap-3">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2",
                activeFilter === f.id
                  ? "bg-white/10 border-white/20 text-white shadow-lg"
                  : "bg-transparent border-white/5 text-text-muted hover:border-white/10 hover:text-white"
              )}
            >
              {f.color && <div className={cn("h-2 w-2 rounded-full", f.color)} />}
              {f.label}
            </button>
          ))}
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-brand-card rounded-3xl border border-dashed border-white/10">
          <Car className="h-16 w-16 text-white/5 mb-4" />
          <p className="text-text-muted">
            {activeFilter === 'all' 
              ? 'لم يتم تسجيل أي مركبات بعد.' 
              : 'لا توجد مركبات تطابق هذا الفلتر.'}
          </p>
          {activeFilter !== 'all' && onFilterChange && (
            <button 
              onClick={() => onFilterChange('all')}
              className="mt-4 text-brand-orange text-xs font-bold hover:underline"
            >
              إلغاء التصفية
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {vehicles.map((vehicle, i) => (
            <VehicleCard 
              key={vehicle.id} 
              vehicle={vehicle} 
              index={i}
              onClick={() => onSelectVehicle(vehicle.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

