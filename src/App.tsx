import React, { useState, useEffect } from 'react';
import { useAuth } from './lib/AuthContext';
import { useVehicles, uploadVehicleImage } from './hooks/useFirebase';
import { Dashboard } from './components/Dashboard';
import { VehicleList } from './components/VehicleList';
import { VehicleDetails } from './components/VehicleDetails';
import { Search, Plus, Bell, Settings, LogOut, Car, LayoutDashboard, Database, X, QrCode, Barcode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportAllData, setupLocalNotifications, sendLocalServiceReminder } from './services/backupService';
import { getOilLifeStatus, Reminder } from './types';
import { PublicVehicleView } from './components/PublicVehicleView';
import { NotificationCenter } from './components/NotificationCenter';
import { QRScanner } from './components/QRScanner';
import { OilOperations } from './components/OilOperations';

export default function App() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [view, setView] = useState<'dashboard' | 'vehicles' | 'details' | 'operations'>('dashboard');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'excellent' | 'near' | 'overdue'>('all');
  const { vehicles, loading: vehiclesLoading, addVehicle, updateVehicle } = useVehicles();

  // Basic routing for public QR views
  const path = window.location.pathname;
  const isPublicView = path.startsWith('/v/') || path.startsWith('/vehicle/');
  const publicId = isPublicView ? path.split('/').pop() || null : null;

  const handleClearReminder = async (vehicleId: string, reminderId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const updatedReminders = (vehicle.reminders || []).map(r => 
      r.id === reminderId ? { ...r, completed: true, notified: true } : r
    );

    await updateVehicle(vehicleId, { reminders: updatedReminders });
  };

  const activeNotificationsCount = vehicles.reduce((acc, v) => {
    const triggered = (v.reminders || []).filter(r => {
      if (r.completed) return false;
      if (r.type === 'mileage') return v.currentMileage >= (r.targetValue as number);
      return new Date() >= new Date(r.targetValue as string);
    });
    return acc + triggered.length;
  }, 0);

  useEffect(() => {
    if (user) {
      setupLocalNotifications();
      // Check for service reminders on load
      vehicles.forEach(v => {
        if (getOilLifeStatus(v.currentMileage, v.nextServiceMileage) === 'near') {
          // sendLocalServiceReminder(v); // Disabled by default to avoid spam in dev
        }
      });
    }
  }, [user, vehicles.length]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-black" dir="rtl">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-brand-orange font-bold text-2xl"
        >
          أويل تراك
        </motion.div>
      </div>
    );
  }

  if (isPublicView && publicId) {
    return <PublicVehicleView vehicleId={publicId} />;
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-brand-black p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          dir="rtl"
        >
          <div className="mb-4 inline-block rounded-full bg-brand-orange/10 p-4">
            <Car className="h-12 w-12 text-brand-orange" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">درايف كير | أويل تراك</h1>
          <p className="text-brand-muted max-w-sm mx-auto font-medium">نظام احترافي لإدارة صيانة المركبات ومراقبة مواعيد تبديل الزيت.</p>
        </motion.div>
        <button 
          onClick={signIn}
          className="flex items-center gap-2 rounded-full bg-brand-orange px-8 py-3 font-bold text-black transition-all hover:bg-orange-400 active:scale-95 shadow-xl shadow-brand-orange/20"
        >
          تسجيل الدخول باستخدام Google
        </button>
      </div>
    );
  }

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    setView('details');
  };

  const handleQRScan = (decodedText: string) => {
    setShowScanner(false);
    
    // Check if it's an operation barcode
    if (decodedText.startsWith('OP-')) {
      setSearchQuery(decodedText);
      setView('operations');
      return;
    }
    
    // Check if the QR code is a URL from our app
    try {
      const url = new URL(decodedText);
      const host = window.location.host;
      
      if (url.host === host || url.host.includes('.run.app')) {
        const parts = url.pathname.split('/');
        const id = parts[parts.length - 1];
        if (id) {
          handleSelectVehicle(id);
          return;
        }
      }
    } catch (e) {
      // If it's not a URL, it might just be the ID
      if (decodedText.length > 5) {
        handleSelectVehicle(decodedText);
        return;
      }
    }
    
    alert('رمز QR غير صالح أو لا يخص هذا النظام.');
  };

  const handleBackup = async () => {
    const success = await exportAllData(user.uid);
    if (success) alert('تم حفظ النسخة الاحتياطية بنجاح!');
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && getOilLifeStatus(v.currentMileage, v.nextServiceMileage) === statusFilter;
  });

  const overdueCount = vehicles.filter(v => getOilLifeStatus(v.currentMileage, v.nextServiceMileage) === 'overdue').length;
  const nearCount = vehicles.filter(v => getOilLifeStatus(v.currentMileage, v.nextServiceMileage) === 'near').length;

  return (
    <div className="flex flex-col h-screen bg-brand-black text-text-primary overflow-hidden" dir="rtl">
      {/* Top Header */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between glass-header shrink-0 z-30" dir="rtl">
        <div className="flex items-center gap-4">
          <div className="bg-brand-orange p-2 rounded-lg">
            <Car className="h-6 w-6 text-black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-brand-orange">
            درايف كير <span className="text-white/30 font-light ml-1">| أويل تراك</span>
          </h1>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          <div className="flex gap-6">
            <div 
              className="text-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => { setStatusFilter('all'); setView('vehicles'); }}
            >
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">إجمالي المركبات</p>
              <p className="text-lg font-mono font-bold leading-none mt-1">{vehicles.length}</p>
            </div>
            <div 
              className="text-center border-x border-white/10 px-6 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => { setStatusFilter('near'); setView('vehicles'); }}
            >
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">قرب التبديل</p>
              <p className="text-lg font-mono font-bold leading-none mt-1 text-status-near">{nearCount}</p>
            </div>
            <div 
              className="text-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => { setStatusFilter('overdue'); setView('vehicles'); }}
            >
              <p className="text-[10px] uppercase tracking-wider text-status-overdue font-bold">تأخير (تنبيه)</p>
              <p className="text-lg font-mono font-bold leading-none mt-1 text-status-overdue underline decoration-2 underline-offset-4">{overdueCount}</p>
            </div>
          </div>
          <div className="h-10 w-64 bg-white/5 border border-white/10 rounded-full flex items-center px-4 gap-2">
            <Search className="h-4 w-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="بحث باسم السائق..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs w-full focus:ring-0 placeholder:text-text-muted"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowScanner(true)}
            className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-text-muted hover:text-brand-orange hover:border-brand-orange/30 transition-all group"
            title="مسح QR"
          >
            <QrCode className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold hidden sm:inline">مسح QR</span>
          </button>

          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold text-white text-right">{user.displayName}</p>
            <p className="text-[10px] text-text-muted text-right uppercase tracking-tighter">مدير الحساب</p>
          </div>
          <img 
            src={user.photoURL || ''} 
            alt={user.displayName || ''} 
            className="h-9 w-9 rounded-full border border-brand-orange/30 p-0.5"
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar (Desktop) */}
        <nav className="hidden lg:flex w-16 border-l border-white/5 flex flex-col items-center py-6 gap-6 bg-brand-sidebar z-20">
          <button 
            onClick={() => setView('dashboard')}
            className={`p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-white/5 text-brand-orange' : 'text-text-muted hover:text-white'}`}
            title="لوحة التحكم"
          >
            <LayoutDashboard className="h-6 w-6" />
          </button>
          <button 
            onClick={() => setView('vehicles')}
            className={`p-3 rounded-xl transition-all ${view === 'vehicles' ? 'bg-white/5 text-brand-orange' : 'text-text-muted hover:text-white'}`}
            title="المركبات"
          >
            <Car className="h-6 w-6" />
          </button>
          <button 
            onClick={() => setView('operations')}
            className={`p-3 rounded-xl transition-all ${view === 'operations' ? 'bg-white/5 text-brand-orange' : 'text-text-muted hover:text-white'}`}
            title="عمليات التبديل"
          >
            <Barcode className="h-6 w-6" />
          </button>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-3 rounded-xl transition-all relative ${showNotifications ? 'bg-white/5 text-brand-orange' : 'text-text-muted hover:text-white'}`}
            title="التنبيهات"
          >
            <Bell className="h-6 w-6" />
            {activeNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 h-4 w-4 bg-status-overdue text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-brand-sidebar">
                {activeNotificationsCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <NotificationCenter 
                  vehicles={vehicles} 
                  onClose={() => setShowNotifications(false)}
                  onClear={handleClearReminder}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={handleBackup}
            className="p-3 text-text-muted hover:text-white transition-all"
            title="النسخ الاحتياطي"
          >
            <Database className="h-6 w-6" />
          </button>
          <div className="mt-auto flex flex-col gap-6 items-center">
            <button className="p-3 text-text-muted hover:text-white transition-all">
              <Settings className="h-6 w-6" />
            </button>
            <button 
              onClick={signOut}
              className="p-3 text-red-500/50 hover:text-red-500 transition-all"
              title="خروج"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </nav>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-brand-black relative">
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
            <AnimatePresence mode="wait">
              {view === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Dashboard 
                    vehicles={vehicles} 
                    onSelectVehicle={handleSelectVehicle}
                    onStatusFilter={(status) => {
                      setStatusFilter(status);
                      setView('vehicles');
                    }}
                  />
                </motion.div>
              )}
              {view === 'vehicles' && (
                <motion.div 
                  key="vehicles"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">أسطول المركبات النشطة ({vehicles.length})</h2>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button onClick={() => setShowAddVehicle(true)} className="flex-1 sm:flex-initial px-5 py-2.5 bg-brand-orange text-black rounded-xl text-xs font-bold hover:bg-orange-400 transition-all shadow-lg shadow-brand-orange/20">
                        إضافة مركبة +
                      </button>
                    </div>
                  </div>
                  <VehicleList 
                    vehicles={filteredVehicles} 
                    onSelectVehicle={handleSelectVehicle}
                    activeFilter={statusFilter}
                    onFilterChange={setStatusFilter}
                  />
                </motion.div>
              )}
              {view === 'details' && selectedVehicleId && (
                <motion.div 
                  key="details"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <button 
                    onClick={() => setView('vehicles')}
                    className="flex lg:hidden items-center gap-2 text-text-muted mb-4 font-bold text-xs"
                  >
                    <X className="h-4 w-4" /> العودة للقائمة
                  </button>
                  <VehicleDetails 
                    id={selectedVehicleId} 
                    onBack={() => setView('vehicles')}
                  />
                </motion.div>
              )}
              {view === 'operations' && (
                <motion.div 
                  key="operations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                   <OilOperations initialSearch={searchQuery} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Bottom Navigation (Mobile) */}
        <nav className="flex lg:hidden h-16 border-t border-white/10 items-center justify-around bg-brand-sidebar z-40 shrink-0">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'dashboard' ? 'text-brand-orange' : 'text-text-muted'}`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-bold">الرئيسية</span>
          </button>
          <button 
            onClick={() => setView('vehicles')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'vehicles' ? 'text-brand-orange' : 'text-text-muted'}`}
          >
            <Car className="h-5 w-5" />
            <span className="text-[10px] font-bold">المركبات</span>
          </button>
          <button 
            onClick={() => setView('operations')}
            className={`flex flex-col items-center gap-1 transition-all ${view === 'operations' ? 'text-brand-orange' : 'text-text-muted'}`}
          >
            <Barcode className="h-5 w-5" />
            <span className="text-[10px] font-bold">العمليات</span>
          </button>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`flex flex-col items-center gap-1 transition-all relative ${showNotifications ? 'text-brand-orange' : 'text-text-muted'}`}
          >
            <Bell className="h-5 w-5" />
            <span className="text-[10px] font-bold">تنبيهات</span>
            {activeNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-status-overdue rounded-full border-2 border-brand-sidebar"></span>
            )}
          </button>
        </nav>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-8 border-t border-white/5 px-6 flex items-center justify-between text-[10px] text-text-muted bg-brand-header shrink-0">
        <div className="flex gap-4">
          <span>المستخدم: <span className="text-white font-medium">{user.displayName}</span></span>
          <span className="opacity-50">|</span>
          {isOffline ? (
            <span className="flex items-center gap-1.5 font-bold text-status-overdue">
              <span className="h-1.5 w-1.5 rounded-full bg-status-overdue animate-pulse"></span>
              وضع عدم الاتصال
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-status-excellent animate-pulse"></span>
              متصل - v2.4.0
            </span>
          )}
        </div>
        <div className="flex gap-4 font-bold tracking-tight">
          <span className="text-brand-orange italic">DriveCare - كل الحقوق محفوظة 2026</span>
        </div>
      </footer>

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner 
            onScan={handleQRScan} 
            onClose={() => setShowScanner(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddVehicle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-black/90 backdrop-blur-sm"
              onClick={() => setShowAddVehicle(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative bg-brand-card w-full max-w-2xl rounded-3xl border border-white/10 p-10 shadow-immersive"
            >
              <button 
                onClick={() => setShowAddVehicle(false)}
                className="absolute top-6 left-6 text-text-muted hover:text-white transition-all"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-bold mb-8 text-brand-orange">تسجيل مركبة جديدة</h2>
              <form className="space-y-6" onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const carFile = fd.get('carPhotoFile') as File;
                
                let carPhotoUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${fd.get('plate')}`;
                
                // We'll create the vehicle first to get an ID if we wanted to use it in path, 
                // but since we are doing it in one go, we can just use a random ID or timestamp for path
                // Actually, let's just upload it first.
                if (carFile && carFile.size > 0) {
                  try {
                    const tempId = Date.now().toString();
                    carPhotoUrl = await uploadVehicleImage(carFile, `new_${tempId}`);
                  } catch (error) {
                    console.error("Error uploading image:", error);
                  }
                }

                await addVehicle({
                  licensePlate: fd.get('plate') as string,
                  carType: fd.get('type') as string,
                  model: fd.get('model') as string || undefined,
                  year: fd.get('year') ? Number(fd.get('year')) : undefined,
                  driverName: fd.get('driver') as string,
                  driverPhone: fd.get('phone') as string,
                  oilType: fd.get('oil') as string,
                  lastOilChangeDate: fd.get('lastDate') as string || null,
                  currentMileage: Number(fd.get('current')),
                  nextServiceMileage: Number(fd.get('next')),
                  notes: fd.get('notes') as string,
                  carPhoto: carPhotoUrl,
                  driverPhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fd.get('driver')}`,
                });
                setShowAddVehicle(false);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">صورة المركبة</label>
                    <div className="relative group cursor-pointer">
                      <input 
                        type="file" 
                        name="carPhotoFile" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             const reader = new FileReader();
                             reader.onload = (event) => {
                               const img = document.getElementById('car-preview') as HTMLImageElement;
                               if (img) img.src = event.target?.result as string;
                             };
                             reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div className="w-full h-32 bg-brand-black/50 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 group-hover:border-brand-orange/50 transition-all overflow-hidden relative">
                         <img id="car-preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                         <Plus className="h-6 w-6 text-text-muted group-hover:text-brand-orange" />
                         <span className="text-[10px] font-bold text-text-muted uppercase">اضغط لإضافة صورة</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">رقم اللوحة</label>
                    <input name="plate" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none transition-all" placeholder="مثلاً: 12345 بغداد" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">نوع المركبة</label>
                    <input name="type" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none transition-all" placeholder="تويوتا هايلوكس" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">موديل المركبة</label>
                    <input name="model" className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none transition-all" placeholder="SR5" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">سنة الصنع</label>
                    <input name="year" type="number" className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none transition-all font-mono" placeholder="2023" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">اسم السائق</label>
                    <input name="driver" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none transition-all" placeholder="الاسم الرباعي" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">رقم الهاتف</label>
                    <input name="phone" className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange font-mono outline-none transition-all" placeholder="07XXXXXXXX" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">تاريخ آخر تبديل زيت</label>
                    <input name="lastDate" type="date" className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">نوع الزيت المفضل</label>
                    <input name="oil" className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none transition-all" placeholder="5W-30 Synthetic" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">العداد الحالي</label>
                    <input name="current" type="number" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none transition-all font-mono" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">موعد التبديل القادم</label>
                    <input name="next" type="number" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none transition-all font-mono" placeholder="5000" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">ملاحظات إضافية</label>
                    <textarea name="notes" className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none transition-all resize-none h-24" placeholder="أي ملاحظات حول حالة المحرك أو السائق..."></textarea>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-brand-orange text-black py-4 rounded-xl font-bold text-lg hover:bg-orange-400 transition-all shadow-xl shadow-brand-orange/20">حفظ وحماية</button>
                  <button type="button" onClick={() => setShowAddVehicle(false)} className="px-8 py-4 rounded-xl font-bold text-text-muted hover:bg-white/5 transition-all outline-none">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
