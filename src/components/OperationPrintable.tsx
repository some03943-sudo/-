import React, { useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { OilOperation } from '../types';
import { Printer, FileText, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';

interface OperationPrintableProps {
  operation: OilOperation;
  onClose: () => void;
}

export function OperationPrintable({ operation, onClose }: OperationPrintableProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, operation.barcode, {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: true,
        fontSize: 10,
        background: "#ffffff"
      });
    }
  }, [operation.barcode]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [80, 200] // Typical thermal printer width is 80mm
    });

    // Simple text-based PDF as Arabic fonts need complex setup in jsPDF
    doc.setFont("helvetica", "bold");
    doc.text("DriveCare - Oil Change", 40, 10, { align: 'center' });
    doc.line(5, 15, 75, 15);
    
    doc.setFontSize(10);
    doc.text(`Driver: ${operation.driverName}`, 5, 25);
    doc.text(`Plate: ${operation.plateNumber}`, 5, 32);
    doc.text(`Mileage: ${operation.currentMileage}`, 5, 39);
    doc.text(`Next: ${operation.nextMileage}`, 5, 46);
    doc.text(`Date: ${new Date(operation.oilChangeDate).toLocaleDateString()}`, 5, 53);
    
    doc.save(`Receipt_${operation.barcode}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-brand-card w-full max-w-2xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[90vh]">
        <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-brand-sidebar">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-brand-orange" />
            <span className="font-bold text-white text-sm md:text-base">نموذج عملية تبديل الزيت</span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white p-2">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white" dir="rtl">
          <div ref={componentRef} className="print-content p-4 md:p-8 text-black bg-white rounded-lg border border-gray-200 mx-auto max-w-[80mm]">
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-6 border-b-2 border-brand-orange pb-4 text-center">
              <h1 className="text-2xl font-extrabold text-brand-orange mb-1">DriveCare</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">مركز صيانة المركبات الاحترافي</p>
              <div className="mt-4 w-full">
                <p className="text-sm font-bold">رقم العملية: <span className="font-mono text-base">{operation.id.slice(0, 8).toUpperCase()}</span></p>
                <p className="text-[10px] text-gray-400">{new Date(operation.createdAt).toLocaleString('ar-IQ')}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-gray-400">اسم السائق</span>
                <span className="text-sm font-bold">{operation.driverName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-gray-400">رقم اللوحة</span>
                <span className="text-sm font-bold font-mono">{operation.plateNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-gray-400">نوع المركبة</span>
                <span className="text-sm font-bold">{operation.vehicleType}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-gray-400">نوع الزيت</span>
                <span className="text-sm font-bold">{operation.oilType}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 bg-gray-50 px-2 py-1 rounded">
                <span className="text-[10px] font-bold text-gray-400">العداد الحالي</span>
                <span className="text-sm font-bold font-mono">{operation.currentMileage.toLocaleString()} كم</span>
              </div>
              <div className="flex justify-between border-b border-brand-orange/20 pb-2 bg-brand-orange/5 px-2 py-1 rounded">
                <span className="text-[10px] font-bold text-brand-orange">العداد القادم</span>
                <span className="text-sm font-bold font-mono text-brand-orange">{operation.nextMileage.toLocaleString()} كم</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-gray-400">تاريخ التبديل</span>
                <span className="text-sm font-bold">{new Date(operation.oilChangeDate).toLocaleDateString('ar-IQ')}</span>
              </div>
               <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-gray-400">التاريخ القادم</span>
                <span className="text-sm font-bold">{new Date(operation.nextOilChangeDate).toLocaleDateString('ar-IQ')}</span>
              </div>
            </div>

            {operation.notes && (
              <div className="mb-8 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[9px] font-bold text-gray-400 mb-1">ملاحظات</p>
                <p className="text-xs leading-relaxed">{operation.notes}</p>
              </div>
            )}

            <div className="flex flex-col items-center justify-center pt-6 border-t border-dashed border-gray-200">
              <svg ref={barcodeRef} className="max-w-full h-auto"></svg>
              <p className="text-[8px] text-gray-400 font-bold mt-2">نظام أويل تراك - إدارة صيانة الأساطيل</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-white/5 bg-brand-sidebar flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => handlePrint()}
            className="flex-1 bg-brand-orange text-black h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-400 transition-all"
          >
            <Printer className="h-5 w-5" />
            طباعة
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex-1 h-12 bg-white/5 text-white rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <FileText className="h-5 w-5" />
            حفظ PDF
          </button>
        </div>
      </div>
    </div>
  );
}
