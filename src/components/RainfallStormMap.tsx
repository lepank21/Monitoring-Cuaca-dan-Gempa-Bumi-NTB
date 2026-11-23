import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import {
  CloudRain,
  Wind,
  RefreshCw,
  Eye,
  EyeOff,
  Droplets,
  CloudLightning,
  Gauge,
  Clock,
} from "lucide-react";

interface RainfallPoint {
  lat: number;
  lng: number;
  name: string | null;
  precipitation: number;
  rain: number;
  weatherCode: number;
  windSpeed: number;
  windGusts: number;
  cloudCover: number;
  stormLevel: "none" | "ringan" | "sedang" | "lebat" | "badai";
  forecast6h: number;
}

interface RainfallData {
  updatedAt: string;
  source: string;
  grid: RainfallPoint[];
}

// Color scale for precipitation intensity (mm)
function getPrecipColor(mm: number): string {
  if (mm <= 0) return "rgba(0,0,0,0)";
  if (mm < 1) return "rgba(100,180,255,0.35)";
  if (mm < 3) return "rgba(60,140,255,0.5)";
  if (mm < 5) return "rgba(30,200,80,0.55)";
  if (mm < 10) return "rgba(180,220,30,0.6)";
  if (mm < 15) return "rgba(255,200,0,0.65)";
  if (mm < 25) return "rgba(255,140,0,0.7)";
  if (mm < 50) return "rgba(255,60,30,0.75)";
  return "rgba(180,0,60,0.8)";
}

function getPrecipRadius(mm: number): number {
  if (mm <= 0) return 0;
  if (mm < 1) return 12000;
  if (mm < 5) return 16000;
  if (mm < 10) return 20000;
  if (mm < 20) return 24000;
  return 28000;
}

function getStormLabel(level: string): string {
  switch (level) {
    case "ringan":
      return "Hujan Ringan";
    case "sedang":
      return "Hujan Sedang";
    case "lebat":
      return "Hujan Lebat";
    case "badai":
      return "Badai";
    default:
      return "Cerah";
  }
}

function getStormBadgeColor(level: string): string {
  switch (level) {
    case "ringan":
      return "bg-blue-500/80";
    case "sedang":
      return "bg-yellow-500/80";
    case "lebat":
      return "bg-orange-500/80";
    case "badai":
      return "bg-red-600/90";
    default:
      return "bg-slate-600/60";
  }
}

