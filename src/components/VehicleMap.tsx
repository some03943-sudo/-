import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Info, Settings, Map as MapIcon } from 'lucide-react';
import { cn } from '../lib/utils';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface VehicleMapProps {
  location?: { lat: number; lng: number };
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  isEditable?: boolean;
  className?: string;
}

export function VehicleMap({ location, onLocationSelect, isEditable, className }: VehicleMapProps) {
  const [center, setCenter] = useState(location || { lat: 33.3152, lng: 44.3661 }); // Default to Baghdad
  const [markerPos, setMarkerPos] = useState(location);

  useEffect(() => {
    if (location) {
      setCenter(location);
      setMarkerPos(location);
    }
  }, [location]);

  if (!hasValidKey) {
    return (
      <div className={cn("bg-brand-card rounded-3xl border border-white/5 flex flex-col items-center justify-center p-8 text-center min-h-[300px]", className)}>
        <div className="h-16 w-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange mb-4">
          <MapIcon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">مفتاح الخريطة مطلوب</h3>
        <p className="text-text-muted text-sm max-w-xs mb-6">
          لتفعيل ميزة تتبع المركبات، يرجى إضافة مفتاح Google Maps في الإعدادات.
        </p>
        <div className="text-right text-xs bg-brand-black/40 p-4 rounded-xl space-y-2 border border-white/5" dir="rtl">
          <p className="text-white font-bold mb-1">طريقة الإضافة:</p>
          <ol className="list-decimal list-inside space-y-1 text-text-muted">
            <li>اذهب إلى إعدادات المشروع (أيقونة الترس)</li>
            <li>اختر Secrets</li>
            <li>أضف <code className="text-brand-orange">GOOGLE_MAPS_PLATFORM_KEY</code></li>
            <li>الصق المفتاح الخاص بك</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-brand-card rounded-3xl border border-white/5 overflow-hidden relative shadow-2xl", className)}>
      <div className="h-[400px] w-full">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={center}
            defaultZoom={13}
            mapId="VEHICLE_TRACKING_MAP"
            onClick={(e) => {
              if (isEditable && e.detail.latLng && onLocationSelect) {
                const newPos = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
                setMarkerPos(newPos);
                onLocationSelect(newPos);
              }
            }}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
          >
            {markerPos && (
              <AdvancedMarker position={markerPos}>
                <Pin background="#f97316" glyphColor="#000" borderColor="#000" />
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>
      </div>
      
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
         <div className="bg-brand-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
            <span className="text-[10px] font-black uppercase text-white tracking-widest">مباشر</span>
         </div>
      </div>

      {isEditable && (
        <div className="absolute bottom-4 left-4 right-4 bg-brand-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <Info className="h-5 w-5 text-brand-orange shrink-0" />
          <p className="text-[11px] text-white font-medium leading-tight">
            {markerPos ? 'انقر على أي نقطة في الخريطة لتحديث موقع المركبة الحالي' : 'يرجى النقر على الخريطة لتحديد موقع المركبة الأولي'}
          </p>
        </div>
      )}
    </div>
  );
}
