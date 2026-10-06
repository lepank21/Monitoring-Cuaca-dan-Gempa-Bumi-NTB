import React, { useState } from "react";
import { EarthquakeItem } from "../types/bmkg";
import {
  Activity,
  ShieldAlert,
  MapPin,
  Radio,
  Compass,
  ExternalLink,
  Image as ImageIcon,
  Search,
} from "lucide-react";

interface EarthquakePanelProps {
  autoGempa: EarthquakeItem | null;
  recentQuakes: EarthquakeItem[];
  feltQuakes: EarthquakeItem[];
  selectedQuake: EarthquakeItem | null;
  onSelectQuake: (quake: EarthquakeItem) => void;
}

export const EarthquakePanel: React.FC<EarthquakePanelProps> = ({
  autoGempa,
  recentQuakes,
  feltQuakes,
  selectedQuake,
  onSelectQuake,
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "ntb" | "felt">("ntb");
  const [searchQuery, setSearchQuery] = useState("");
  const [showShakemapModal, setShowShakemapModal] = useState(false);

  // Filtered List
  const currentList = filterMode === "felt" ? feltQuakes : recentQuakes;
  const filteredQuakes = currentList.filter((q) => {
    if (
      filterMode === "ntb" &&
      !q.isNtbArea &&
      (q.distanceToNTBKm ?? 999) > 350
    ) {
      return false;
    }
    if (searchQuery) {
      const qText = `${q.Wilayah} ${q.Magnitude} ${q.Kedalaman}`.toLowerCase();
      return qText.includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Monitoring Gempa Bumi BMKG
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            Sensor TEWS
          </span>
        </div>

        {/* Auto Gempa / Terkini Highlight Card */}
        {autoGempa && (
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-red-900/60 rounded-xl p-3.5 shadow-md relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-lg bg-red-600/20 border border-red-500/50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] uppercase font-bold text-red-300">
                    Magnitudo
                  </span>
                  <span className="text-lg font-mono font-bold text-white leading-none">
                    {autoGempa.Magnitude}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block">
                    Gempa Bumi Terkini (Auto BMKG)
                  </span>
                  <h3 className="font-bold text-sm text-slate-100 line-clamp-1">
                    {autoGempa.Wilayah}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span>{autoGempa.Tanggal}</span>
                    <span>·</span>
                    <span>{autoGempa.Jam}</span>
                  </div>
                </div>
              </div>

              {autoGempa.isNtbArea && (
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/60 animate-pulse">
                  Wilayah NTB
                </span>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2 rounded-lg text-xs border border-slate-800/80 mb-2.5">
              <div>
                <span className="text-slate-500 block text-[10px]">
                  Kedalaman
                </span>
                <span className="font-mono text-slate-200 font-semibold">
                  {autoGempa.Kedalaman}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">
                  Jarak ke NTB
                </span>
                <span className="font-mono text-amber-300 font-semibold">
                  {autoGempa.distanceToNTBKm ?? "-"} km
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">
                  Potensi Tsunami
                </span>
                <span className="text-emerald-400 font-semibold text-[11px] truncate block">
                  {autoGempa.Potensi}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => onSelectQuake(autoGempa)}
                className="flex-1 py-1.5 px-3 bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Fokuskan di Peta</span>
              </button>

              {autoGempa.shakemapUrl && (
                <button
                  onClick={() => setShowShakemapModal(true)}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Shakemap</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40 shrink-0 space-y-2">
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setFilterMode("ntb")}
            className={`flex-1 py-1.5 rounded-md transition-colors ${
              filterMode === "ntb"
                ? "bg-sky-600 text-white font-semibold shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Wilayah NTB (
            {
              recentQuakes.filter(
                (q) => q.isNtbArea || (q.distanceToNTBKm ?? 999) <= 350,
              ).length
            }
            )
          </button>
          <button
            onClick={() => setFilterMode("all")}
            className={`flex-1 py-1.5 rounded-md transition-colors ${
              filterMode === "all"
                ? "bg-sky-600 text-white font-semibold shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            15 Gempa M 5.0+
          </button>
          <button
            onClick={() => setFilterMode("felt")}
            className={`flex-1 py-1.5 rounded-md transition-colors ${
              filterMode === "felt"
                ? "bg-sky-600 text-white font-semibold shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Gempa Dirasakan
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari wilayah (contoh: Lombok, Sumbawa, Bima)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Earthquakes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredQuakes.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Tidak ada gempa bumi yang cocok dengan filter saat ini.
          </div>
        ) : (
          filteredQuakes.map((quake, idx) => {
            const mag = parseFloat(quake.Magnitude) || 4.0;
            const isSelected =
              selectedQuake && selectedQuake.Coordinates === quake.Coordinates;

            return (
              <div
                key={idx}
                onClick={() => onSelectQuake(quake)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-sky-950/40 border-sky-500 ring-1 ring-sky-500"
                    : quake.isNtbArea
                      ? "bg-slate-950/80 border-red-900/60 hover:border-red-600"
                      : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        mag >= 6.0
                          ? "bg-red-600 text-white"
                          : mag >= 5.0
                            ? "bg-amber-600 text-white"
                            : "bg-yellow-500 text-slate-950"
                      }`}
                    >
                      M {quake.Magnitude}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {quake.Tanggal} {quake.Jam}
                    </span>
                  </div>

                  {quake.isNtbArea && (
                    <span className="text-[10px] font-semibold text-red-400 bg-red-950/80 border border-red-800 px-1.5 py-0.5 rounded">
                      NTB
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 font-medium line-clamp-2 mb-2">
                  {quake.Wilayah}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/80">
                  <span>Kedalaman: {quake.Kedalaman}</span>
                  <span>Jarak NTB: {quake.distanceToNTBKm ?? "-"} km</span>
                </div>

                {quake.Dirasakan && (
                  <div className="mt-1.5 text-[11px] bg-slate-900/80 p-1.5 rounded text-yellow-300 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">
                      Dirasakan:
                    </span>
                    <span>{quake.Dirasakan}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Shakemap Modal */}
      {showShakemapModal && autoGempa?.shakemapUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-4 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white">
                Peta Tingkat Guncangan (Shakemap BMKG)
              </h3>
              <button
                onClick={() => setShowShakemapModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Tutup
              </button>
            </div>
            <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center mb-3">
              <img
                src={autoGempa.shakemapUrl}
                alt="BMKG Shakemap"
                referrerPolicy="no-referrer"
                className="max-h-[60vh] object-contain"
              />
            </div>
            <div className="text-xs text-slate-400 flex justify-between items-center">
              <span>{autoGempa.Wilayah}</span>
              <a
                href={autoGempa.shakemapUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>Buka Gambar Asli</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
