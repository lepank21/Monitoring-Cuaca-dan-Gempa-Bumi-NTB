import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Clock } from "lucide-react";

const KODE_WILAYAH: Record<string, string> = {
  "5201": "Kab. Lombok Barat",
  "5202": "Kab. Lombok Tengah",
  "5203": "Kab. Lombok Timur",
  "5204": "Kab. Sumbawa",
  "5205": "Kab. Dompu",
  "5206": "Kab. Bima",
  "5207": "Kab. Sumbawa Barat",
  "5208": "Kab. Lombok Utara",
  "5271": "Kota Mataram",
  "5272": "Kota Bima"
};

const getWilayah = (kode_referensi?: string) => {
  if (!kode_referensi) return "";
  const kode = kode_referensi.substring(0, 4);
  return KODE_WILAYAH[kode] ? `${KODE_WILAYAH[kode]} - ` : "";
};

export const MarqueeTicker: React.FC = () => {
  const [bencana, setBencana] = useState<any[]>([]);

  const fetchKejadian = useCallback(() => {
    fetch(`/api/siaga/kejadian-bencana?_t=${Date.now()}`, {
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.data && Array.isArray(data.data)) {
          // Sort descending by ID so the latest disaster is guaranteed first
          const sorted = [...data.data].sort(
            (a: any, b: any) => Number(b.id || 0) - Number(a.id || 0)
          );
          setBencana(sorted);
        }
      })
      .catch((err) => console.warn("Failed fetching kejadian bencana:", err));
  }, []);

  useEffect(() => {
    fetchKejadian();
    // Poll every 45 seconds for real-time disaster updates
    const interval = setInterval(fetchKejadian, 45000);
    return () => clearInterval(interval);
  }, [fetchKejadian]);

  if (bencana.length === 0) return null;

  return (
    <div className="marquee-container bg-red-950/80 border-t border-red-500/50 text-red-100 overflow-hidden py-1.5 flex items-center relative z-50 shadow-[0_-5px_15px_-5px_rgba(239,68,68,0.3)] select-none">
      <div className="absolute left-0 z-10 bg-gradient-to-r from-red-950 via-red-950/95 to-transparent pr-4 pl-3 py-1 font-bold text-xs flex items-center gap-2 uppercase tracking-wider min-w-max border-r border-red-500/30">
        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
        <span className="hidden sm:inline">Info Kejadian Bencana NTB</span>
        <span className="sm:hidden">Info Bencana</span>
      </div>
      
      {/* Ticker animation container with pause on hover */}
      <div className="flex-1 overflow-hidden ml-[180px] sm:ml-[250px] relative h-5">
        <div className="marquee-track absolute whitespace-nowrap animate-[marquee_120s_linear_infinite] flex items-center h-full">
          {bencana.map((item, i) => (
            <React.Fragment key={`orig-${item.id || i}`}>
              {i === 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded mr-1.5 tracking-wider uppercase inline-flex items-center gap-1 shadow-sm animate-pulse">
                  <Clock className="w-2.5 h-2.5" /> Terkini
                </span>
              )}
              <span className="text-xs font-bold text-red-400 mr-1">{getWilayah(item.kode_referensi)}</span>
              <span className="text-xs font-semibold mr-2">{item.nama}</span>
              <span className="text-xs text-red-200 mr-2">
                ({item.tanggal} - Terdampak: {item.desa_terdampak}, {item.penduduk_terdampak})
              </span>
              <span className="mx-4 text-red-500/50">✦</span>
            </React.Fragment>
          ))}
          {/* Duplicate for seamless continuous looping */}
          {bencana.map((item, i) => (
            <React.Fragment key={`dup-${item.id || i}`}>
              {i === 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded mr-1.5 tracking-wider uppercase inline-flex items-center gap-1 shadow-sm animate-pulse">
                  <Clock className="w-2.5 h-2.5" /> Terkini
                </span>
              )}
              <span className="text-xs font-bold text-red-400 mr-1">{getWilayah(item.kode_referensi)}</span>
              <span className="text-xs font-semibold mr-2">{item.nama}</span>
              <span className="text-xs text-red-200 mr-2">
                ({item.tanggal} - Terdampak: {item.desa_terdampak}, {item.penduduk_terdampak})
              </span>
              <span className="mx-4 text-red-500/50">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
