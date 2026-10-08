import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  EarthquakeItem,
  WeatherRegency,
  VolcanoInfo,
  DistrictInfo,
} from "../types/bmkg";
import {
  Layers,
  MapPin,
  Eye,
  Compass,
  ShieldAlert,
  Mountain,
  CloudLightning,
} from "lucide-react";

interface DisasterMapProps {
  autoGempa: EarthquakeItem | null;
  recentQuakes: EarthquakeItem[];
  weatherRegencies: WeatherRegency[];
  volcanoes: VolcanoInfo[];
  districts: DistrictInfo[];
  bencana30Days?: any;
  selectedQuake: EarthquakeItem | null;
  onSelectQuake: (quake: EarthquakeItem | null) => void;
  selectedRegency: WeatherRegency | null;
  onSelectRegency: (regency: WeatherRegency | null) => void;
}

// Leaflet default icon bug fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Tile Providers (OpenStreetMap based)
const TILE_LAYERS = {
  osm: {
    name: "OpenStreetMap Standar",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> kontributor',
  },
  osmHot: {
    name: "OpenStreetMap Humanitarian (HOT)",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> kontributor, Style by Humanitarian OpenStreetMap Team',
  },
  topo: {
    name: "OpenTopoMap (Kontur & Topografi)",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; OpenTopoMap',
  },
  cartoVoyager: {
    name: "OSM Voyager (Terang & Bersih)",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; CARTO',
  },
  cartoDark: {
    name: "OSM Dark Matter (Mode Malam)",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; CARTO',
  },
};

