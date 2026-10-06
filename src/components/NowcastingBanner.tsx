import React, { useState } from "react";
import { NowcastingAlert } from "../types/bmkg";
import {
  AlertCircle,
  Wind,
  Waves,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Clock,
} from "lucide-react";

interface NowcastingBannerProps {
  alert: NowcastingAlert | null;
  marineAlert?: any;
}

export const NowcastingBanner: React.FC<NowcastingBannerProps> = ({
  alert,
  marineAlert,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMarineExpanded, setIsMarineExpanded] = useState(false);

  const hasNowcast = alert && alert.hasWarning;

  const hasMarine =
    !!marineAlert &&
    marineAlert.warning &&
    ((marineAlert.warning.sedang && marineAlert.warning.sedang.length > 0) ||
      (marineAlert.warning.tinggi && marineAlert.warning.tinggi.length > 0) ||
      (marineAlert.warning.sangat_tinggi &&
        marineAlert.warning.sangat_tinggi.length > 0) ||
      (marineAlert.warning.ekstrem && marineAlert.warning.ekstrem.length > 0));

  if (!hasNowcast && !hasMarine) {
    return null;
  }

  const isSiaga =
    alert?.severity?.toLowerCase().includes("siaga") ||
    alert?.severity?.toLowerCase().includes("orange");

  return (
    <div className="flex flex-col gap-3">
      {hasMarine && (
        <div className="rounded-xl border bg-blue-950/40 border-blue-500/50 text-blue-200 shadow-lg overflow-hidden">
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                <Waves className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-500/50">
                    PERINGATAN DINI GELOMBANG
                  </span>
                  <h3 className="font-bold text-sm text-white">
                    Perairan Nusa Tenggara Barat
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                  {marineAlert.synoptic}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">
                  Valid s/d:{" "}
                  {new Date(marineAlert.valid_until).toLocaleString("id-ID", {
                    timeZone: "Asia/Makassar",
                  })}
                </span>
              </div>
              <button
                onClick={() => setIsMarineExpanded(!isMarineExpanded)}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-slate-900/80 hover:bg-slate-850 text-white border border-slate-700 transition-colors"
              >
                <span>
                  {isMarineExpanded ? "Tutup Detail" : "Wilayah Terdampak"}
                </span>
                {isMarineExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {isMarineExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/70 text-xs space-y-3">
              <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
                <strong>Kondisi Sinoptik:</strong> {marineAlert.synoptic}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {marineAlert.warning.sedang &&
                  marineAlert.warning.sedang.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-yellow-400 mb-1 block">
                        Gelombang Sedang (1.25 - 2.5 m):
                      </span>
                      <ul className="list-disc pl-4 text-slate-300 text-[11px] space-y-0.5">
                        {marineAlert.warning.sedang.map(
                          (w: string, i: number) => (
                            <li key={i}>{w}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                {marineAlert.warning.tinggi &&
                  marineAlert.warning.tinggi.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-orange-400 mb-1 block">
                        Gelombang Tinggi (2.5 - 4.0 m):
                      </span>
                      <ul className="list-disc pl-4 text-slate-300 text-[11px] space-y-0.5">
                        {marineAlert.warning.tinggi.map(
                          (w: string, i: number) => (
                            <li key={i}>{w}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                {marineAlert.warning.sangat_tinggi &&
                  marineAlert.warning.sangat_tinggi.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-red-400 mb-1 block">
                        Gelombang Sangat Tinggi (4.0 - 6.0 m):
                      </span>
                      <ul className="list-disc pl-4 text-slate-300 text-[11px] space-y-0.5">
                        {marineAlert.warning.sangat_tinggi.map(
                          (w: string, i: number) => (
                            <li key={i}>{w}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {hasNowcast && (
        <div
          className={`rounded-xl border transition-all ${
            isSiaga
              ? "bg-amber-950/40 border-amber-500/50 text-amber-200"
              : "bg-yellow-950/30 border-yellow-600/40 text-yellow-200"
          } shadow-lg overflow-hidden`}
        >
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50">
                    {alert.severity || "Peringatan Dini"}
                  </span>
                  <h3 className="font-bold text-sm text-white">
                    {alert.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                  {alert.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">
                  {alert.issueTime || "Real-time"}
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-slate-900/80 hover:bg-slate-850 text-white border border-slate-700 transition-colors"
              >
                <span>{isExpanded ? "Tutup Detail" : "Wilayah Terdampak"}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/70 text-xs space-y-3">
              {/* Affected Districts */}
              {alert.affectedDistricts &&
                alert.affectedDistricts.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Kecamatan & Wilayah NTB Berpotensi Terdampak:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {alert.affectedDistricts.map((dist, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800"
                        >
                          <div className="font-bold text-slate-200 mb-0.5 flex items-center justify-between">
                            <span>{dist.name}</span>
                            <span className="text-[10px] text-amber-400 font-medium">
                              {dist.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            {dist.locations}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Wind & Ocean Wave Estimates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                  <Wind className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Estimasi Kecepatan Angin:
                    </span>
                    <span className="font-mono text-slate-200 font-medium">
                      {alert.windSpeedEstimate || "15 - 40 km/jam"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                  <Waves className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Kondisi Gelombang Laut NTB:
                    </span>
                    <span className="font-medium text-slate-200 text-[11px]">
                      {alert.waveHeightEstimate ||
                        "Selat Lombok 1.5 - 2.5 m (Sedang)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                <span>
                  Sumber: Stasiun Meteorologi ZAM / BMKG Nusa Tenggara Barat
                </span>
                <span>
                  Masa Berlaku:{" "}
                  {alert.validUntil || "Hingga pemutakhiran berikutnya"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
