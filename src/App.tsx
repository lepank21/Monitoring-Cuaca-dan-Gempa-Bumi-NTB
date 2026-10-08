/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { DisasterMap } from "./components/DisasterMap";
import { EarthquakePanel } from "./components/EarthquakePanel";
import { WeatherForecastPanel } from "./components/WeatherForecastPanel";
import { NowcastingBanner } from "./components/NowcastingBanner";
import { LaravelExportModal } from "./components/LaravelExportModal";
import { EmergencyContactsModal } from "./components/EmergencyContactsModal";
import {
  NotificationToast,
  AlertToastData,
} from "./components/NotificationToast";
import {
  EarthquakeItem,
  WeatherRegency,
  NowcastingAlert,
  DistrictInfo,
  VolcanoInfo,
} from "./types/bmkg";
import { soundAlert } from "./utils/audioAlert";
import {
  ShieldAlert,
  Activity,
  CloudSun,
  Radio,
  MapPin,
  AlertTriangle,
} from "lucide-react";

export default function App() {
  const [activeView, setActiveView] = useState<
    "map" | "weather" | "quakes" | "laravel" | "contacts"
  >("map");
  const [autoGempa, setAutoGempa] = useState<EarthquakeItem | null>(null);
  const [recentQuakes, setRecentQuakes] = useState<EarthquakeItem[]>([]);
  const [feltQuakes, setFeltQuakes] = useState<EarthquakeItem[]>([]);
  const [weatherRegencies, setWeatherRegencies] = useState<WeatherRegency[]>(
    [],
  );
  const [nowcasting, setNowcasting] = useState<NowcastingAlert | null>(null);
  const [districts, setDistricts] = useState<DistrictInfo[]>([]);
  const [volcanoes, setVolcanoes] = useState<VolcanoInfo[]>([]);
  const [marineWarning, setMarineWarning] = useState<any>(null);

  // Selection states for map interaction
  const [selectedQuake, setSelectedQuake] = useState<EarthquakeItem | null>(
    null,
  );
  const [selectedRegency, setSelectedRegency] = useState<WeatherRegency | null>(
    null,
  );

  // Audio & Notification
  const [isSoundEnabled, setIsSoundEnabled] = useState(soundAlert.isEnabled());
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted",
  );
  const [toast, setToast] = useState<AlertToastData | null>(null);

  // Sync state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [lastSeenQuakeTime, setLastSeenQuakeTime] = useState<string>("");
  const [lastSeenLaporId, setLastSeenLaporId] = useState<string>("");

  // 1. Fetch District and Volcano Reference Info
  useEffect(() => {
    fetch("/api/ntb/info")
      .then((res) => res.json())
      .then((data) => {
        if (data.districts) setDistricts(data.districts);
        if (data.volcanoes) setVolcanoes(data.volcanoes);
      })
      .catch((err) => console.warn("Error fetching NTB info:", err));
  }, []);

  // 2. Main Data Fetcher
  const fetchData = useCallback(
    async (isInitial = false) => {
      setIsRefreshing(true);
      try {
        // Parallel fetches to our server proxy
        const [autoRes, recentRes, feltRes, weatherRes, nowcastRes, marineRes, laporRes] =
          await Promise.all([
            fetch("/api/bmkg/gempabumi/autogempa").then((r) => r.json()),
            fetch("/api/bmkg/gempabumi/gempaterkini").then((r) => r.json()),
            fetch("/api/bmkg/gempabumi/gempadirasakan").then((r) => r.json()),
            fetch("/api/bmkg/cuaca/ntb").then((r) => r.json()),
            fetch("/api/bmkg/nowcasting/ntb").then((r) => r.json()),
            fetch("/api/bmkg/maritime/warning")
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
            fetch("/api/siaga/lapor")
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
          ]);

        const currentAuto: EarthquakeItem | null =
          autoRes?.Infogempa?.gempa || null;
        const recentList: EarthquakeItem[] = recentRes?.Infogempa?.gempa || [];
        const feltList: EarthquakeItem[] = feltRes?.Infogempa?.gempa || [];
        const regencyList: WeatherRegency[] = weatherRes?.regencies || [];

        setAutoGempa(currentAuto);
        setRecentQuakes(recentList);
        setFeltQuakes(feltList);
        setWeatherRegencies(regencyList);
        setNowcasting(nowcastRes);

        if (marineRes && marineRes.NTB && marineRes.NTB.data) {
          setMarineWarning(marineRes.NTB.data);
        } else {
          setMarineWarning(null);
        }

        setLastUpdated(
          new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) + " WITA",
        );

        // Check if new earthquake occurred since last poll
        if (currentAuto && currentAuto.DateTime) {
          if (
            !isInitial &&
            lastSeenQuakeTime &&
            lastSeenQuakeTime !== currentAuto.DateTime
          ) {
            triggerNewAlert({
              id: `quake-${Date.now()}`,
              type: "earthquake",
              title: `GEMPA TERKINI M ${currentAuto.Magnitude}`,
              message: `${currentAuto.Wilayah}. Kedalaman ${currentAuto.Kedalaman}. ${currentAuto.Potensi}`,
              severity: currentAuto.isNtbArea
                ? "SIAGA BENCANA NTB"
                : "PERINGATAN GEMPA BMKG",
              time: `${currentAuto.Tanggal} ${currentAuto.Jam}`,
              coords:
                currentAuto.parsedLat && currentAuto.parsedLng
                  ? [currentAuto.parsedLat, currentAuto.parsedLng]
                  : undefined,
            });
          }
          setLastSeenQuakeTime(currentAuto.DateTime);
        }

        // Check for new Laporan Masyarakat
        if (laporRes && Array.isArray(laporRes) && laporRes.length > 0) {
          const latestReport = laporRes[0];
          const reportId = latestReport.id || `${latestReport.title}-${latestReport.time}`;
          
          if (lastSeenLaporId !== reportId) {
            triggerNewAlert({
              id: `lapor-${Date.now()}`,
              type: "weather",
              title: "LAPORAN KEJADIAN MASYARAKAT",
              message: `Kejadian: ${latestReport.title}. Dilaporkan oleh: ${latestReport.user} pada ${latestReport.time}`,
              severity: "LAPORAN SIAGA NTB",
              time: latestReport.time,
            });
          }
          setLastSeenLaporId(reportId);
        }

      } catch (err) {
        console.error("Error fetching BMKG data:", err);
      } finally {
        setIsRefreshing(false);
      }
    },
    [lastSeenQuakeTime, lastSeenLaporId],
  );

  // Initial load
  useEffect(() => {
    fetchData(true);
  }, []);

  // Periodic polling every 45 seconds for real-time disaster updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Sound Toggle Handler
  const handleToggleSound = () => {
    const next = !isSoundEnabled;
    soundAlert.setEnabled(next);
    setIsSoundEnabled(next);
  };

  // Browser Notification Request
  const handleRequestNotification = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setHasNotificationPermission(perm === "granted");
      if (perm === "granted") {
        new Notification("SIAGA BENCANA NTB", {
          body: "Notifikasi real-time BMKG untuk Provinsi Nusa Tenggara Barat telah diaktifkan.",
          icon: "/favicon.ico",
        });
      }
    }
  };

  // Trigger New Disaster Alert (Audio + Browser Notification + UI Toast)
  const triggerNewAlert = (alertData: AlertToastData) => {
    setToast(alertData);

    // Audio alarm
    if (alertData.type === "earthquake") {
      soundAlert.playEarthquakeAlert(parseFloat(alertData.magnitude || "5.0"));
    } else {
      soundAlert.playWeatherAlert();
    }

    // Native browser push notification
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(alertData.title, {
        body: alertData.message,
      });
    }
  };

  // Simulation test button
  const handleTestAlert = () => {
    triggerNewAlert({
      id: `test-${Date.now()}`,
      type: "earthquake",
      title: "UJI NOTIFIKASI: GEMPA BUMI M 5.6",
      message:
        "Simulasi Sistem: Gempa bumi berkekuatan M 5.6 terpantau di 32 km Barat Daya Lombok Barat, Kedalaman 12 km. Tidak berpotensi tsunami.",
      magnitude: "5.6",
      severity: "UJI SISTEM REAL-TIME NTB",
      time: "Baru Saja",
      coords: [-8.7, 116.05],
    });
  };

  // Focus map on specific coordinate
  const handleFocusMap = (lat: number, lng: number) => {
    setActiveView("map");
    setSelectedRegency(null);
    setSelectedQuake({
      Tanggal: "",
      Jam: "",
      DateTime: "",
      Coordinates: `${lat},${lng}`,
      Lintang: "",
      Bujur: "",
      Magnitude: "",
      Kedalaman: "",
      Wilayah: "",
      Potensi: "",
      parsedLat: lat,
      parsedLng: lng,
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Bar Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
        hasNotificationPermission={hasNotificationPermission}
        onRequestNotification={handleRequestNotification}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchData(false)}
        onTestAlert={handleTestAlert}
        lastUpdated={lastUpdated}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 sm:p-4 gap-3 max-w-[1700px] w-full mx-auto">
        {/* Nowcasting Active Weather Alert Banner */}
        <NowcastingBanner alert={nowcasting} marineAlert={marineWarning} />

        {/* View Switcher: Map vs Weather vs Quakes vs Laravel vs Contacts */}
        {activeView === "map" && (
          <div className="flex-1 relative min-h-[550px] h-full rounded-xl overflow-hidden shadow-xl border border-slate-700">
            <DisasterMap
              autoGempa={autoGempa}
              recentQuakes={recentQuakes}
              weatherRegencies={weatherRegencies}
              volcanoes={volcanoes}
              districts={districts}
              selectedQuake={selectedQuake}
              onSelectQuake={(q) => setSelectedQuake(q)}
              selectedRegency={selectedRegency}
              onSelectRegency={(r) => setSelectedRegency(r)}
            />

            {/* Overlay Quake Panel */}
            <div className="absolute top-4 right-4 bottom-4 z-[400] flex flex-col pointer-events-none w-full max-w-[400px]">
              <EarthquakePanel
                autoGempa={autoGempa}
                recentQuakes={recentQuakes}
                feltQuakes={feltQuakes}
                selectedQuake={selectedQuake}
                onSelectQuake={(q) => setSelectedQuake(q)}
              />
            </div>
          </div>
        )}

        {activeView === "weather" && (
          <div className="flex-1 pb-6">
            <WeatherForecastPanel
              weatherRegencies={weatherRegencies}
              selectedRegency={selectedRegency}
              onSelectRegency={(r) => setSelectedRegency(r)}
              onFocusMap={handleFocusMap}
            />
          </div>
        )}

        {activeView === "quakes" && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[550px] pb-6">
            <div className="lg:col-span-6 h-[75vh]">
              <DisasterMap
                autoGempa={autoGempa}
                recentQuakes={recentQuakes}
                weatherRegencies={weatherRegencies}
                volcanoes={volcanoes}
                districts={districts}
                selectedQuake={selectedQuake}
                onSelectQuake={(q) => setSelectedQuake(q)}
                selectedRegency={selectedRegency}
                onSelectRegency={(r) => setSelectedRegency(r)}
              />
            </div>
            <div className="lg:col-span-6 h-[75vh]">
              <EarthquakePanel
                autoGempa={autoGempa}
                recentQuakes={recentQuakes}
                feltQuakes={feltQuakes}
                selectedQuake={selectedQuake}
                onSelectQuake={(q) => setSelectedQuake(q)}
              />
            </div>
          </div>
        )}

        {activeView === "laravel" && (
          <div className="flex-1 pb-6">
            <LaravelExportModal />
          </div>
        )}

        {activeView === "contacts" && (
          <div className="flex-1 pb-6">
            <EmergencyContactsModal districts={districts} />
          </div>
        )}
      </main>

      {/* Real-time Notification Toast */}
      <NotificationToast
        toast={toast}
        onClose={() => setToast(null)}
        onFocusMap={handleFocusMap}
      />
    </div>
  );
}
