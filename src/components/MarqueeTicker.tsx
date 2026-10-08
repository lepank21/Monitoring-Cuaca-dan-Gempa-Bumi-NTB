import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export const MarqueeTicker: React.FC = () => {
  const [bencana, setBencana] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/siaga/kejadian-bencana")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data && Array.isArray(data.data)) {
          setBencana(data.data);
        }
      })
      .catch((err) => console.warn("Failed fetching kejadian bencana", err));
  }, []);

  if (bencana.length === 0) return null;

  return (
    <div className="bg-red-950/80 border-t border-red-500/50 text-red-100 overflow-hidden py-1.5 flex items-center relative z-50 shadow-[0_-5px_15px_-5px_rgba(239,68,68,0.3)]">
      <div className="absolute left-0 z-10 bg-gradient-to-r from-red-950/90 to-transparent px-3 py-1 font-bold text-xs flex items-center gap-2 uppercase tracking-wider min-w-max border-r border-red-500/30">
        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
        <span className="hidden sm:inline">Info Kejadian Bencana NTB</span>
        <span className="sm:hidden">Info</span>
      </div>
      
      {/* Ticker animation container */}
      <div className="flex-1 overflow-hidden ml-[180px] sm:ml-[250px] relative h-5">
        <div className="absolute whitespace-nowrap animate-[marquee_40s_linear_infinite] flex items-center h-full">
          {bencana.map((item, i) => (
            <React.Fragment key={item.id || i}>
              <span className="text-xs font-semibold mr-2">{item.nama}</span>
              <span className="text-xs text-red-300 mr-2">
                ({item.tanggal} - Terdampak: {item.desa_terdampak}, {item.penduduk_terdampak})
              </span>
              {i !== bencana.length - 1 && (
                <span className="mx-4 text-red-500/50">✦</span>
              )}
            </React.Fragment>
          ))}
          {/* Duplicate for seamless looping if we wanted, but standard CSS animation is sufficient for now */}
          <span className="mx-4 text-red-500/50">✦</span>
          {bencana.map((item, i) => (
            <React.Fragment key={`dup-${item.id || i}`}>
              <span className="text-xs font-semibold mr-2">{item.nama}</span>
              <span className="text-xs text-red-300 mr-2">
                ({item.tanggal} - Terdampak: {item.desa_terdampak}, {item.penduduk_terdampak})
              </span>
              {i !== bencana.length - 1 && (
                <span className="mx-4 text-red-500/50">✦</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
