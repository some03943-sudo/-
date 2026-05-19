import React from 'react';
import { MaintenanceLog } from '../types';
import { formatDate, formatNumber, cn } from '../lib/utils';
import { CheckCircle2, AlertCircle, Wrench, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface MaintenanceTimelineProps {
  logs: MaintenanceLog[];
}

export function MaintenanceTimeline({ logs }: MaintenanceTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="py-20 text-center text-text-muted border border-dashed border-white/5 rounded-3xl h-full flex items-center justify-center italic text-sm">
        بدء تسجيل سجلات الصيانة لهذه المركبة.
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Timeline spine */}
      <div className="absolute top-0 right-3.5 h-full w-px bg-gradient-to-b from-brand-orange/50 via-brand-orange/20 to-transparent"></div>

      {logs.map((log, index) => (
        <motion.div 
          key={log.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative pr-10"
        >
          {/* Node point */}
          <div className={cn(
            "absolute right-0 top-1.5 h-7 w-7 rounded-full bg-brand-card border-2 flex items-center justify-center z-10",
            log.type === 'issue' ? "border-status-overdue text-status-overdue shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "border-brand-orange/40 text-brand-orange"
          )}>
            {index === 0 ? (
               log.type === 'issue' ? <AlertCircle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />
            ) : (
               log.type === 'issue' ? <AlertCircle className="h-3 w-3 opacity-70" /> : <Wrench className="h-3 w-3 opacity-70" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-start">
               <div>
                  <h4 className={cn(
                    "text-sm font-bold transition-colors",
                    log.type === 'issue' ? "text-status-overdue" : "text-white group-hover:text-brand-orange"
                  )}>
                    {log.type === 'issue' ? 'تقرير عطل/خلل' : 'تبديل دوري'}
                  </h4>
                  <p className="text-[10px] text-text-muted font-bold tracking-widest">{formatDate(log.date)}</p>
               </div>
               {log.type === 'maintenance' && (
                 <div className="text-right">
                    <p className="text-xs font-mono font-bold text-brand-orange">{formatNumber(log.cost)} د.ع</p>
                 </div>
               )}
               {log.type === 'issue' && log.severity && (
                 <div className="text-right">
                    <span className={cn(
                      "text-[8px] px-2 py-0.5 rounded-full font-bold uppercase",
                      log.severity === 'high' ? "bg-status-overdue text-white" : 
                      log.severity === 'medium' ? "bg-status-near text-black" : 
                      "bg-white/10 text-white"
                    )}>
                      {log.severity === 'high' ? 'خطير' : log.severity === 'medium' ? 'متوسط' : 'بسيط'}
                    </span>
                 </div>
               )}
            </div>

            <div className={cn(
               "bg-brand-black/40 border p-4 rounded-2xl group transition-all",
               log.type === 'issue' ? "border-status-overdue/20" : "border-white/5 hover:border-brand-orange/20"
            )}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[8px] text-text-muted uppercase font-bold tracking-tighter leading-none mb-1">العداد</p>
                  <p className="font-mono text-xs font-bold">{formatNumber(log.mileage)} كم</p>
                </div>
                {log.type === 'maintenance' ? (
                  <div>
                    <p className="text-[8px] text-text-muted uppercase font-bold tracking-tighter leading-none mb-1">الفني</p>
                    <p className="text-xs font-bold truncate">{log.mechanicName || 'مركزي'}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[8px] text-text-muted uppercase font-bold tracking-tighter leading-none mb-1">الحالة</p>
                    <p className="text-xs font-bold text-status-overdue">نشط</p>
                  </div>
                )}
              </div>
              
              {(log.type === 'maintenance' && log.filterType) && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-status-excellent"></div>
                   <p className="text-[10px] font-bold text-text-muted">تم استخدام فلتر: <span className="text-white">{log.filterType}</span></p>
                </div>
              )}

              {log.notes && (
                <div className={cn(
                  "mt-3 pt-3 border-t border-white/5",
                  log.type === 'issue' ? "border-status-overdue/10" : ""
                )}>
                   <p className="text-[10px] font-medium text-text-muted italic">{log.notes}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