export const DisasterMap: React.FC<DisasterMapProps> = ({
  autoGempa,
  recentQuakes,
  weatherRegencies,
  volcanoes,
  districts,
  bencana30Days,
  selectedQuake,
  onSelectQuake,
  selectedRegency,
  onSelectRegency,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer Groups
  const quakeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const weatherLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const volcanoLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const geologyLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const districtLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const portLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const bencanaLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // States: OpenStreetMap Standar by default
  const [activeTile, setActiveTile] = useState<keyof typeof TILE_LAYERS>("osm");
  const [showQuakes, setShowQuakes] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [showVolcanoes, setShowVolcanoes] = useState(true);
  const [showGeology, setShowGeology] = useState(true);
  const [showDistricts, setShowDistricts] = useState(false);
  const [showPorts, setShowPorts] = useState(true);
  const [showBencana, setShowBencana] = useState(true);
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [ntbPorts, setNtbPorts] = useState<any[]>([]);

  // Fetch NTB Ports
  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const res = await fetch("/api/bmkg/maritime/ports");
        const data = await res.json();
        setNtbPorts(data);
      } catch (err) {
        console.error("Failed to fetch NTB ports:", err);
      }
    };
    fetchPorts();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // NTB Center: ~ -8.65, 117.20
    const map = L.map(mapContainerRef.current, {
      center: [-8.65, 117.2],
      zoom: 8.5,
      minZoom: 5,
      maxZoom: 17,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Initial Tile Layer
    const tile = L.tileLayer(TILE_LAYERS[activeTile].url, {
      attribution: TILE_LAYERS[activeTile].attribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tile;

    // Initialize Layer Groups
    quakeLayerGroupRef.current = L.layerGroup().addTo(map);
    weatherLayerGroupRef.current = L.layerGroup().addTo(map);
    volcanoLayerGroupRef.current = L.layerGroup().addTo(map);
    geologyLayerGroupRef.current = L.layerGroup().addTo(map);
    districtLayerGroupRef.current = L.layerGroup().addTo(map);
    portLayerGroupRef.current = L.layerGroup().addTo(map);
    bencanaLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newTile = L.tileLayer(TILE_LAYERS[activeTile].url, {
      attribution: TILE_LAYERS[activeTile].attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [activeTile]);

  // Geological Faults (Flores Back-Arc Thrust & Megathrust S. NTB)
  useEffect(() => {
    if (!geologyLayerGroupRef.current) return;
    geologyLayerGroupRef.current.clearLayers();

    if (!showGeology) return;

    // Flores Back-Arc Thrust (North of Bali - Lombok - Sumbawa - Flores)
    const floresBackArcCoords: L.LatLngExpression[] = [
      [-7.95, 115.3], // North Bali
      [-8.05, 116.0], // North Lombok Strait
      [-8.12, 116.45], // North Lombok (Sesar Naik Lombok 2018)
      [-8.18, 117.15], // North Sumbawa Barat
      [-8.15, 117.8], // North Teluk Saleh / Tambora
      [-8.1, 118.6], // North Bima / Selat Sape
      [-8.2, 119.5], // Komodo / Flores
    ];

    const floresFaultLine = L.polyline(floresBackArcCoords, {
      color: "#ef4444",
      weight: 3.5,
      dashArray: "8, 6",
      opacity: 0.85,
    });
    floresFaultLine.bindTooltip(
      '<b>Sesar Naik Busur Belakang Flores (Flores Back-Arc Thrust)</b><br><span class="text-xs text-slate-300">Patahan aktif pemicu Gempa Bumi Lombok M 7.0 (2018) & gempa dangkal utara Sumbawa</span>',
      {
        sticky: true,
        className:
          "bg-slate-900 text-slate-100 border border-red-500/40 px-2 py-1 text-xs rounded shadow-lg",
      },
    );
    geologyLayerGroupRef.current.addLayer(floresFaultLine);

    // Megathrust Zone (South Indian Ocean Trench)
    const megathrustCoords: L.LatLngExpression[] = [
      [-10.1, 115.5],
      [-10.25, 116.3],
      [-10.35, 117.2],
      [-10.45, 118.2],
      [-10.55, 119.3],
    ];

    const megathrustLine = L.polyline(megathrustCoords, {
      color: "#f97316",
      weight: 4,
      dashArray: "4, 8",
      opacity: 0.75,
    });
    megathrustLine.bindTooltip(
      '<b>Zona Megathrust Sumba-Lombok (Subduksi Samudera Hindia)</b><br><span class="text-xs text-slate-300">Zona penunjaman lempeng Indo-Australia terhadap Eurasia</span>',
      {
        sticky: true,
        className:
          "bg-slate-900 text-slate-100 border border-amber-500/40 px-2 py-1 text-xs rounded shadow-lg",
      },
    );
    geologyLayerGroupRef.current.addLayer(megathrustLine);
  }, [showGeology]);

  // Volcanoes Layer (Mt Rinjani & Mt Tambora)
  useEffect(() => {
    if (!volcanoLayerGroupRef.current) return;
    volcanoLayerGroupRef.current.clearLayers();

    if (!showVolcanoes) return;

    volcanoes.forEach((volc) => {
      // Custom Volcano Icon
      const isRinjani = volc.name.includes("Rinjani");
      const badgeColor = isRinjani ? "bg-amber-500" : "bg-emerald-500";

      const customIcon = L.divIcon({
        className: "custom-volcano-marker",
        html: `
          <div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            <div class="w-8 h-8 rounded-full bg-slate-900/90 border-2 ${isRinjani ? "border-amber-400" : "border-emerald-400"} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
              <span class="text-sm font-bold ${isRinjani ? "text-amber-400" : "text-emerald-400"}">🌋</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
      });

      const marker = L.marker([volc.lat, volc.lng], { icon: customIcon });

      const popupContent = `
        <div class="p-3 max-w-xs text-slate-100">
          <div class="flex items-center gap-1.5 mb-1.5">
            <span class="inline-block w-2.5 h-2.5 rounded-full ${isRinjani ? "bg-amber-400" : "bg-emerald-400"}"></span>
            <h4 class="font-bold text-sm text-white">${volc.name}</h4>
          </div>
          <p class="text-xs text-slate-300 mb-2">${volc.island}</p>
          <div class="bg-slate-800/80 rounded p-2 text-xs border border-slate-700/60 mb-2">
            <div class="flex justify-between mb-1">
              <span class="text-slate-400">Status PVMBG:</span>
              <span class="font-semibold ${isRinjani ? "text-amber-300" : "text-emerald-300"}">${volc.status}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Radius Bahaya:</span>
              <span class="font-mono text-white">${volc.hazardRadiusKm} km</span>
            </div>
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed">${volc.dangerDetails}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      volcanoLayerGroupRef.current?.addLayer(marker);

      // Hazard Buffer Circle
      const hazardCircle = L.circle([volc.lat, volc.lng], {
        radius: volc.hazardRadiusKm * 1000,
        color: isRinjani ? "#f59e0b" : "#10b981",
        fillColor: isRinjani ? "#f59e0b" : "#10b981",
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: "4, 4",
      });
      hazardCircle.bindTooltip(
        `Kawasan Rawan Bencana ${volc.name} (${volc.hazardRadiusKm} km)`,
      );
      volcanoLayerGroupRef.current?.addLayer(hazardCircle);
    });
  }, [showVolcanoes, volcanoes]);

  // District / Kab-Kota Reference Layer
  useEffect(() => {
    if (!districtLayerGroupRef.current) return;
    districtLayerGroupRef.current.clearLayers();

    if (!showDistricts) return;

    districts.forEach((d) => {
      const circleMarker = L.circleMarker([d.lat, d.lng], {
        radius: 6,
        color: "#38bdf8",
        fillColor: "#0284c7",
        fillOpacity: 0.8,
        weight: 2,
      });

      const popupContent = `
        <div class="p-3 text-slate-100 min-w-[200px]">
          <h4 class="font-bold text-sm text-sky-400 mb-1">${d.name}</h4>
          <p class="text-xs text-slate-400 mb-2">Pulau ${d.island} · Wilayah Administrasi NTB</p>
          <div class="text-xs space-y-1.5 border-t border-slate-700/60 pt-2">
            <div>
              <span class="text-slate-400 block text-[11px]">Profil Risiko Utama:</span>
              <span class="text-amber-200 text-xs">${d.riskLevel}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Pusdalops BPBD:</span>
              <span class="font-mono text-white">${d.bpbdPhone}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Markas PMI:</span>
              <span class="font-mono text-white">${d.pmiPhone}</span>
            </div>
          </div>
        </div>
      `;

      circleMarker.bindPopup(popupContent);
      districtLayerGroupRef.current?.addLayer(circleMarker);
    });
  }, [showDistricts, districts]);

  // Ports Layer
  useEffect(() => {
    if (!portLayerGroupRef.current) return;
    portLayerGroupRef.current.clearLayers();

    if (!showPorts) return;

    ntbPorts.forEach((port) => {
      const portDiv = L.divIcon({
        className: "custom-port-marker",
        html: `
          <div class="flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            <div class="w-7 h-7 rounded-full bg-indigo-900 border-2 border-indigo-400 shadow-md flex items-center justify-center hover:scale-110 transition-transform">
              ⚓
            </div>
          </div>
        `,
        iconSize: [28, 28],
      });

      const marker = L.marker([port.lat, port.lon], { icon: portDiv });

      const popup = L.popup().setContent(`
        <div class="p-3 text-slate-100 min-w-[250px]" id="popup-${port.id}">
           <div class="flex items-center justify-between mb-2 border-b border-slate-700 pb-2">
             <h4 class="font-bold text-sm text-indigo-400 flex items-center gap-2">⚓ ${port.name}</h4>
           </div>
           <div class="text-xs text-slate-400 flex items-center gap-2">
             <div class="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
             Memuat prakiraan maritim...
           </div>
        </div>
      `);

      marker.bindPopup(popup);

      marker.on("popupopen", async () => {
        try {
          const res = await fetch(`/api/bmkg/maritime/port/${port.id}`);
          if (!res.ok) throw new Error("API failed");
          const data = await res.json();

          let forecastHtml =
            '<div class="text-xs text-red-400">Data cuaca tidak tersedia</div>';

          // API returns forecast in forecast_day1 array (hourly data)
          const forecastArr = data.forecast_day1 || data.data || [];
          if (forecastArr.length > 0) {
            const nowTime = new Date().getTime();
            
            // Filter future or current hour forecasts
            let upcomingForecasts = forecastArr.filter((f: any) => {
              const isoTime = f.time.replace(" UTC", "Z").replace(" ", "T");
              const fTime = new Date(isoTime).getTime();
              return fTime >= nowTime - (60 * 60 * 1000);
            });

            // Fallback if the array is empty (e.g. data is old or end of day)
            if (upcomingForecasts.length === 0) {
               upcomingForecasts = forecastArr.slice(-3);
            }

            // Show the next 3 forecast entries
            const forecasts = upcomingForecasts.slice(0, 3);
            
            forecastHtml = '<div class="space-y-2 mt-2">';
            forecasts.forEach((f: any) => {
              // API time format: "2026-10-06 00:00 UTC" → convert to ISO
              const isoTime = f.time.replace(" UTC", "Z").replace(" ", "T");
              const localTime =
                new Date(isoTime).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Makassar",
                }) + " WITA";
              forecastHtml += `
                <div class="bg-slate-800 p-2 rounded border border-slate-700 text-[11px]">
                  <div class="text-sky-300 font-bold mb-1 flex justify-between">
                    <span>🕒 ${localTime}</span>
                    <span class="text-amber-300">${f.weather}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-1 text-[10px]">
                    <div><span class="text-slate-400">Angin:</span> <span class="text-white">${f.wind_speed} kt (${f.wind_from})</span></div>
                    <div><span class="text-slate-400">Gelombang:</span> <span class="text-white">${f.wave_height}m</span></div>
                    <div><span class="text-slate-400">Status:</span> <span class="text-white">${f.wave_cat}</span></div>
                    <div><span class="text-slate-400">Arus:</span> <span class="text-white">${f.current_speed} m/s</span></div>
                  </div>
                </div>
              `;
            });
            forecastHtml += "</div>";
          }

          const popupEl = document.getElementById(`popup-${port.id}`);
          if (popupEl) {
            popupEl.innerHTML = `
               <div class="flex items-center justify-between mb-2 border-b border-slate-700 pb-2">
                 <h4 class="font-bold text-sm text-indigo-400 flex items-center gap-2">⚓ ${port.name}</h4>
                 <span class="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">BMKG Maritim</span>
               </div>
               ${forecastHtml}
             `;
          }
        } catch (err) {
          const popupEl = document.getElementById(`popup-${port.id}`);
          if (popupEl) {
            popupEl.innerHTML = `
               <div class="flex items-center justify-between mb-2 border-b border-slate-700 pb-2">
                 <h4 class="font-bold text-sm text-red-400 flex items-center gap-2">⚓ ${port.name}</h4>
               </div>
               <div class="text-xs text-red-400 mt-2">Gagal memuat data dari server BMKG.</div>
             `;
          }
        }
      });

      portLayerGroupRef.current?.addLayer(marker);
    });
  }, [showPorts, ntbPorts]);

  // Weather Regencies Layer
  useEffect(() => {
    if (!weatherLayerGroupRef.current) return;
    weatherLayerGroupRef.current.clearLayers();

    if (!showWeather) return;

    weatherRegencies.forEach((reg) => {
      const isSelected = selectedRegency?.id === reg.id;
      const isCaution =
        reg.current.weather.severity === "caution" ||
        reg.current.weather.severity === "warning";

      const weatherDiv = L.divIcon({
        className: "custom-weather-marker",
        html: `
          <div class="flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            <div class="px-2 py-1 rounded-md text-[11px] font-semibold flex items-center justify-center shadow-md border ${
              isSelected
                ? "bg-sky-500 text-white border-white scale-110"
                : isCaution
                  ? "bg-slate-900/90 text-amber-300 border-amber-500/50 hover:border-amber-400"
                  : "bg-slate-900/90 text-slate-200 border-slate-700 hover:border-sky-400"
            } transition-all">
              <span class="text-xs font-mono font-bold">${reg.current.temperatureC}°C</span>
            </div>
          </div>
        `,
        iconSize: [45, 26],
      });

      const marker = L.marker([reg.lat, reg.lng], { icon: weatherDiv });

      const popupContent = `
        <div class="p-3 text-slate-100 min-w-[220px]">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-bold text-sm text-sky-400">${reg.name}</h4>
            <span class="text-xs font-mono bg-sky-950/80 text-sky-300 border border-sky-800 px-1.5 py-0.5 rounded">NTB</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-800/80 p-2 rounded border border-slate-700/60 mb-2">
            <div>
              <span class="text-slate-400 block text-[10px]">Kondisi Cuaca</span>
              <span class="font-medium text-amber-300">${reg.current.weather.desc}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Suhu Saat Ini</span>
              <span class="font-mono text-white text-sm font-semibold">${reg.current.temperatureC}°C</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Kelembapan</span>
              <span class="font-mono text-slate-200">${reg.current.humidityPercent}%</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Kecepatan Angin</span>
              <span class="font-mono text-slate-200">${reg.current.windSpeedKt} knot</span>
            </div>
          </div>
          ${
            reg.forecasts && reg.forecasts.length > 0
              ? `
              <div class="text-[11px]">
                <span class="text-slate-400 block mb-1">Prakiraan Periode Berikutnya:</span>
                <div class="flex gap-1 overflow-x-auto pb-1">
                  ${reg.forecasts
                    .slice(0, 3)
                    .map(
                      (f) => `
                    <div class="bg-slate-900 p-1.5 rounded flex-1 text-center border border-slate-800">
                      <span class="text-[10px] text-slate-400 block">${f.datetime || "WITA"}</span>
                      <span class="font-medium text-slate-200 block text-[10px] truncate">${f.desc}</span>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
              </div>
            `
              : ""
          }
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => onSelectRegency(reg));
      weatherLayerGroupRef.current?.addLayer(marker);
    });
  }, [showWeather, weatherRegencies, selectedRegency, onSelectRegency]);

  // Earthquakes Layer (Autogempa + Recent Quakes)
  useEffect(() => {
    if (!quakeLayerGroupRef.current) return;
    quakeLayerGroupRef.current.clearLayers();

    if (!showQuakes) return;

    // 1. Render Autogempa (Terkini M 5.0+ / Utama)
    if (autoGempa && autoGempa.parsedLat && autoGempa.parsedLng) {
      const mag = parseFloat(autoGempa.Magnitude) || 5.0;
      const isNTB = autoGempa.isNtbArea;

      // Pulse Radar Effect for Latest Earthquake
      const pulseDiv = L.divIcon({
        className: "custom-autogempa-marker",
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            <div class="absolute w-14 h-14 rounded-full bg-red-600/30 quake-pulse-ring"></div>
            <div class="w-10 h-10 rounded-full bg-red-600 border-2 border-white flex flex-col items-center justify-center text-white shadow-2xl z-10 transition-transform group-hover:scale-110">
              <span class="text-[9px] font-bold uppercase leading-none">M</span>
              <span class="text-xs font-mono font-bold leading-none">${autoGempa.Magnitude}</span>
            </div>
            ${
              isNTB
                ? `<div class="absolute -top-6 whitespace-nowrap bg-red-950 text-red-200 border border-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold shadow animate-bounce">
                    WILAYAH NTB (${autoGempa.distanceToNTBKm} km)
                  </div>`
                : ""
            }
          </div>
        `,
        iconSize: [40, 40],
      });

      const autoMarker = L.marker([autoGempa.parsedLat, autoGempa.parsedLng], {
        icon: pulseDiv,
        zIndexOffset: 1000,
      });

      const autoPopupContent = `
        <div class="p-3 text-slate-100 min-w-[260px]">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">GEMPA TERKINI BMKG</span>
            <span class="text-xs font-mono text-slate-300">${autoGempa.Jam}</span>
          </div>
          <h4 class="font-bold text-sm text-white mb-1">M ${autoGempa.Magnitude} · Kedalaman ${autoGempa.Kedalaman}</h4>
          <p class="text-xs text-slate-300 leading-relaxed mb-2">${autoGempa.Wilayah}</p>
          <div class="bg-slate-800/80 p-2 rounded text-xs space-y-1 border border-slate-700/60 mb-2">
            <div class="flex justify-between">
              <span class="text-slate-400">Potensi Tsunami:</span>
              <span class="font-semibold text-emerald-400">${autoGempa.Potensi}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Jarak ke NTB:</span>
              <span class="font-mono text-amber-300 font-semibold">${autoGempa.distanceToNTBKm ?? "-"} km</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Koordinat:</span>
              <span class="font-mono text-slate-300">${autoGempa.Lintang} - ${autoGempa.Bujur}</span>
            </div>
            ${
              autoGempa.Dirasakan
                ? `
              <div class="pt-1 border-t border-slate-700/60">
                <span class="text-slate-400 block text-[10px]">Dirasakan (Skala MMI):</span>
                <span class="text-yellow-300 text-[11px]">${autoGempa.Dirasakan}</span>
              </div>
            `
                : ""
            }
          </div>
          ${
            autoGempa.shakemapUrl
              ? `
            <a href="${autoGempa.shakemapUrl}" target="_blank" rel="noreferrer" class="block text-center text-xs text-sky-400 hover:text-sky-300 underline font-medium">
              Lihat Peta Shakemap BMKG Resmi &rarr;
            </a>
          `
              : ""
          }
        </div>
      `;

      autoMarker.bindPopup(autoPopupContent);
      autoMarker.on("click", () => onSelectQuake(autoGempa));
      quakeLayerGroupRef.current.addLayer(autoMarker);
    }

    // 2. Render Recent Quakes (Up to 15 Quakes)
    recentQuakes.forEach((q) => {
      // Don't duplicate if identical to autogempa coordinates
      if (
        autoGempa &&
        autoGempa.parsedLat &&
        autoGempa.parsedLng &&
        q.parsedLat === autoGempa.parsedLat &&
        q.parsedLng === autoGempa.parsedLng
      ) {
        return;
      }

      if (!q.parsedLat || !q.parsedLng) return;

      const mag = parseFloat(q.Magnitude) || 4.0;
      const isNTB = q.isNtbArea;
      const isSelected =
        selectedQuake && selectedQuake.Coordinates === q.Coordinates;

      let colorClass = "bg-yellow-500 border-yellow-300 text-slate-950";
      if (mag >= 6.0) {
        colorClass = "bg-red-600 border-red-300 text-white";
      } else if (mag >= 5.0) {
        colorClass = "bg-amber-600 border-amber-300 text-white";
      }

      const quakeIcon = L.divIcon({
        className: "custom-recent-quake-marker",
        html: `
          <div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            <div class="px-1.5 py-0.5 rounded-full ${colorClass} border font-mono font-bold text-[10px] shadow-md flex items-center gap-0.5 ${
              isSelected ? "scale-125 ring-2 ring-white" : ""
            } ${isNTB ? "ring-2 ring-red-500" : ""} transition-transform group-hover:scale-115">
              <span>M${q.Magnitude}</span>
            </div>
          </div>
        `,
        iconSize: [32, 20],
      });

      const marker = L.marker([q.parsedLat, q.parsedLng], { icon: quakeIcon });

      const popupContent = `
        <div class="p-3 text-slate-100 min-w-[240px]">
          <div class="flex items-center justify-between mb-1.5">
            <span class="font-bold text-xs ${mag >= 5.5 ? "text-red-400" : "text-amber-400"}">M ${q.Magnitude} · ${q.Kedalaman}</span>
            <span class="text-[11px] font-mono text-slate-400">${q.Tanggal} ${q.Jam}</span>
          </div>
          <p class="text-xs text-slate-200 mb-2">${q.Wilayah}</p>
          <div class="bg-slate-800/80 p-2 rounded text-[11px] space-y-1 border border-slate-700/60">
            <div class="flex justify-between">
              <span class="text-slate-400">Jarak ke NTB:</span>
              <span class="font-mono ${isNTB ? "text-red-400 font-bold" : "text-slate-300"}">${q.distanceToNTBKm ?? "-"} km ${isNTB ? "(Wilayah NTB)" : ""}</span>
            </div>
            ${
              q.Dirasakan
                ? `
              <div class="pt-1 border-t border-slate-700/60">
                <span class="text-slate-400 block text-[10px]">Dirasakan:</span>
                <span class="text-yellow-300">${q.Dirasakan}</span>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => onSelectQuake(q));
      quakeLayerGroupRef.current?.addLayer(marker);
    });
  }, [showQuakes, autoGempa, recentQuakes, selectedQuake, onSelectQuake]);

  // Bencana 30 Hari Terakhir Layer
  useEffect(() => {
    if (!bencanaLayerGroupRef.current) return;
    bencanaLayerGroupRef.current.clearLayers();

    if (!showBencana || !bencana30Days || !bencana30Days.features) return;

    bencana30Days.features.forEach((feature: any) => {
      const { geometry, properties } = feature;
      if (geometry && geometry.type === "Point" && geometry.coordinates) {
        const [lng, lat] = geometry.coordinates;
        
        let iconHtml = "🔴";
        let colorClass = "bg-red-500 text-white border-white";
        const jenisLower = properties.jenis ? properties.jenis.toLowerCase() : "";
        if (jenisLower.includes("kekeringan")) {
          iconHtml = "☀️";
          colorClass = "bg-amber-500 text-slate-900 border-white";
        } else if (jenisLower.includes("banjir")) {
          iconHtml = "🌊";
          colorClass = "bg-blue-500 text-white border-white";
        } else if (jenisLower.includes("longsor")) {
          iconHtml = "⛰️";
          colorClass = "bg-amber-800 text-white border-white";
        } else if (jenisLower.includes("angin")) {
          iconHtml = "💨";
          colorClass = "bg-teal-500 text-white border-white";
        } else if (jenisLower.includes("gempa")) {
          iconHtml = "💥";
          colorClass = "bg-rose-600 text-white border-white";
        } else if (jenisLower.includes("kebakaran")) {
          iconHtml = "🔥";
          colorClass = "bg-orange-600 text-white border-white";
        }

        const bencanaDiv = L.divIcon({
          className: "custom-bencana-marker",
          html: `
            <div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
              <div class="w-8 h-8 rounded-full ${colorClass} border-2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                <span class="text-sm font-bold">${iconHtml}</span>
              </div>
            </div>
          `,
          iconSize: [32, 32],
        });

        const marker = L.marker([lat, lng], { icon: bencanaDiv });

        const popupContent = `
          <div class="p-3 text-slate-100 min-w-[240px]">
            <div class="flex items-center justify-between mb-1.5 border-b border-slate-700 pb-1">
              <h4 class="font-bold text-sm text-rose-400">${properties.jenis || 'Kejadian Bencana'}</h4>
              <span class="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">${properties.tanggalBencana || '-'}</span>
            </div>
            <div class="text-xs space-y-1">
              <p><span class="text-slate-400">Lokasi:</span> <span class="font-medium">${properties.desa || '-'}</span></p>
              ${properties.cakupan ? `<p><span class="text-slate-400">Cakupan:</span> ${properties.cakupan}</p>` : ''}
              ${properties.pendudukTerdampak ? `<p><span class="text-slate-400">Terdampak:</span> ${properties.pendudukTerdampak}</p>` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        bencanaLayerGroupRef.current?.addLayer(marker);
      }
    });
  }, [showBencana, bencana30Days]);

  // Fly to selected quake or regency when user selects from list
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedQuake && selectedQuake.parsedLat && selectedQuake.parsedLng) {
      mapInstanceRef.current.flyTo(
        [selectedQuake.parsedLat, selectedQuake.parsedLng],
        10,
        {
          duration: 1.2,
        },
      );
    }
  }, [selectedQuake]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedRegency && selectedRegency.lat && selectedRegency.lng) {
      mapInstanceRef.current.flyTo(
        [selectedRegency.lat, selectedRegency.lng],
        11,
        {
          duration: 1.2,
        },
      );
    }
  }, [selectedRegency]);

  // Quick Bounds Navigation
  const jumpToBounds = (
    target: "ntb" | "lombok" | "sumbawa" | "rinjani" | "tambora",
  ) => {
    if (!mapInstanceRef.current) return;
    switch (target) {
      case "ntb":
        mapInstanceRef.current.flyTo([-8.65, 117.2], 8.5, { duration: 1.0 });
        break;
      case "lombok":
        mapInstanceRef.current.flyTo([-8.58, 116.32], 10, { duration: 1.0 });
        break;
      case "sumbawa":
        mapInstanceRef.current.flyTo([-8.6, 117.8], 9, { duration: 1.0 });
        break;
      case "rinjani":
        mapInstanceRef.current.flyTo([-8.42, 116.458], 12, { duration: 1.0 });
        break;
      case "tambora":
        mapInstanceRef.current.flyTo([-8.25, 117.96], 12, { duration: 1.0 });
        break;
    }
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Quick Focus Buttons & OSM Badge */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap gap-2 max-w-[85vw] sm:max-w-none">
        {/* OpenStreetMap Badge */}
        <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-lg flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-bold text-sky-400">OpenStreetMap</span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            · NTB (Lombok & Sumbawa)
          </span>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-lg flex items-center gap-1">
          <button
            onClick={() => jumpToBounds("ntb")}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-sky-600/30 text-sky-300 hover:bg-sky-600/50 border border-sky-500/40 transition-colors"
          >
            Fokus NTB
          </button>
          <button
            onClick={() => jumpToBounds("lombok")}
            className="px-2 py-1 text-xs font-medium rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            P. Lombok
          </button>
          <button
            onClick={() => jumpToBounds("sumbawa")}
            className="px-2 py-1 text-xs font-medium rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            P. Sumbawa
          </button>
          <button
            onClick={() => jumpToBounds("rinjani")}
            className="px-2 py-1 text-xs font-medium rounded text-amber-300 hover:bg-amber-950/50 hover:text-amber-200 transition-colors flex items-center gap-1"
          >
            <Mountain className="w-3 h-3 text-amber-400" />
            G. Rinjani
          </button>
          <button
            onClick={() => jumpToBounds("tambora")}
            className="px-2 py-1 text-xs font-medium rounded text-emerald-300 hover:bg-emerald-950/50 hover:text-emerald-200 transition-colors flex items-center gap-1"
          >
            <Mountain className="w-3 h-3 text-emerald-400" />
            G. Tambora
          </button>
        </div>
      </div>

      {/* Top Left Below: OSM Style Switcher & Disaster Layers */}
      <div className="absolute top-14 left-3 z-[400] flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowLayersDropdown(!showLayersDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/90 backdrop-blur-md text-slate-200 hover:text-white border border-slate-700/80 shadow-lg transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Pilihan Peta OSM</span>
          </button>

          {showLayersDropdown && (
            <div className="absolute left-0 mt-2 w-64 p-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl text-xs space-y-3 z-50">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Tipe Peta OpenStreetMap
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    Object.keys(TILE_LAYERS) as Array<keyof typeof TILE_LAYERS>
                  ).map((key) => (
                    <button
                      key={key}
                      onClick={() => setActiveTile(key)}
                      className={`px-2 py-1.5 rounded text-left truncate transition-colors ${
                        activeTile === key
                          ? "bg-sky-600 text-white font-medium"
                          : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {TILE_LAYERS[key].name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Layer Kebencanaan
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                    <span className="flex items-center gap-2 text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      Gempa BMKG (Auto & 15 Terkini)
                    </span>
                    <input
                      type="checkbox"
                      checked={showQuakes}
                      onChange={(e) => setShowQuakes(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                    <span className="flex items-center gap-2 text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                      Prakiraan Cuaca 10 Kab/Kota
                    </span>
                    <input
                      type="checkbox"
                      checked={showWeather}
                      onChange={(e) => setShowWeather(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                    <span className="flex items-center gap-2 text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Gunung Berapi (Rinjani & Tambora)
                    </span>
                    <input
                      type="checkbox"
                      checked={showVolcanoes}
                      onChange={(e) => setShowVolcanoes(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                    <span className="flex items-center gap-2 text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      Kejadian Bencana (30 Hari Terakhir)
                    </span>
                    <input
                      type="checkbox"
                      checked={showBencana}
                      onChange={(e) => setShowBencana(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                    <span className="flex items-center gap-2 text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                      Sesar Naik Flores & Megathrust
                    </span>
                    <input
                      type="checkbox"
                      checked={showGeology}
                      onChange={(e) => setShowGeology(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                    <span className="flex items-center gap-2 text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      Ibukota & Titik BPBD Kab/Kota
                    </span>
                    <input
                      type="checkbox"
                      checked={showDistricts}
                      onChange={(e) => setShowDistricts(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                    <span className="flex items-center gap-2 text-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                      Pelabuhan Maritim BMKG
                    </span>
                    <input
                      type="checkbox"
                      checked={showPorts}
                      onChange={(e) => setShowPorts(e.target.checked)}
                      className="rounded accent-sky-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Left: Map Legend (Collapsible) */}
      <div className="absolute bottom-3 left-3 z-[400]">
        {showLegend ? (
          <div className="bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/80 shadow-lg text-[11px] max-w-[280px]">
            <div className="font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Legenda Potensi Bencana NTB</span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-[10px] text-slate-400 hover:text-white transition-colors px-1"
                title="Minimize"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-600 inline-block shadow"></span>
                <span>Gempa Terkini</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span>Gempa M 4.5 - 5.9</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-red-500 inline-block border-b-2 border-dashed border-red-500"></span>
                <span>Sesar Naik Flores</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-500 inline-block border-b-2 border-dotted border-amber-500"></span>
                <span>Megathrust S. NTB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>🌋</span>
                <span>Gunung Api Aktif</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-600 inline-block"></span>
                <span>Cuaca Kab/Kota</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 flex items-center justify-center bg-indigo-900 rounded-full border border-indigo-400 text-[8px]">
                  ⚓
                </span>
                <span>Pelabuhan</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLegend(true)}
            className="bg-slate-900/90 backdrop-blur-md p-2 rounded-lg border border-slate-700/80 shadow-lg text-xs text-slate-300 hover:text-white hover:border-sky-500/50 transition-colors flex items-center gap-1.5"
            title="Tampilkan Legenda"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Legenda</span>
          </button>
        )}
      </div>
    </div>
  );
};
