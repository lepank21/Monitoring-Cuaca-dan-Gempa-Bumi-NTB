import React from "react";
import {
  PhoneCall,
  ShieldAlert,
  LifeBuoy,
  Radio,
  Siren,
  ExternalLink,
} from "lucide-react";
import { DistrictInfo } from "../types/bmkg";

interface EmergencyContactsProps {
  districts?: DistrictInfo[];
  nomorPenting?: any[];
}

export const EmergencyContactsModal: React.FC<EmergencyContactsProps> = ({
  nomorPenting,
}) => {
  const groupedContacts =
    nomorPenting?.reduce((acc: any, curr: any) => {
      const cat = curr.category || "Lainnya";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(curr);
      return acc;
    }, {}) || {};

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
          Nomor darurat penting dan layanan kesehatan yang dapat dihubungi di
          Provinsi Nusa Tenggara Barat.
        </p>
      </div>

      {/* Emergency Call Numbers 24/7 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-600 text-white shrink-0">
            <Siren className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] text-red-300 font-bold uppercase block">
              Panggilan Darurat Terpadu
            </span>
            <span className="text-2xl font-bold font-mono text-white">112</span>
            <span className="text-[11px] text-slate-300 block">
              Bebas Pulsa 24 Jam
            </span>
          </div>
        </div>

        <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-600 text-white shrink-0">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-amber-300 font-bold uppercase block">
              BASARNAS / SAR Mataram
            </span>
            <span className="text-2xl font-bold font-mono text-white">115</span>
            <span className="text-[11px] text-slate-300 block">
              (0370) 633211
            </span>
          </div>
        </div>

        <div className="bg-sky-950/40 border border-sky-500/50 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-600 text-white shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-sky-300 font-bold uppercase block">
              PUSDALOPS BPBD NTB
            </span>
            <span className="text-base font-bold font-mono text-white">
              081111144117
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic API Contacts */}
      <div className="space-y-6">
        {Object.keys(groupedContacts).length === 0 ? (
          <div className="text-slate-400 text-sm italic">
            Memuat data nomor penting dari server...
          </div>
        ) : (
          Object.keys(groupedContacts).map((category) => (
            <div key={category}>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="text-sky-400 uppercase tracking-wider">
                  {category}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedContacts[category].map((contact: any) => (
                  <div
                    key={contact.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="mb-2">
                      <h4 className="font-bold text-sm text-white mb-1">
                        {contact.name}
                      </h4>
                      {contact.address && (
                        <p className="text-[11px] text-slate-400 leading-tight">
                          {contact.address}
                        </p>
                      )}
                    </div>
                    {contact.phone && (
                      <div className="pt-2 border-t border-slate-800 mt-1">
                        <a
                          href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}
                          className="text-sky-400 hover:text-sky-300 font-bold font-mono text-xs flex items-center gap-1.5"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{contact.phone}</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
