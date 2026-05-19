import React from 'react';
import { usePublicVehicle } from '../hooks/useFirebase';
import { Car, ShieldCheck, AlertTriangle, Clock, Calendar, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { formatNumber, cn } from '../lib/utils';
import { getOilLifeStatus, getOilLifePercentage } from '../types';
import { VehicleMap } from './VehicleMap';

interface PublicVehicleViewProps {
  vehicleId: string;
}

export function PublicVehicleView({ vehicleId }: PublicVehicleViewProps) {
  const { vehicle, loading, error } = usePublicVehicle(vehicleId);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-black">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="h-12 w-12 border-4 border-brand-orange border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-brand-black p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-status-overdue mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">عذراً، المركبة غير موجودة</h1>
        <p className="text-text-muted">الرابط الذي اتبعته قد يكون غير صحيح أو تم حذف السجل.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-8 text-brand-orange font-bold underline"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const status = getOilLifeStatus(vehicle.currentMileage, vehicle.nextServiceMileage);
  const percentage = getOilLifePercentage(vehicle.currentMileage, vehicle.currentMileage - 5000, vehicle.nextServiceMileage);
  const remaining = vehicle.nextServiceMileage - vehicle.currentMileage;

  return (
    <div className="min-h-screen bg-brand-black p-6 flex flex-col items-center">
      <header className="w-full max-w-lg flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="bg-brand-orange p-2 rounded-lg">
            <Car className="h-6 w-6 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">DRIVECARE</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-status-excellent/20 flex items-center justify-center">
           <ShieldCheck className="h-5 w-5 text-status-excellent" />
        </div>
      </header>

      <main className="w-full max-w-lg bg-brand-card rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative">
        <div className="h-48 bg-brand-surface relative flex items-center justify-center overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-t from-brand-card to-transparent" />
           <div className="w-full h-full flex items-center justify-center text-white/5 uppercase font-black text-6xl text-center px-4 leading-none select-none -rotate-6">
              {vehicle.carType}
           </div>
           {vehicle.driverPhoto && (
             <div className="absolute -bottom-8 right-12 h-24 w-24 rounded-3xl border-4 border-brand-orange bg-brand-black shadow-2xl overflow-hidden">
                <img src={vehicle.driverPhoto} alt="" className="w-full h-full object-cover" />
             </div>
           )}
        </div>

        <div className="p-10 pt-12">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-white mb-2 leading-none">{vehicle.licensePlate}</h1>
            <p className="text-brand-orange font-bold text-lg uppercase">{vehicle.carType}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-10">
             <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
               <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest flex items-center gap-2">
                 <Navigation className="h-3 w-3" />
                 تتبع الموقع الحالي
               </p>
               <VehicleMap 
                 location={vehicle.location} 
                 className="!bg-transparent !border-none !p-0 min-h-[300px]" 
               />
             </div>
             <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-4">بيانات المسؤول</p>
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                      <Clock className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-white">{vehicle.driverName}</p>
                      <p className="text-[10px] text-text-muted font-medium">سائق المركبة المعتمد</p>
                   </div>
                </div>
             </div>

             <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-4">تاريخ آخر صيانة</p>
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Calendar className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-white">{vehicle.lastOilChangeDate ? new Date(vehicle.lastOilChangeDate).toLocaleDateString('ar-EG') : 'غير مسجل'}</p>
                      <p className="text-[10px] text-text-muted font-medium">تم تبديل الزيت والفلتر</p>
                   </div>
                </div>
             </div>

             <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-4">نوع الزيت المعتمد</p>
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                      <ShieldCheck className="h-5 w-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold text-white">{vehicle.oilType || 'غير محدد'}</p>
                      <p className="text-[10px] text-text-muted font-medium">النوع الموصى به للمحرك</p>
                   </div>
                </div>
             </div>

             <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="flex justify-between items-end mb-4">
                   <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">موعد الصيانة القادم</p>
                   <span className={cn("text-lg font-mono font-bold", status === 'overdue' ? 'text-status-overdue' : 'text-brand-orange')}>
                      {formatNumber(vehicle.nextServiceMileage)} كم
                   </span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={cn("h-full", status === 'overdue' ? 'bg-status-overdue' : status === 'near' ? 'bg-status-near' : 'bg-status-excellent')}
                   />
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                   <span className="text-text-muted italic">الحالة: {status === 'excellent' ? 'ممتازة' : status === 'near' ? 'تبديل قريب' : 'تجاوز الحد'}</span>
                   <span className={status === 'overdue' ? 'text-status-overdue' : 'text-white'}>
                     {status === 'overdue' ? 'متأخر بـ ' : 'متبقي '} 
                     {formatNumber(Math.abs(remaining))} كم
                   </span>
                </div>
             </div>
          </div>

          <div className="text-center">
             <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest bg-white/5 inline-block px-4 py-1.5 rounded-full">سجل رقمي موثق</p>
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-10 text-[10px] text-text-muted text-center uppercase tracking-[0.2em] font-bold">
        حماية المحرك - نظام DriveCare لإدارة الأسطول
      </footer>
    </div>
  );
}
