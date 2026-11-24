import React from "react";
import {
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Code2,
  PhoneCall,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface NavbarProps {
  activeView: "map" | "weather" | "quakes" | "laravel" | "contacts";
  setActiveView: (
    view: "map" | "weather" | "quakes" | "laravel" | "contacts",
  ) => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  hasNotificationPermission: boolean;
  onRequestNotification: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onTestAlert: () => void;
  lastUpdated: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  isSoundEnabled,
  onToggleSound,
  hasNotificationPermission,
  onRequestNotification,
  isRefreshing,
  onRefresh,
  onTestAlert,
  lastUpdated,
}) => {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 shrink-0 z-30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
          <button
            onClick={() => setActiveView("map")}
            className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-sky-400 transition-colors whitespace-nowrap"
          >
            PUSDALOPS BPBD NTB
          </button>
        </div>

        {/* Zone 2: Navigation views with clean typography */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveView("map")}
            className={`transition-colors hover:text-white whitespace-nowrap pb-0.5 ${
              activeView === "map"
                ? "text-sky-400 border-b-2 border-sky-400 font-semibold"
                : ""
            }`}
          >
            Peta Monitoring NTB
          </button>

          <button
            onClick={() => setActiveView("weather")}
            className={`transition-colors hover:text-white whitespace-nowrap pb-0.5 ${
              activeView === "weather"
                ? "text-sky-400 border-b-2 border-sky-400 font-semibold"
                : ""
            }`}
          >
            Prakiraan Cuaca Kab/Kota
          </button>

          <button
            onClick={() => setActiveView("quakes")}
            className={`transition-colors hover:text-white whitespace-nowrap pb-0.5 ${
              activeView === "quakes"
                ? "text-sky-400 border-b-2 border-sky-400 font-semibold"
                : ""
            }`}
          >
            Daftar Gempa BMKG
          </button>

          <button
            onClick={() => setActiveView("contacts")}
            className={`transition-colors hover:text-white whitespace-nowrap pb-0.5 flex items-center gap-1.5 ${
              activeView === "contacts"
                ? "text-sky-400 border-b-2 border-sky-400 font-semibold"
                : ""
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Kontak Darurat NTB</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Audio Siren, Push Notif, Refresh, Test Alert) */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={
              isSoundEnabled
                ? "Sirine Darurat Aktif (Klik untuk Matikan)"
                : "Sirine Darurat Bisu (Klik untuk Aktifkan)"
            }
            className={`p-2 rounded-lg border transition-colors ${
              isSoundEnabled
                ? "bg-amber-950/40 border-amber-600/50 text-amber-300 hover:bg-amber-900/50"
                : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
          >
            {isSoundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Browser Notification Button */}
          <button
            onClick={onRequestNotification}
            title={
              hasNotificationPermission
                ? "Notifikasi Browser Aktif"
                : "Aktifkan Notifikasi Desktop"
            }
            className={`p-2 rounded-lg border transition-colors ${
              hasNotificationPermission
                ? "bg-sky-950/40 border-sky-600/50 text-sky-400 hover:bg-sky-900/50"
                : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
          >
            {hasNotificationPermission ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>

          {/* Refresh Data Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title={`Diperbarui: ${lastUpdated || "Baru saja"}`}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-sky-400" : ""}`}
            />
          </button>

          {/* Test Alert Button */}
          <button
            onClick={onTestAlert}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white shadow transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Uji Notifikasi</span>
            <span className="sm:hidden">Uji</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-slate-800/60 bg-slate-950 text-xs font-medium">
        <button
          onClick={() => setActiveView("map")}
          className={`py-1 px-2 rounded ${activeView === "map" ? "bg-sky-600/30 text-sky-400" : "text-slate-400"}`}
        >
          Peta
        </button>
        <button
          onClick={() => setActiveView("weather")}
          className={`py-1 px-2 rounded ${activeView === "weather" ? "bg-sky-600/30 text-sky-400" : "text-slate-400"}`}
        >
          Cuaca NTB
        </button>
        <button
          onClick={() => setActiveView("quakes")}
          className={`py-1 px-2 rounded ${activeView === "quakes" ? "bg-sky-600/30 text-sky-400" : "text-slate-400"}`}
        >
          Gempa
        </button>
        <button
          onClick={() => setActiveView("contacts")}
          className={`py-1 px-2 rounded ${activeView === "contacts" ? "bg-sky-600/30 text-sky-400" : "text-slate-400"}`}
        >
          Kontak
        </button>
      </div>
    </header>
  );
};
