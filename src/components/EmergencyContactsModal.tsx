import React from 'react';
import { PhoneCall, ShieldAlert, LifeBuoy, Radio, Siren, ExternalLink } from 'lucide-react';
import { DistrictInfo } from '../types/bmkg';

interface EmergencyContactsProps {
  districts: DistrictInfo[];
}

export const EmergencyContactsModal: React.FC<EmergencyContactsProps> = ({ districts }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-xl">
      <div className="mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <PhoneCall className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Direktori Kontak Tanggap Darurat Bencana Provinsi NTB
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Nomor darurat, Pusdalops PB BPBD, Kantor SAR BASARNAS Mataram, dan Stasiun BMKG NTB yang dapat dihubungi 24 Jam.
        </p>
      </div>

      {/* Emergency Call Numbers 24/7 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-600 text-white shrink-0">
            <Siren className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] text-red-300 font-bold uppercase block">Panggilan Darurat Terpadu</span>
            <span className="text-2xl font-bold font-mono text-white">112</span>
            <span className="text-[11px] text-slate-300 block">Bebas Pulsa 24 Jam</span>
          </div>
        </div>

        <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-600 text-white shrink-0">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-amber-300 font-bold uppercase block">BASARNAS / SAR Mataram</span>
            <span className="text-2xl font-bold font-mono text-white">115</span>
            <span className="text-[11px] text-slate-300 block">(0370) 633211</span>
          </div>
        </div>

        <div className="bg-sky-950/40 border border-sky-500/50 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-600 text-white shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-sky-300 font-bold uppercase block">PUSDALOPS BPBD NTB</span>
            <span className="text-base font-bold font-mono text-white">(0370) 634565</span>
            <span className="text-[11px] text-slate-300 block">WhatsApp: 0811-390-117</span>
          </div>
        </div>

        <div className="bg-blue-950/40 border border-blue-500/50 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600 text-white shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-blue-300 font-bold uppercase block">BMKG Geofisika Mataram</span>
            <span className="text-base font-bold font-mono text-white">(0370) 642137</span>
            <span className="text-[11px] text-slate-300 block">Monitoring Gempa & Tsunami</span>
          </div>
        </div>
      </div>

      {/* 10 Regencies BPBD & PMI Directory */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span>Kontak BPBD & Posko Siaga 10 Kabupaten / Kota NTB</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {districts.map((dist) => (
            <div
              key={dist.id}
              className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-sky-400">{dist.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Pulau {dist.island}
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 leading-tight">
                  <span className="text-slate-400">Kerentanan: </span>
                  {dist.riskLevel}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] font-sans">BPBD Kabupaten/Kota:</span>
                  <a
                    href={`tel:${dist.bpbdPhone.replace(/[^0-9]/g, '')}`}
                    className="text-white hover:text-sky-300 font-semibold flex items-center gap-1"
                  >
                    <span>{dist.bpbdPhone}</span>
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-sans">Palang Merah Indonesia:</span>
                  <a
                    href={`tel:${dist.pmiPhone.replace(/[^0-9]/g, '')}`}
                    className="text-slate-300 hover:text-sky-300 font-semibold flex items-center gap-1"
                  >
                    <span>{dist.pmiPhone}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
