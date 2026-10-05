import React, { useEffect } from 'react';
import { AlertTriangle, X, MapPin } from 'lucide-react';

export interface AlertToastData {
  id: string;
  type: 'earthquake' | 'weather';
  title: string;
  message: string;
  magnitude?: string;
  severity: string;
  time: string;
  coords?: [number, number];
}

interface NotificationToastProps {
  toast: AlertToastData | null;
  onClose: () => void;
  onFocusMap?: (lat: number, lng: number) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toast,
  onClose,
  onFocusMap,
}) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 12000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isQuake = toast.type === 'earthquake';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`p-4 rounded-xl border shadow-2xl backdrop-blur-xl ${
          isQuake
            ? 'bg-slate-900/95 border-red-500 text-white'
            : 'bg-slate-900/95 border-amber-500 text-white'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                isQuake ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isQuake ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                {toast.severity}
              </span>
              <h4 className="font-bold text-sm text-white leading-tight">{toast.title}</h4>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-3">{toast.message}</p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="font-mono text-[11px] text-slate-400">{toast.time}</span>

          {toast.coords && onFocusMap && (
            <button
              onClick={() => {
                if (toast.coords) {
                  onFocusMap(toast.coords[0], toast.coords[1]);
                  onClose();
                }
              }}
              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <MapPin className="w-3 h-3" />
              <span>Lihat di Peta</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
