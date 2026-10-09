import React, { useState } from 'react';
import { WeatherRegency } from '../types/bmkg';
import { Cloud, CloudRain, Sun, CloudSun, Wind, Droplets, MapPin, AlertCircle, ArrowUpRight } from 'lucide-react';

interface WeatherForecastPanelProps {
  weatherRegencies: WeatherRegency[];
  selectedRegency: WeatherRegency | null;
  onSelectRegency: (regency: WeatherRegency) => void;
  onFocusMap: (lat: number, lng: number) => void;
}

export const WeatherForecastPanel: React.FC<WeatherForecastPanelProps> = ({
  weatherRegencies,
  selectedRegency,
  onSelectRegency,
  onFocusMap,
}) => {
  const [islandFilter, setIslandFilter] = useState<'all' | 'lombok' | 'sumbawa'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRegencies = weatherRegencies.filter((reg) => {
    const isLombok =
      reg.name.toLowerCase().includes('lombok') || reg.name.toLowerCase().includes('mataram');
    const isSumbawa =
      reg.name.toLowerCase().includes('sumbawa') ||
      reg.name.toLowerCase().includes('dompu') ||
      reg.name.toLowerCase().includes('bima');

    if (islandFilter === 'lombok' && !isLombok) return false;
    if (islandFilter === 'sumbawa' && !isSumbawa) return false;

    if (searchQuery) {
      return reg.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getWeatherIcon = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('petir')) return <CloudRain className="w-5 h-5 text-amber-400" />;
    if (d.includes('lebat') || d.includes('hujan')) return <CloudRain className="w-5 h-5 text-sky-400" />;
    if (d.includes('cerah berawan')) return <CloudSun className="w-5 h-5 text-amber-300" />;
    if (d.includes('cerah')) return <Sun className="w-5 h-5 text-yellow-400" />;
    return <Cloud className="w-5 h-5 text-slate-300" />;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cloud className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Prakiraan Cuaca 11 Wilayah / Kota NTB
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Data Resmi BMKG Digital Forecast Nusa Tenggara Barat untuk Pulau Lombok & Sumbawa
          </p>
        </div>

        {/* Island Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setIslandFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              islandFilter === 'all'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua (11)
          </button>
          <button
            onClick={() => setIslandFilter('lombok')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              islandFilter === 'lombok'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pulau Lombok
          </button>
          <button
            onClick={() => setIslandFilter('sumbawa')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              islandFilter === 'sumbawa'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pulau Sumbawa
          </button>
        </div>
      </div>

      {/* Regencies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {filteredRegencies.map((reg) => {
          const isSelected = selectedRegency?.id === reg.id;
          const isWarning =
            reg.current.weather.severity === 'warning' ||
            reg.current.weather.desc.toLowerCase().includes('petir') ||
            reg.current.weather.desc.toLowerCase().includes('lebat');

          return (
            <div
              key={reg.id}
              onClick={() => {
                onSelectRegency(reg);
                onFocusMap(reg.lat, reg.lng);
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5 ${
                isSelected
                  ? 'bg-sky-950/50 border-sky-500 ring-2 ring-sky-500/50'
                  : isWarning
                  ? 'bg-slate-950/80 border-amber-600/50 hover:border-amber-500'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="font-bold text-xs text-white truncate">{reg.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {reg.name.toLowerCase().includes('lombok') || reg.name.toLowerCase().includes('mataram')
                    ? 'Lombok'
                    : 'Sumbawa'}
                </span>
              </div>

              {/* Current Temperature and Condition */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {getWeatherIcon(reg.current.weather.desc)}
                  </div>
                  <div>
                    <span className="text-xl font-bold font-mono text-white leading-none block">
                      {reg.current.temperatureC}°C
                    </span>
                    <span className="text-[11px] text-amber-300 font-medium leading-tight block truncate max-w-[120px]">
                      {reg.current.weather.desc}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather Stats */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-900/80 p-2 rounded-lg text-[10px] border border-slate-800 mb-2">
                <div className="flex items-center gap-1 text-slate-400">
                  <Droplets className="w-3 h-3 text-sky-400" />
                  <span className="font-mono text-slate-200">{reg.current.humidityPercent}% RH</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Wind className="w-3 h-3 text-sky-400" />
                  <span className="font-mono text-slate-200">{reg.current.windSpeedKt} kt</span>
                </div>
              </div>

              {/* Mini Forecast Time Horizon */}
              {reg.forecasts && reg.forecasts.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  {reg.forecasts.slice(0, 3).map((f, i) => (
                    <div key={i} className="text-center">
                      <span className="block text-[9px] text-slate-500">{f.datetime.slice(-4) || 'WITA'}</span>
                      <span className="font-medium text-slate-300 truncate max-w-[45px] block">{f.desc}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Focus on map CTA */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRegency(reg);
                  onFocusMap(reg.lat, reg.lng);
                }}
                className="w-full mt-2 py-1 px-2 rounded bg-slate-900 hover:bg-sky-600/30 text-sky-400 text-[10px] font-semibold flex items-center justify-center gap-1 border border-slate-800 transition-colors"
              >
                <MapPin className="w-3 h-3" />
                <span>Lihat di Peta NTB</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