export const RainfallStormMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const rainfallLayerRef = useRef<L.LayerGroup | null>(null);
  const cityLayerRef = useRef<L.LayerGroup | null>(null);
  const rainAnimLayerRef = useRef<L.LayerGroup | null>(null);

  const [data, setData] = useState<RainfallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showRainAnim, setShowRainAnim] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<RainfallPoint | null>(
    null,
  );
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchRainfall = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/openmeteo/rainfall-ntb?_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json: RainfallData = await r.json();
      setData(json);
      setLastUpdated(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " WITA",
      );
    } catch (err) {
      console.warn("Rainfall fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling every 5 minutes
  useEffect(() => {
    fetchRainfall();
    const iv = setInterval(fetchRainfall, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [fetchRainfall]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [-8.55, 117.4],
      zoom: 8,
      minZoom: 7,
      maxZoom: 12,
      zoomControl: false,
    });

    // Dark topographic tile layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
      },
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    rainfallLayerRef.current = L.layerGroup().addTo(map);
    cityLayerRef.current = L.layerGroup().addTo(map);
    rainAnimLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render rainfall data on map
  useEffect(() => {
    if (!data || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // --- Heatmap circles ---
    if (rainfallLayerRef.current) {
      rainfallLayerRef.current.clearLayers();
      if (showHeatmap) {
        data.grid.forEach((pt) => {
          if (pt.precipitation <= 0 && pt.stormLevel === "none") return;
          const radius = getPrecipRadius(pt.precipitation);
          if (radius === 0) return;

          const circle = L.circle([pt.lat, pt.lng], {
            radius,
            color: "transparent",
            fillColor: getPrecipColor(pt.precipitation),
            fillOpacity: 1,
            interactive: false,
          });
          rainfallLayerRef.current!.addLayer(circle);
        });
      }
    }

    // --- City markers ---
    if (cityLayerRef.current) {
      cityLayerRef.current.clearLayers();
      if (showLabels) {
        const cities = data.grid.filter((pt) => pt.name);
        cities.forEach((pt) => {
          // City dot
          const dot = L.circleMarker([pt.lat, pt.lng], {
            radius: pt.stormLevel === "badai" ? 7 : 4,
            color: "#fff",
            fillColor:
              pt.stormLevel === "badai"
                ? "#ef4444"
                : pt.stormLevel === "lebat"
                  ? "#f97316"
                  : "#1e293b",
            fillOpacity: 1,
            weight: 1.5,
          });

          dot.on("click", () => setSelectedPoint(pt));

          // City name label
          const labelContent = `
            <div style="
              font-size:12px; font-weight:700; color:#fff;
              text-shadow: 0 1px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.7);
              white-space:nowrap; pointer-events:none;
            ">${pt.name}</div>
          `;
          const label = L.marker([pt.lat, pt.lng], {
            icon: L.divIcon({
              html: labelContent,
              className: "",
              iconAnchor: [0, -10],
            }),
            interactive: false,
          });

          cityLayerRef.current!.addLayer(dot);
          cityLayerRef.current!.addLayer(label);

          // Precipitation tooltip badge (only if raining)
          if (pt.precipitation > 0) {
            const badgeBg =
              pt.stormLevel === "badai"
                ? "#dc2626"
                : pt.stormLevel === "lebat"
                  ? "#ea580c"
                  : pt.stormLevel === "sedang"
                    ? "#ca8a04"
                    : "#2563eb";
            const tooltipHtml = `
              <div style="
                background:${badgeBg}; color:#fff; padding:4px 10px;
                border-radius:8px; font-size:12px; font-weight:700;
                box-shadow:0 2px 8px rgba(0,0,0,0.4);
                white-space:nowrap; pointer-events:auto; cursor:pointer;
                display:flex; align-items:center; gap:4px;
              ">
                <span style="font-size:14px; font-weight:800;">${pt.precipitation} mm</span>
                <span style="font-size:10px; opacity:0.9;">${getStormLabel(pt.stormLevel)}</span>
              </div>
            `;
            const badge = L.marker([pt.lat, pt.lng], {
              icon: L.divIcon({
                html: tooltipHtml,
                className: "",
                iconAnchor: [-12, 20],
              }),
            });
            badge.on("click", () => setSelectedPoint(pt));
            cityLayerRef.current!.addLayer(badge);
          }
        });
      }
    }

    // --- Rain animation overlay (diagonal rain lines for areas with rain) ---
    if (rainAnimLayerRef.current) {
      rainAnimLayerRef.current.clearLayers();
      if (showRainAnim) {
        const rainingPoints = data.grid.filter(
          (pt) => pt.precipitation >= 2 || pt.stormLevel === "lebat" || pt.stormLevel === "badai",
        );
        rainingPoints.forEach((pt) => {
          const intensity =
            pt.stormLevel === "badai"
              ? 0.4
              : pt.stormLevel === "lebat"
                ? 0.3
                : 0.2;
          const radius =
            pt.stormLevel === "badai"
              ? 25000
              : pt.stormLevel === "lebat"
                ? 18000
                : 12000;

          const rainOverlay = L.circle([pt.lat, pt.lng], {
            radius,
            color: "transparent",
            fillColor: `rgba(100,160,255,${intensity})`,
            fillOpacity: 1,
            interactive: false,
            className: "rain-animation-circle",
          });
          rainAnimLayerRef.current!.addLayer(rainOverlay);
        });
      }
    }
  }, [data, showHeatmap, showLabels, showRainAnim]);

  // Summary stats
  const stats = data
    ? (() => {
        const cities = data.grid.filter((p) => p.name);
        const maxPrecip = Math.max(
          ...cities.map((p) => p.precipitation),
          0,
        );
        const maxCity = cities.find((p) => p.precipitation === maxPrecip);
        const stormCount = cities.filter(
          (p) => p.stormLevel === "lebat" || p.stormLevel === "badai",
        ).length;
        const rainingCount = cities.filter(
          (p) => p.precipitation > 0,
        ).length;
        const maxWind = Math.max(...cities.map((p) => p.windGusts), 0);
        return { maxPrecip, maxCity, stormCount, rainingCount, maxWind };
      })()
    : null;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top summary bar */}
      <div className="bg-slate-900/95 border-b border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Curah Hujan & Badai NTB
            </h2>
          </div>
          {stats && (
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Hujan: {stats.rainingCount} kota
              </span>
              {stats.stormCount > 0 && (
                <span className="flex items-center gap-1 text-red-400 font-bold animate-pulse">
                  <CloudLightning className="w-3.5 h-3.5" />
                  Badai/Lebat: {stats.stormCount} kota
                </span>
              )}
              {stats.maxCity && stats.maxPrecip > 0 && (
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  Tertinggi: {stats.maxPrecip} mm ({stats.maxCity.name})
                </span>
              )}
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                Angin Max: {stats.maxWind} km/h
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdated}
            </span>
          )}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            title={showHeatmap ? "Sembunyikan heatmap" : "Tampilkan heatmap"}
            className={`p-1.5 rounded-md border text-xs transition-colors ${
              showHeatmap
                ? "bg-blue-950/50 border-blue-600/50 text-blue-400"
                : "bg-slate-800 border-slate-700 text-slate-500"
            }`}
          >
            {showHeatmap ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={fetchRainfall}
            disabled={loading}
            className="p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0 z-0" />

        {/* Loading overlay */}
        {loading && !data && (
          <div className="absolute inset-0 z-10 bg-slate-950/80 flex items-center justify-center">
            <div className="flex items-center gap-3 text-blue-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">
                Memuat data curah hujan NTB...
              </span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[500] bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-xl">
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
            Intensitas Curah Hujan (mm/jam)
          </div>
          <div className="flex items-center gap-1">
            {[
              { color: "rgba(100,180,255,0.6)", label: "<1" },
              { color: "rgba(60,140,255,0.7)", label: "1-3" },
              { color: "rgba(30,200,80,0.7)", label: "3-5" },
              { color: "rgba(180,220,30,0.75)", label: "5-10" },
              { color: "rgba(255,200,0,0.8)", label: "10-15" },
              { color: "rgba(255,140,0,0.85)", label: "15-25" },
              { color: "rgba(255,60,30,0.9)", label: "25-50" },
              { color: "rgba(180,0,60,0.9)", label: ">50" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className="w-6 h-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[8px] text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
              Badai
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
              Hujan Lebat
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              Hujan Ringan
            </span>
          </div>
        </div>

        {/* Selected city detail panel */}
        {selectedPoint && (
          <div className="absolute top-4 right-4 z-[500] bg-slate-900/95 border border-slate-600 rounded-xl p-4 shadow-2xl w-72">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">
                {selectedPoint.name}
              </h3>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-slate-500 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div
              className={`${getStormBadgeColor(selectedPoint.stormLevel)} text-white text-xs font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1 mb-3`}
            >
              {selectedPoint.stormLevel === "badai" && (
                <CloudLightning className="w-3 h-3" />
              )}
              {getStormLabel(selectedPoint.stormLevel)}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  Curah Hujan Saat Ini
                </span>
                <span className="text-white font-bold">
                  {selectedPoint.precipitation} mm
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-blue-300" />
                  Prakiraan 6 Jam
                </span>
                <span className="text-white font-bold">
                  {selectedPoint.forecast6h} mm
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  Kecepatan Angin
                </span>
                <span className="text-white font-bold">
                  {selectedPoint.windSpeed} km/h
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-red-400" />
                  Hembusan Angin
                </span>
                <span className="text-white font-bold">
                  {selectedPoint.windGusts} km/h
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tutupan Awan</span>
                <span className="text-white font-bold">
                  {selectedPoint.cloudCover}%
                </span>
              </div>
            </div>

            {/* Precipitation bar */}
            <div className="mt-3">
              <div className="text-[10px] text-slate-500 mb-1">
                Intensitas
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((selectedPoint.precipitation / 50) * 100, 100)}%`,
                    background:
                      selectedPoint.precipitation > 25
                        ? "linear-gradient(90deg, #f97316, #dc2626)"
                        : selectedPoint.precipitation > 10
                          ? "linear-gradient(90deg, #eab308, #f97316)"
                          : selectedPoint.precipitation > 3
                            ? "linear-gradient(90deg, #22c55e, #eab308)"
                            : "linear-gradient(90deg, #3b82f6, #22c55e)",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile summary cards */}
      {data && (
        <div className="sm:hidden bg-slate-900/95 border-t border-slate-700 px-3 py-2 flex items-center justify-around text-xs text-slate-300">
          <span className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-blue-400" />
            {stats?.rainingCount || 0} hujan
          </span>
          {stats && stats.stormCount > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <CloudLightning className="w-3 h-3" />
              {stats.stormCount} badai
            </span>
          )}
          <span className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-amber-400" />
            Max: {stats?.maxPrecip || 0} mm
          </span>
        </div>
      )}
    </div>
  );
};
