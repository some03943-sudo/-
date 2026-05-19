import React, { useState } from 'react';
import { useVehicles, useMaintenanceLogs } from '../hooks/useFirebase';
import { MaintenanceTimeline } from './MaintenanceTimeline';
import { VehicleReminders } from './VehicleReminders';
import { VehicleMap } from './VehicleMap';
import { ArrowRight, Calendar, Droplets, Gauge, MessageSquare, Phone, QrCode, Download, Share2, Plus, Zap, User, Car, Bell, AlertTriangle, Trash2, History, MapPin, Navigation } from 'lucide-react';
import { cn, formatDate, formatNumber } from '../lib/utils';
import { getOilLifeStatus, getOilLifePercentage, Reminder } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface VehicleDetailsProps {
  id: string;
  onBack: () => void;
}

export function VehicleDetails({ id, onBack }: VehicleDetailsProps) {
  const { vehicles, updateVehicle, deleteVehicle } = useVehicles();
  const { logs, addLog, loading: logsLoading } = useMaintenanceLogs(id);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showDiagnosticLogin, setShowDiagnosticLogin] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfirmLog, setShowConfirmLog] = useState(false);
  const vehicle = vehicles.find(v => v.id === id);
  const [isEditingDriverNotes, setIsEditingDriverNotes] = useState(false);
  const [localDriverNotes, setLocalDriverNotes] = useState(vehicle?.driverNotes || '');
  const [pendingLog, setPendingLog] = useState<any>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  if (!vehicle) return <div className="text-center py-20 text-brand-muted">المركبة غير موجودة</div>;

  const handleDriverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await updateVehicle(id, { 
          driverPhoto: base64String,
          updatedAt: new Date().toISOString()
        });
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsUploadingPhoto(false);
    }
  };

  const status = getOilLifeStatus(vehicle.currentMileage, vehicle.nextServiceMileage);
  const percentage = getOilLifePercentage(vehicle.currentMileage, vehicle.currentMileage - 5000, vehicle.nextServiceMileage);
  const remaining = vehicle.nextServiceMileage - vehicle.currentMileage;

  const handleLocationUpdate = async (location: { lat: number; lng: number }) => {
    await updateVehicle(id, {
      location,
      lastLocationUpdate: new Date().toISOString()
    });
    // Optional: add a small delay or feedback
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm' });
    // Note: Standard jsPDF fonts don't support Arabic well without extra setup.
    // We'll keep the text as simple labels for now but translated where possible.
    doc.setFont("helvetica", "bold");
    doc.text(`تقارير حالة المركبة: ${vehicle.licensePlate}`, 10, 20);
    doc.text(`السائق: ${vehicle.driverName}`, 10, 30);
    doc.text(`العداد الحالي: ${vehicle.currentMileage} كم`, 10, 40);
    doc.text(`التبديل القادم: ${vehicle.nextServiceMileage} كم`, 10, 50);
    doc.save(`OilTrack_${vehicle.licensePlate}.pdf`);
  };

  const handleExportLogsPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("سجل عمليات الصيانة", 105, 15, { align: 'center' });
    
    // Add vehicle info
    doc.setFontSize(12);
    doc.text(`رقم اللوحة: ${vehicle.licensePlate}`, 14, 25);
    doc.text(`نوع المركبة: ${vehicle.carType}`, 14, 32);
    doc.text(`اسم السائق: ${vehicle.driverName}`, 14, 39);
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-IQ')}`, 14, 46);
    
    // Add logs table
    const tableData = logs.map(log => [
      new Date(log.date).toLocaleDateString('ar-IQ'),
      log.type === 'maintenance' ? 'تبديل زيت دوري' : 'بلاغ عن عطل',
      `${log.mileage.toLocaleString()} كم`,
      log.filterType || '-',
      `${(log.cost || 0).toLocaleString()} د.ع`
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['التاريخ', 'النوع', 'العداد', 'الفلتر', 'التكلفة']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [255, 107, 0] }, // Brand orange
    });

    doc.save(`Log_${vehicle.licensePlate}.pdf`);
  };

  const handleShare = async () => {
    const shareData = {
      title: `سجل صيانة المركبة ${vehicle.licensePlate}`,
      text: `يمكنك متابعة حالة تبديل الزيت والصيانة للمركبة ${vehicle.licensePlate} (${vehicle.carType}) عبر الرابط التالي:`,
      url: `${window.location.origin}/v/${vehicle.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('تم نسخ الرابط إلى الحافظة!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 min-h-full">
      {/* Main Info Area */}
      <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="flex items-center gap-3 text-text-muted hover:text-white transition-all group">
            <div className="h-10 w-10 rounded-xl bg-brand-card flex items-center justify-center border border-white/5 group-hover:border-brand-orange transition-all">
              <ArrowRight className="h-5 w-5" />
            </div>
            <span className="font-bold text-sm">رجوع للقائمة</span>
          </button>
          
          <div className="flex items-center gap-3">
             <button onClick={() => setShowQR(!showQR)} className="h-10 w-10 rounded-xl bg-brand-card border border-white/10 flex items-center justify-center text-text-muted hover:text-brand-orange transition-all" title="QR Code">
              <QrCode className="h-5 w-5" />
            </button>
            <button onClick={handleShare} className="h-10 w-10 rounded-xl bg-brand-card border border-white/10 flex items-center justify-center text-text-muted hover:text-brand-orange transition-all" title="مشاركة السجل">
              <Share2 className="h-5 w-5" />
            </button>
            <button onClick={exportPDF} className="h-10 w-10 rounded-xl bg-brand-card border border-white/10 flex items-center justify-center text-text-muted hover:text-blue-400 transition-all" title="تصدير PDF">
              <Download className="h-5 w-5" />
            </button>
            <button onClick={() => setShowAddLog(true)} className="bg-brand-orange text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-400 transition-all shadow-lg shadow-brand-orange/10">
              <Plus className="h-4 w-4" />
              تحديث الصيانة
            </button>
            <button onClick={() => setShowReportIssue(true)} className="bg-status-overdue/10 text-status-overdue border border-status-overdue/20 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-status-overdue hover:text-white transition-all">
              <AlertTriangle className="h-4 w-4" />
              بلاغ عن عطل
            </button>
            <button onClick={() => setShowDiagnosticLogin(true)} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-all">
              <Zap className="h-4 w-4" />
              تشخيص متقدم
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="h-10 w-10 rounded-xl bg-status-overdue/10 border border-status-overdue/20 flex items-center justify-center text-status-overdue hover:bg-status-overdue hover:text-white transition-all" title="حذف المركبة">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="bg-brand-card rounded-3xl border border-white/5 overflow-hidden shadow- immersive">
          <div className="h-64 relative bg-brand-surface overflow-hidden">
             {vehicle.carPhoto && (
               <img src={vehicle.carPhoto} className="absolute inset-0 w-full h-full object-cover" alt="" />
             )}
             <div className="absolute inset-0 bg-gradient-to-b from-brand-black/20 via-brand-black/40 to-brand-card" />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!vehicle.carPhoto && <Car className="h-32 w-32 text-white/5 -rotate-12" />}
             </div>
             <div className="absolute bottom-8 right-8 left-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-end gap-6">
                  <div className="h-24 w-24 rounded-3xl border-4 border-brand-orange bg-brand-black shadow-2xl relative group cursor-pointer overflow-hidden">
                    <img 
                      src={vehicle.driverPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${vehicle.driverName}`} 
                      className={cn("w-full h-full object-cover rounded-2xl transition-all", isUploadingPhoto && "opacity-50 blur-sm")} 
                      alt="" 
                    />
                    <div className="absolute inset-0 bg-brand-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Plus className="h-6 w-6 text-white" />
                    </div>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept="image/*"
                      onChange={handleDriverPhotoUpload}
                    />
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-6 w-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 -left-2 bg-status-excellent h-6 w-6 rounded-full border-4 border-brand-black" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-white leading-none mb-2 tracking-tight">{vehicle.licensePlate}</h1>
                    <div className="flex gap-2 items-center">
                      <p className="text-brand-orange font-bold text-lg uppercase">{vehicle.carType}</p>
                      {(vehicle.model || vehicle.year) && (
                        <p className="text-text-muted text-sm font-bold uppercase tracking-wider">
                          {vehicle.model && `• ${vehicle.model}`}
                          {vehicle.year && ` • ${vehicle.year}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <div className={cn("px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest inline-block border mb-2", 
                    status === 'excellent' ? 'bg-status-excellent/10 text-status-excellent border-status-excellent/20' : 
                    status === 'near' ? 'bg-status-near/10 text-status-near border-status-near/20' : 
                    'bg-status-overdue/10 text-status-overdue border-status-overdue/20 animate-pulse'
                   )}>
                      {status === 'excellent' ? 'حالة ممتازة' : status === 'near' ? 'قرب الموعد' : 'تنبيه: تجاوز الحد'}
                   </div>
                   <p className="text-2xl font-mono font-bold text-white leading-none">
                    {formatNumber(vehicle.currentMileage)} <span className="text-xs text-text-muted font-sans font-bold">كم (الإجمالي)</span>
                   </p>
                </div>
             </div>
          </div>
          
          <div className="p-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-4">بيانات السائق والمهمة</h3>
                   <div className="flex items-center gap-4 group">
                     <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-text-muted group-hover:text-brand-orange transition-all">
                       <User className="h-6 w-6" />
                     </div>
                     <div>
                       <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider flex items-center gap-2">
                         <User className="h-3 w-3 text-brand-orange" />
                         الاسم بالكامل
                       </p>
                       <p className="text-lg font-bold">{vehicle.driverName}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 group">
                     <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-text-muted group-hover:text-brand-orange transition-all">
                       <Phone className="h-6 w-6" />
                     </div>
                     <div>
                       <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider flex items-center gap-2">
                         <Phone className="h-3 w-3 text-brand-orange" />
                         رقم الاتصال المباشر
                       </p>
                       <p className="text-lg font-mono font-bold text-brand-orange">{vehicle.driverPhone}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 group transition-all">
                     <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-text-muted group-hover:text-brand-orange transition-all">
                       <Calendar className="h-6 w-6" />
                     </div>
                     <div>
                       <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">تاريخ تسجيل المركبة</p>
                       <p className="text-lg font-bold">{formatDate(vehicle.createdAt)}</p>
                     </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-4">الحالة الميكانيكية</h3>
                   <div className="flex items-center gap-4 group transition-all">
                     <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-text-muted group-hover:text-status-near transition-all">
                       <Calendar className="h-6 w-6" />
                     </div>
                     <div>
                       <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">تاريخ آخر تبديل</p>
                       <p className="text-lg font-bold">{vehicle.lastOilChangeDate ? formatDate(vehicle.lastOilChangeDate) : 'غير مسجل'}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 group transition-all">
                     <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-text-muted group-hover:text-status-excellent transition-all">
                       <Droplets className="h-6 w-6" />
                     </div>
                     <div>
                       <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">نوع الزيت المعتمد</p>
                       <p className="text-lg font-bold">{vehicle.oilType || 'غير محدد'}</p>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Featured Oil Life Section */}
        <div className="bg-brand-card rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-2xl">
           <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
           <div className="relative p-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1 space-y-8 text-center lg:text-right">
                 <div>
                    <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.3em] mb-3">الحالة التشغيلية للمحرك</h3>
                    <h2 className="text-4xl font-black text-white leading-tight">جاهزية <span className="text-brand-orange">زيت المحرك</span></h2>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                       <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2">المسافة الحالية</p>
                       <p className="text-2xl font-mono font-bold text-white tracking-tighter">{formatNumber(vehicle.currentMileage)} <span className="text-xs text-text-muted font-sans lowercase">km</span></p>
                    </div>
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                       <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2">الموعد القادم</p>
                       <p className="text-2xl font-mono font-bold text-brand-orange tracking-tighter">{formatNumber(vehicle.nextServiceMileage)} <span className="text-xs text-text-muted font-sans lowercase">km</span></p>
                    </div>
                 </div>

                 <div className="pt-4 flex flex-col items-center lg:items-end gap-3 text-right">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                          "h-3 w-3 rounded-full",
                          status === 'overdue' ? 'bg-status-overdue animate-pulse' : 
                          status === 'near' ? 'bg-status-near animate-pulse' : 'bg-status-excellent shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                       )} />
                       <p className="text-xl font-bold text-white">
                          {remaining > 0 ? (
                             <>متبقي <span className="text-brand-orange font-black">{formatNumber(remaining)} كم</span> للصيانة</>
                          ) : (
                             <span className="text-status-overdue">تجاوزت الموعد بـ {formatNumber(Math.abs(remaining))} كم</span>
                          )}
                       </p>
                    </div>
                    <p className="text-xs text-text-muted font-medium max-w-sm">يُنصح دائماً بتبديل الزيت قبل انتهاء العمر الافتراضي لضمان سلامة المحرك وكفاءة استهلاك الوقود.</p>
                 </div>
              </div>

              <div className="shrink-0 relative">
                 {/* Large High-Tech Gauge */}
                 <div className="relative h-64 w-64">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                       {/* Glossy ring effect */}
                       <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.02)" />
                       
                       {/* Background track */}
                       <circle
                         cx="50"
                         cy="50"
                         r="42"
                         stroke="currentColor"
                         strokeWidth="6"
                         fill="transparent"
                         className="text-white/5"
                       />
                       
                       {/* Gauge ticks */}
                       <g className="text-white/10">
                          {[...Array(12)].map((_, i) => (
                             <line 
                                key={i}
                                x1="50" y1="12" x2="50" y2="18"
                                transform={`rotate(${i * 30} 50 50)`}
                                stroke="currentColor"
                                strokeWidth="2"
                             />
                          ))}
                       </g>

                       {/* Progress track */}
                       <motion.circle
                         cx="50"
                         cy="50"
                         r="42"
                         stroke="currentColor"
                         strokeWidth="8"
                         fill="transparent"
                         strokeDasharray="263.89"
                         initial={{ strokeDashoffset: 263.89 }}
                         animate={{ strokeDashoffset: 263.89 * (1 - percentage / 100) }}
                         transition={{ duration: 2, ease: "circOut" }}
                         strokeLinecap="round"
                         className={cn(
                           status === 'overdue' ? 'text-status-overdue' : 
                           status === 'near' ? 'text-status-near' : 
                           'text-status-excellent'
                         )}
                         style={{ filter: `drop-shadow(0 0 8px ${status === 'overdue' ? '#ef4444' : status === 'near' ? '#f59e0b' : '#22c55e'})` }}
                       />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <motion.div 
                         initial={{ scale: 0.8, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         transition={{ delay: 0.5 }}
                         className="flex flex-col items-center"
                       >
                          <span className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-1">متبقي</span>
                          <span className={cn(
                            "text-6xl font-black font-mono leading-none tracking-tighter",
                            status === 'overdue' ? 'text-status-overdue' : 'text-white'
                          )}>
                             {Math.round(percentage)}<span className="text-2xl opacity-50">%</span>
                          </span>
                       </motion.div>
                    </div>

                    <AnimatePresence>
                       {status !== 'excellent' && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className={cn(
                              "absolute -top-2 -right-2 h-12 w-12 rounded-2xl flex items-center justify-center border-4 border-brand-card shadow-2xl z-10",
                              status === 'overdue' ? "bg-status-overdue animate-pulse" : "bg-status-near"
                            )}
                          >
                             <AlertTriangle className="h-6 w-6 text-brand-black" />
                          </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
              </div>
           </div>

           {/* Driver Notes Section */}
           <div className="p-10 pt-0 border-t border-white/5">
              <div className="flex items-center justify-between mt-8 mb-4">
                 <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    ملاحظات السائق الخاصة
                 </h3>
                 <button 
                   onClick={async () => {
                     if (isEditingDriverNotes) {
                       await updateVehicle(vehicle.id, { driverNotes: localDriverNotes });
                     }
                     setIsEditingDriverNotes(!isEditingDriverNotes);
                   }}
                   className="text-brand-orange text-[10px] font-bold uppercase tracking-widest hover:underline"
                 >
                   {isEditingDriverNotes ? 'حفظ الملاحظات' : 'تعديل'}
                 </button>
              </div>
              {isEditingDriverNotes ? (
                <textarea
                  className="w-full bg-brand-black/50 rounded-2xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-brand-orange outline-none resize-none text-right font-medium"
                  value={localDriverNotes}
                  onChange={(e) => setLocalDriverNotes(e.target.value)}
                  placeholder="اكتب هنا ملاحظات السائق..."
                  rows={3}
                  dir="rtl"
                />
              ) : (
                <p className={cn(
                  "text-text-primary leading-loose font-medium",
                  !vehicle.driverNotes && "text-text-muted italic text-sm"
                )}>
                   {vehicle.driverNotes || 'لا توجد ملاحظات مسجلة للسائق حالياً.'}
                </p>
              )}
           </div>
        </div>

        {/* Vehicle Tracking Map Section */}
        <div className="bg-brand-card p-10 rounded-3xl border border-white/5 space-y-6">
           <div className="flex items-center justify-between">
              <div>
                 <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    تتبع موقع المركبة
                 </h3>
                 <p className="text-sm text-text-muted font-medium">الموقع الحالي وخط السير المسجل</p>
              </div>
              <button 
                onClick={() => setIsUpdatingLocation(!isUpdatingLocation)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  isUpdatingLocation 
                    ? "bg-brand-orange text-black shadow-lg shadow-brand-orange/20" 
                    : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                )}
              >
                <MapPin className="h-4 w-4" />
                {isUpdatingLocation ? 'جاري التحديد...' : 'تحديث الموقع'}
              </button>
           </div>
           
           <VehicleMap 
             location={vehicle.location} 
             isEditable={isUpdatingLocation}
             onLocationSelect={(loc) => {
               handleLocationUpdate(loc);
               setIsUpdatingLocation(false);
             }}
           />

           {vehicle.lastLocationUpdate && (
             <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold uppercase tracking-wider">
                <History className="h-3 w-3" />
                آخر تحديث: {formatDate(vehicle.lastLocationUpdate)}
             </div>
           )}
        </div>

        {/* Reminders Section */}
        <div className="bg-brand-card p-10 rounded-3xl border border-white/5">
           <VehicleReminders 
             vehicle={vehicle} 
             onUpdate={async (reminders) => {
               await updateVehicle(vehicle.id, { reminders });
             }} 
           />
        </div>

        {/* Notes Section */}
        {vehicle.notes && (
          <div className="bg-brand-card p-10 rounded-3xl border border-white/5">
             <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                ملاحظات مدير الأسطول
             </h3>
             <p className="text-text-primary leading-loose font-medium">{vehicle.notes}</p>
          </div>
        )}

        {/* Oil Type Section */}
        <div className="bg-brand-card p-10 rounded-3xl border border-white/5">
           <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              نوع الزيت المعتمد
           </h3>
           <div className="flex items-center gap-4 p-6 rounded-2xl bg-brand-black/20 border border-white/5">
              <div className="p-3 rounded-xl bg-brand-orange/10 text-brand-orange">
                 <Droplets className="h-6 w-6" />
              </div>
              <p className="text-xl font-bold text-white">
                 {vehicle.oilType || 'غير محدد'}
              </p>
           </div>
        </div>

        {/* Recent History Section */}
        <div className="bg-brand-card p-10 rounded-3xl border border-white/5">
           <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <History className="h-4 w-4" />
              آخر 5 عمليات صيانة
           </h3>
           <div className="overflow-hidden rounded-2xl border border-white/5 bg-brand-black/20">
              <div className="grid grid-cols-3 p-4 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">
                 <div>التاريخ</div>
                 <div>النوع</div>
                 <div>العداد (كم)</div>
              </div>
              <div className="divide-y divide-white/5">
                 {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="grid grid-cols-3 p-4 text-sm font-medium text-white text-right">
                       <div className="text-text-muted">{formatDate(log.date)}</div>
                       <div className={cn(
                          log.type === 'issue' ? 'text-status-overdue' : 'text-brand-orange'
                       )}>
                          {log.type === 'issue' ? 'بلاغ عطل' : 'صيانة دورية'}
                       </div>
                       <div className="font-mono font-bold">{formatNumber(log.mileage)}</div>
                    </div>
                 ))}
                 {logs.length === 0 && (
                    <div className="p-8 text-center text-text-muted text-xs italic">لا توجد سجلات سابقة بعد</div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Right Detail Panel: Maintenance Timeline */}
      <div className="w-full xl:w-[380px] space-y-8">
        <div className="bg-brand-card border border-white/5 p-8 rounded-3xl min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">سجل الصيانة الأخير</h3>
            <button 
              onClick={handleExportLogsPDF}
              className="flex items-center gap-2 text-[10px] font-bold text-brand-orange hover:underline uppercase tracking-widest"
              title="تصدير سجل الصيانة"
            >
              <Download className="h-3 w-3" />
              تصدير السجل
            </button>
          </div>
          
          <div className="flex-1">
            {logsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />)}
              </div>
            ) : (
              <MaintenanceTimeline logs={logs} />
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
            <div 
              onClick={() => setShowQR(true)}
              className="bg-white/5 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all"
            >
              <div className="flex flex-col">
                <p className="text-[10px] uppercase text-text-muted font-bold tracking-tight">مفتاح الوصول</p>
                <p className="text-xs font-bold text-white">سجل QR للمركبة</p>
              </div>
              <div className="w-10 h-10 bg-white flex items-center justify-center rounded-lg p-0.5 shadow-lg group-hover:scale-105 transition-all">
                 <QRCodeSVG value={`${window.location.origin}/v/${vehicle.id}`} size={36} />
              </div>
            </div>

            <div className="p-4 border border-white/10 rounded-2xl bg-gradient-to-br from-brand-orange/10 to-transparent">
              <div className="flex gap-3 items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest leading-none">مزامنة سحابية نشطة</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Log Modal */}
      <AnimatePresence>
        {showAddLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-right" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-black/90 backdrop-blur-md" onClick={() => setShowAddLog(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-brand-card w-full max-w-lg rounded-3xl p-10 border border-white/10 shadow-immersive">
               <h2 className="text-2xl font-bold mb-2 text-brand-orange">تبديل زيت جديد</h2>
               <p className="text-text-muted text-sm mb-8 font-medium italic">إضافة بيانات الخدمة الدورية للمركبة</p>
               <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => {
                 e.preventDefault();
                 const fd = new FormData(e.currentTarget);
                 const currentMileage = Number(fd.get('mileage'));
                 const nextMileage = Number(fd.get('next'));
                 const maintenanceDate = new Date(fd.get('date') as string).toISOString();
                 
                 setPendingLog({
                   vehicleId: id,
                   type: 'maintenance',
                   date: maintenanceDate,
                   mileage: currentMileage,
                   nextMileage,
                   cost: Number(fd.get('cost')),
                   filterType: fd.get('filterType') as string,
                   mechanicName: fd.get('mechanic') as string
                 });

                 setShowConfirmLog(true);
               }}>
                 <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">تاريخ الصيانة</label>
                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-brand-orange outline-none text-right" required />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">عداد المسافة الحالي</label>
                    <input name="mileage" type="number" defaultValue={vehicle.currentMileage} className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-brand-orange outline-none font-mono text-right" required />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">موعد التبديل القادم</label>
                    <input name="next" type="number" defaultValue={vehicle.currentMileage + 5000} className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-brand-orange/30 focus:ring-1 focus:ring-brand-orange outline-none font-mono text-right" required />
                 </div>
                 <div>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest justify-end">
                      نوع الفلتر
                      <Droplets className="h-3 w-3 text-brand-orange" />
                    </label>
                    <input name="filterType" placeholder="أصلي" className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-brand-orange outline-none text-right" required />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">التكلفة (IQD)</label>
                    <input name="cost" type="number" placeholder="0.00" className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-brand-orange outline-none font-mono text-right" required />
                 </div>
                 <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest justify-end">
                      اسم الفني
                      <User className="h-3 w-3 text-brand-orange" />
                    </label>
                    <input name="mechanic" placeholder="م. علي" className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-brand-orange outline-none text-right" required />
                 </div>
                 <div className="md:col-span-2 pt-4">
                  <button className="w-full bg-brand-orange text-black py-4 rounded-xl font-bold text-lg hover:bg-orange-400 transition-all shadow-xl shadow-brand-orange/20">تأكيد التبديل وحفظ السجل</button>
                  <button type="button" onClick={() => setShowAddLog(false)} className="w-full mt-4 text-text-muted font-bold text-sm">إلغاء</button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Issue Modal */}
      <AnimatePresence>
        {showReportIssue && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-black/90 backdrop-blur-md" onClick={() => setShowReportIssue(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-brand-card w-full max-w-lg rounded-3xl p-10 border border-white/10 shadow-immersive text-right">
               <div className="h-12 w-12 rounded-2xl bg-status-overdue/10 flex items-center justify-center text-status-overdue mb-6 ml-auto">
                  <AlertTriangle className="h-6 w-6" />
               </div>
               <h2 className="text-2xl font-bold mb-2 text-white">إبلاغ عن عطل أو خلل</h2>
               <p className="text-text-muted text-sm mb-8 font-medium italic">يرجى تقديم تفاصيل دقيقة عن المشكلة التي تواجهها المركبة</p>
               
               <form className="space-y-6" onSubmit={async (e) => {
                 e.preventDefault();
                 const fd = new FormData(e.currentTarget);
                 
                 await addLog({
                   vehicleId: id,
                   type: 'issue',
                   severity: fd.get('severity') as 'low' | 'medium' | 'high',
                   date: new Date(fd.get('date') as string).toISOString(),
                   mileage: Number(fd.get('mileage')),
                   notes: fd.get('description') as string,
                   cost: 0
                 });

                 setShowReportIssue(false);
               }}>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">تاريخ الاكتشاف</label>
                      <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-status-overdue outline-none text-right" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">عداد المسافة عند العطل</label>
                      <input name="mileage" type="number" defaultValue={vehicle.currentMileage} className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-status-overdue outline-none font-mono text-right" required />
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">مستوى الخطورة</label>
                    <select name="severity" className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-status-overdue outline-none appearance-none text-right" required>
                      <option value="low">منخفضة (يمكن مواصلة العمل)</option>
                      <option value="medium">متوسطة (يتطلب مراجعة قريبة)</option>
                      <option value="high">عالية (توقف فوري للمركبة)</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">وصف العطل أو الخلل</label>
                    <textarea 
                      name="description" 
                      rows={4} 
                      placeholder="اشرح طبيعة المشكلة بالتفصيل..." 
                      className="w-full bg-brand-black/50 rounded-2xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-status-overdue outline-none resize-none text-right"
                      required
                    ></textarea>
                 </div>

                 <div className="flex flex-row-reverse gap-4 pt-4">
                   <button className="flex-1 bg-status-overdue text-white py-4 rounded-xl font-bold hover:bg-red-500 transition-all shadow-xl shadow-status-overdue/20">تقديم البلاغ</button>
                   <button type="button" onClick={() => setShowReportIssue(false)} className="flex-1 bg-white/5 text-white py-4 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all">إلغاء</button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advanced Diagnostics Login Modal */}
      <AnimatePresence>
        {showDiagnosticLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-right" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-black/90 backdrop-blur-md" onClick={() => setShowDiagnosticLogin(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative bg-brand-card w-full max-w-md rounded-3xl p-10 border border-white/10 shadow-2xl">
               <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-8 mx-auto">
                  <Zap className="h-8 w-8" />
               </div>
               <h2 className="text-2xl font-bold mb-2 text-white text-center">خدمة التشخيص المتقدم</h2>
               <p className="text-text-muted text-sm mb-10 text-center font-medium">يتطلب الوصول لبيانات الحساسات والأعطال العميقة تسجيل دخول معتمد</p>
               
               <form className="space-y-6" onSubmit={(e) => {
                 e.preventDefault();
                 alert('بيانات الدخول غير صحيحة أو الخدمة قيد التطوير.');
                 setShowDiagnosticLogin(false);
               }}>
                 <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">اسم المستخدم</label>
                    <input type="text" placeholder="admin_technician" className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-blue-500 outline-none" required />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">كلمة المرور</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-brand-black/50 rounded-xl p-4 text-white border border-white/5 focus:ring-1 focus:ring-blue-500 outline-none" required />
                 </div>

                 <div className="flex flex-col gap-4 pt-4">
                   <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20">تسجيل الدخول للنظام</button>
                   <button type="button" onClick={() => setShowDiagnosticLogin(false)} className="w-full bg-white/5 text-white py-4 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all">إلغاء</button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 text-right" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-black/90 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-brand-card w-full max-w-md rounded-3xl p-10 border border-white/10 shadow-immersive">
               <div className="h-16 w-16 rounded-2xl bg-status-overdue/10 flex items-center justify-center text-status-overdue mb-6 mx-auto">
                  <Trash2 className="h-8 w-8" />
               </div>
               <h2 className="text-2xl font-bold mb-2 text-white text-center">حذف المركبة نهائياً؟</h2>
               <p className="text-text-muted text-sm mb-10 text-center font-medium italic">هل أنت متأكد من حذف المركبة {vehicle.licensePlate}؟ هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع سجلات الصيانة المرتبطة بها.</p>
               
               <div className="flex flex-col gap-4">
                 <button 
                  onClick={async () => {
                    await deleteVehicle(vehicle.id);
                    onBack();
                  }}
                  className="w-full bg-status-overdue text-white py-4 rounded-xl font-bold hover:bg-red-500 transition-all shadow-xl shadow-status-overdue/20"
                 >
                   نعم، احذف المركبة
                 </button>
                 <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className="w-full bg-white/5 text-white py-4 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all"
                 >
                   إلغاء
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showConfirmLog && pendingLog && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 text-right" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-black/90 backdrop-blur-md" onClick={() => setShowConfirmLog(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-brand-card w-full max-w-md rounded-3xl p-10 border border-white/10 shadow-immersive">
               <div className="h-16 w-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange mb-6 mx-auto">
                  <Droplets className="h-8 w-8" />
               </div>
               <h2 className="text-2xl font-bold mb-2 text-white text-center">تأكيد بيانات الصيانة</h2>
               <p className="text-text-muted text-sm mb-8 text-center font-medium italic">يرجى مراجعة البيانات التالية قبل التثبيت النهائي في سجل المركبة</p>
               
               <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5 mb-8">
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">تحت العداد</span>
                    <span className="text-white font-mono font-bold">{formatNumber(pendingLog.mileage)} كم</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">الموعد القادم</span>
                    <span className="text-brand-orange font-mono font-bold">{formatNumber(pendingLog.nextMileage)} كم</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">نوع الفلتر</span>
                    <span className="text-white font-bold">{pendingLog.filterType}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">اسم الفني</span>
                    <span className="text-white font-bold">{pendingLog.mechanicName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest">التكلفة الإجمالية</span>
                    <span className="text-white font-mono font-bold">{formatNumber(pendingLog.cost)} د.ع</span>
                  </div>
               </div>
               
               <div className="flex flex-col gap-4">
                 <button 
                  onClick={async () => {
                    await addLog({
                      vehicleId: pendingLog.vehicleId,
                      type: 'maintenance',
                      date: pendingLog.date,
                      mileage: pendingLog.mileage,
                      cost: pendingLog.cost,
                      filterType: pendingLog.filterType,
                      mechanicName: pendingLog.mechanicName
                    });

                    await updateVehicle(pendingLog.vehicleId, {
                      currentMileage: pendingLog.mileage,
                      nextServiceMileage: pendingLog.nextMileage,
                      lastOilChangeDate: pendingLog.date,
                      updatedAt: new Date().toISOString()
                    });

                    setShowConfirmLog(false);
                    setShowAddLog(false);
                    setPendingLog(null);
                  }}
                  className="w-full bg-brand-orange text-black py-4 rounded-xl font-bold hover:bg-orange-400 transition-all shadow-xl shadow-brand-orange/20"
                 >
                   تأكيد وحفظ السجل
                 </button>
                 <button 
                  onClick={() => setShowConfirmLog(false)} 
                  className="w-full bg-white/5 text-white py-4 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all"
                 >
                   تعديل البيانات
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-black/95 backdrop-blur-xl" onClick={() => setShowQR(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center text-center">
               <div className="bg-white p-4 rounded-3xl mb-8">
                  <QRCodeSVG value={`${window.location.origin}/v/${vehicle.id}`} size={280} />
               </div>
               <h3 className="text-black text-2xl font-black mb-2 leading-none">{vehicle.licensePlate}</h3>
               <p className="text-black/50 font-bold uppercase tracking-widest text-[10px] mb-8">امسح الكود للوصول للسجل العام للمركبة</p>
               <button 
                onClick={() => setShowQR(false)}
                className="bg-black text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl"
               >
                إغلاق النافذة
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


function UserIcon({ className }: { className?: string }) { return <User className={className} />; }
