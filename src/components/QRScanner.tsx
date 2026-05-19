import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (error) => {
        // Silently handle scan errors
      }
    );

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner", error);
      });
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-brand-black/95 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-brand-card w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-immersive overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white transition-all z-10"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2">ماسح رموز QR</h2>
          <p className="text-sm text-text-muted">وجه الكاميرا نحو رمز QR الخاص بالمركبة</p>
        </div>

        <div id="reader" className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden"></div>
        
        <div className="mt-6 text-center">
           <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">بواسطة OilTrack QR Engine</p>
        </div>
      </motion.div>
    </div>
  );
}
