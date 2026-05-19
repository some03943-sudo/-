import React, { useState, useEffect, useRef } from 'react';
import { useOilOperations, useVehicles } from '../hooks/useFirebase';
import { OilOperation } from '../types';
import { Plus, Search, Filter, Printer, MoreVertical, Trash2, Edit2, Barcode, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OperationPrintable } from './OperationPrintable';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  value: string;
  className?: string;
}

function BarcodeDisplay({ value, className }: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        width: 1,
        height: 30,
        displayValue: false,
        background: "transparent",
        lineColor: "rgba(255, 255, 255, 0.5)",
      });
    }
  }, [value]);

  return <svg ref={svgRef} className={className} />;
}

interface OilOperationsProps {
  initialSearch?: string;
}

export function OilOperations({ initialSearch = '' }: OilOperationsProps) {
  const { operations, loading, addOperation, deleteOperation } = useOilOperations();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOp, setSelectedOp] = useState<OilOperation | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const filteredOps = operations.filter(op => 
    op.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.barcode.includes(searchQuery)
  );

  const generateBarcode = () => {
    return 'OP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const barcode = generateBarcode();
    const operationData: Omit<OilOperation, 'id' | 'ownerId' | 'createdAt'> = {
      barcode,
      driverName: fd.get('driverName') as string,
      vehicleType: fd.get('vehicleType') as string,
      plateNumber: fd.get('plateNumber') as string,
      oilType: fd.get('oilType') as string,
      oilQuantity: fd.get('oilQuantity') as string,
      oilChangeDate: fd.get('oilChangeDate') as string,
      nextOilChangeDate: fd.get('nextOilChangeDate') as string,
      currentMileage: Number(fd.get('currentMileage')),
      nextMileage: Number(fd.get('nextMileage')),
      notes: fd.get('notes') as string,
    };

    const id = await addOperation(operationData);
    if (id) {
      const newOp = { ...operationData, id, ownerId: '', createdAt: new Date().toISOString() } as OilOperation;
      setSelectedOp(newOp);
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex justify-between items-center bg-brand-card p-6 rounded-3xl border border-white/5 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">عمليات تبديل الزيت</h2>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest">إدارة وتوثيق عمليات الصيانة الدورية</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-brand-orange text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-400 transition-all shadow-lg shadow-brand-orange/20"
        >
          <Plus className="h-5 w-5" />
          عملية جديدة
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-96 bg-brand-card h-12 rounded-xl border border-white/5 flex items-center px-4 gap-3 focus-within:border-brand-orange/30 transition-all">
          <Search className="h-5 w-5 text-text-muted" />
          <input 
            type="text" 
            placeholder="بحث بالاسم، الرقم، أو الباركود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-sm w-full outline-none text-white placeholder:text-text-muted focus:ring-0"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-text-muted text-xs font-bold bg-brand-card px-4 py-2 rounded-lg border border-white/5">
            <Filter className="h-4 w-4" />
            تصفية المتقدمة
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-brand-orange border-t-transparent rounded-full"></div>
        </div>
      ) : filteredOps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-brand-card rounded-3xl border border-dashed border-white/5">
           <Barcode className="h-16 w-16 text-white/5 mb-4" />
           <p className="text-text-muted font-medium italic">لم يتم تسجيل أي عمليات حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOps.map((op) => (
            <motion.div 
              key={op.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                borderWidth: searchQuery === op.barcode ? 2 : 1,
                borderColor: searchQuery === op.barcode ? 'rgba(255, 107, 0, 0.5)' : 'rgba(255, 255, 255, 0.05)'
              }}
              className="bg-brand-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                  <Barcode className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white tracking-wide">{op.driverName}</span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-text-muted font-mono">{op.barcode}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-muted font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(op.oilChangeDate).toLocaleDateString('ar-IQ')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 rotate-180" />
                      {op.plateNumber}
                    </span>
                  </div>
                  <div className="mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    <BarcodeDisplay value={op.barcode} className="h-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 px-6 border-r border-white/5">
                <div className="text-center md:text-right">
                  <p className="text-[10px] uppercase font-bold text-text-muted mb-1">نوع الزيت</p>
                  <p className="text-sm font-bold text-white">{op.oilType}</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-[10px] uppercase font-bold text-text-muted mb-1">العداد الحالي</p>
                  <p className="text-sm font-mono font-bold text-white">{op.currentMileage.toLocaleString()}</p>
                </div>
                <div className="text-center md:text-right hidden md:block">
                  <p className="text-[10px] uppercase font-bold text-text-muted mb-1">العداد القادم</p>
                  <p className="text-sm font-mono font-bold text-brand-orange">{op.nextMileage.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedOp(op)}
                  className="p-3 bg-white/5 text-text-muted rounded-xl hover:text-brand-orange hover:bg-brand-orange/10 transition-all shadow-sm"
                  title="طباعة"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <div className="h-8 w-px bg-white/5 mx-2 hidden md:block"></div>
                <button 
                  onClick={() => deleteOperation(op.id)}
                  className="p-3 text-status-overdue/50 hover:text-status-overdue hover:bg-status-overdue/10 rounded-xl transition-all"
                  title="حذف"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setShowAddForm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-brand-card w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl p-10 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold mb-2 text-brand-orange">تسجيل عملية تبديل زيت</h2>
              <p className="text-text-muted text-sm mb-8 italic">يرجى ملء كافة الحقول لضمان دقة التوثيق والباركود.</p>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">اسم السائق</label>
                  <input name="driverName" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none text-right" placeholder="أدخل اسم السائق" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">رقم اللوحة</label>
                  <input name="plateNumber" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white font-mono focus:ring-1 focus:ring-brand-orange outline-none text-right" placeholder="123456 بغداد" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">نوع المركبة</label>
                  <input name="vehicleType" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none text-right" placeholder="اسم المركبة والموديل" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">نوع الزيت</label>
                  <input name="oilType" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none text-right" placeholder="اسم الزيت المستخدم" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">كمية الزيت</label>
                  <input name="oilQuantity" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none text-right" placeholder="مثلاً: 4 لتر" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">تاريخ التبديل</label>
                  <input name="oilChangeDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none text-right" />
                </div>
                 <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">التاريخ القادم</label>
                  <input name="nextOilChangeDate" type="date" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none text-right" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">العداد الحالي (كم)</label>
                  <input name="currentMileage" type="number" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white font-mono focus:ring-1 focus:ring-brand-orange outline-none text-right" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">العداد القادم (كم)</label>
                  <input name="nextMileage" type="number" required className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white font-mono focus:ring-1 focus:ring-brand-orange outline-none text-right" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest text-right">ملاحظات العملية</label>
                  <textarea name="notes" rows={3} className="w-full bg-brand-black/50 rounded-xl border border-white/5 p-4 text-white focus:ring-1 focus:ring-brand-orange outline-none text-right resize-none" />
                </div>

                <div className="md:col-span-2 flex gap-4 pt-6">
                  <button type="submit" className="flex-1 bg-brand-orange text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-400 transition-all shadow-xl shadow-brand-orange/20">
                    <CheckCircle2 className="h-5 w-5" />
                    حفظ العملية وتوليد الباركود
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-10 py-4 text-text-muted font-bold hover:text-white transition-all">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print View Modal */}
      <AnimatePresence>
        {selectedOp && (
          <OperationPrintable 
            operation={selectedOp} 
            onClose={() => setSelectedOp(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
