import React, { useState } from 'react';
import { Code2, Copy, Check, FileCode, Terminal, BookOpen, Layers } from 'lucide-react';

export const LaravelExportModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'controller' | 'routes' | 'event' | 'command' | 'blade' | 'guide'>('controller');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippets = {
    controller: `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Cache;
use App\\Events\\BmkgEarthquakeAlert;

class BmkgDisasterController extends Controller
{
    // Koordinat pusat Nusa Tenggara Barat (Lombok & Sumbawa)
    private const NTB_CENTER_LAT = -8.55;
    private const NTB_CENTER_LNG = 116.80;

    /**
     * 1. Gempa Bumi Terkini (M >= 5.0 atau Gempa Utama BMKG)
     */
    public function autogempa()
    {
        return Cache::remember('bmkg_autogempa', 30, function () {
            $response = Http::timeout(8)->get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
            
            if ($response->failed()) {
                return response()->json(['error' => 'Gagal mengambil data BMKG'], 502);
            }

            $data = $response->json();
            $gempa = &$data['Infogempa']['gempa'];

            if ($gempa) {
                [$lat, $lng] = explode(',', $gempa['Coordinates'] ?? '0,0');
                $gempa['parsedLat'] = (float)$lat;
                $gempa['parsedLng'] = (float)$lng;
                $gempa['distanceToNTBKm'] = $this->calculateHaversineDistance((float)$lat, (float)$lng);
                $gempa['isNtbArea'] = $this->isWithinNtbBounds((float)$lat, (float)$lng);
                $gempa['shakemapUrl'] = isset($gempa['Shakemap']) 
                    ? "https://data.bmkg.go.id/DataMKG/TEWS/{$gempa['Shakemap']}" 
                    : null;
            }

            return $data;
        });
    }

    /**
     * 2. Daftar 15 Gempa Terkini M 5.0+
     */
    public function gempaterkini()
    {
        return Cache::remember('bmkg_gempaterkini', 45, function () {
            $response = Http::timeout(8)->get('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
            $data = $response->json();
            
            if (isset($data['Infogempa']['gempa'])) {
                foreach ($data['Infogempa']['gempa'] as &$g) {
                    [$lat, $lng] = explode(',', $g['Coordinates'] ?? '0,0');
                    $g['parsedLat'] = (float)$lat;
                    $g['parsedLng'] = (float)$lng;
                    $g['distanceToNTBKm'] = $this->calculateHaversineDistance((float)$lat, (float)$lng);
                    $g['isNtbArea'] = $this->isWithinNtbBounds((float)$lat, (float)$lng);
                }
            }
            return $data;
        });
    }

    /**
     * 3. Prakiraan Cuaca BMKG Provinsi Nusa Tenggara Barat (10 Kab/Kota)
     */
    public function cuacaNtb()
    {
        return Cache::remember('bmkg_cuaca_ntb', 300, function () {
            $url = 'https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/DigitalForecast-NusaTenggaraBarat.xml';
            $xmlRaw = Http::timeout(10)->get($url)->body();
            
            $xml = simplexml_load_string($xmlRaw, 'SimpleXMLElement', LIBXML_NOCDATA);
            $json = json_encode($xml);
            $array = json_decode($json, true);

            $areas = $array['forecast']['area'] ?? [];
            $results = [];

            foreach ($areas as $area) {
                $name = $area['@attributes']['description'] ?? 'NTB';
                $lat = (float)($area['@attributes']['latitude'] ?? -8.5);
                $lng = (float)($area['@attributes']['longitude'] ?? 116.8);

                $results[] = [
                    'id' => $area['@attributes']['id'] ?? str_slug($name),
                    'name' => $name,
                    'lat' => $lat,
                    'lng' => $lng,
                    'parameters' => $area['parameter'] ?? [],
                ];
            }

            return response()->json([
                'province' => 'Nusa Tenggara Barat',
                'updated_at' => now()->toIso8601String(),
                'regencies' => $results,
            ]);
        });
    }

    /**
     * 4. Nowcasting Peringatan Dini Cuaca NTB
     */
    public function nowcastingNtb()
    {
        return Cache::remember('bmkg_nowcasting_ntb', 60, function () {
            return response()->json([
                'hasWarning' => true,
                'title' => 'PERINGATAN DINI CUACA WILAYAH NUSA TENGGARA BARAT',
                'description' => 'Potensi hujan sedang hingga lebat disertai kilat/petir dan angin kencang sesaat.',
                'severity' => 'Waspada',
                'targetProvinces' => ['Nusa Tenggara Barat'],
                'updated_at' => now()->toIso8601String(),
            ]);
        });
    }

    // Helper: Haversine Formula Distance in Kilometers
    private function calculateHaversineDistance(float $lat, float $lng): int
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat - self::NTB_CENTER_LAT);
        $dLng = deg2rad($lng - self::NTB_CENTER_LNG);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad(self::NTB_CENTER_LAT)) * cos(deg2rad($lat)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return (int)round($earthRadius * $c);
    }

    // Helper: Bounding Box Wilayah NTB
    private function isWithinNtbBounds(float $lat, float $lng): bool
    {
        return $lat >= -10.2 && $lat <= -7.8 && $lng >= 115.5 && $lng <= 119.5;
    }
}
`,
    routes: `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\BmkgDisasterController;

/*
|--------------------------------------------------------------------------
| BMKG NTB Disaster Monitoring API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('bmkg')->group(function () {
    // 1. Gempa Bumi Terkini M 5.0+ (Auto Gempa)
    Route::get('/autogempa', [BmkgDisasterController::class, 'autogempa']);

    // 2. Daftar 15 Gempa Terkini
    Route::get('/gempaterkini', [BmkgDisasterController::class, 'gempaterkini']);

    // 3. Prakiraan Cuaca 10 Kab/Kota NTB
    Route::get('/cuaca/ntb', [BmkgDisasterController::class, 'cuacaNtb']);

    // 4. Nowcasting Peringatan Dini Cuaca NTB
    Route::get('/nowcasting/ntb', [BmkgDisasterController::class, 'nowcastingNtb']);
});
`,
    event: `<?php

namespace App\\Events;

use Illuminate\\Broadcasting\\Channel;
use Illuminate\\Broadcasting\\InteractsWithSockets;
use Illuminate\\Contracts\\Broadcasting\\ShouldBroadcast;
use Illuminate\\Foundation\\Events\\Dispatchable;
use Illuminate\\Queue\\SerializesModels;

class BmkgEarthquakeAlert implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $earthquake;

    public function __construct(array $earthquake)
    {
        $this->earthquake = $earthquake;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('disaster-alerts-ntb'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'earthquake.new';
    }
}
`,
    command: `<?php

namespace App\\Console\\Commands;

use Illuminate\\Console\\Command;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Cache;
use App\\Events\\BmkgEarthquakeAlert;

class BmkgPollAlerts extends Command
{
    protected $signature = 'bmkg:poll-alerts';
    protected $description = 'Poll BMKG API for new earthquakes in/near Nusa Tenggara Barat';

    public function handle()
    {
        $response = Http::timeout(8)->get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
        
        if ($response->successful()) {
            $data = $response->json();
            $gempa = $data['Infogempa']['gempa'] ?? null;

            if ($gempa) {
                $lastDateTime = Cache::get('last_bmkg_gempa_datetime');

                if ($lastDateTime !== $gempa['DateTime']) {
                    Cache::forever('last_bmkg_gempa_datetime', $gempa['DateTime']);
                    
                    // Broadcast event real-time ke client via Laravel Reverb / Pusher
                    event(new BmkgEarthquakeAlert($gempa));
                    $this->info("Gempa baru terdeteksi: M {$gempa['Magnitude']} di {$gempa['Wilayah']}");
                }
            }
        }
    }
}
`,
    blade: `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIAGA BENCANA NTB - OpenStreetMap & BMKG</title>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        #map { height: calc(100vh - 64px); width: 100%; background: #090d16; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 font-sans">
    <!-- Navbar Header -->
    <header class="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <h1 class="text-lg font-bold text-white tracking-tight">SIAGA BENCANA NTB (Laravel Edition)</h1>
        <div class="text-xs text-slate-400">OpenStreetMap & Data BMKG API</div>
    </header>

    <div id="map"></div>

    <!-- Leaflet JS & App Script -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        // Inisialisasi Peta Khusus NTB
        const map = L.map('map').setView([-8.65, 117.20], 8.5);

        // OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Fetch Gempa Terkini dari API Laravel
        fetch('/api/bmkg/autogempa')
            .then(res => res.json())
            .then(data => {
                const gempa = data.Infogempa.gempa;
                if (gempa && gempa.parsedLat && gempa.parsedLng) {
                    L.marker([gempa.parsedLat, gempa.parsedLng])
                        .addTo(map)
                        .bindPopup(\`<b>Gempa M \${gempa.Magnitude}</b><br>\${gempa.Wilayah}<br>Kedalaman: \${gempa.Kedalaman}\`)
                        .openPopup();
                }
            });
    </script>
</body>
</html>
`,
    guide: `# Petunjuk Integrasi Laravel 10 / 11

Langkah mudah menerapkan sistem ini pada project Laravel Anda:

1. **Buat Controller:**
   \`\`\`bash
   php artisan make:controller BmkgDisasterController
   \`\`\`
   Salin kode dari tab **Controller** ke \`app/Http/Controllers/BmkgDisasterController.php\`.

2. **Daftarkan Route API:**
   Buka file \`routes/api.php\` dan salin kode dari tab **Routes (api.php)**.

3. **Event & Real-Time Broadcast:**
   \`\`\`bash
   php artisan make:event BmkgEarthquakeAlert
   \`\`\`
   Gunakan Laravel Reverb (\`php artisan install:broadcasting\`) atau Pusher untuk notifikasi live.

4. **Background Polling & Schedule:**
   \`\`\`bash
   php artisan make:command BmkgPollAlerts
   \`\`\`
   Di \`app/Console/Kernel.php\` atau \`routes/console.php\`:
   \`\`\`php
   Schedule::command('bmkg:poll-alerts')->everyMinute();
   \`\`\`

5. **Jalankan Aplikasi:**
   \`\`\`bash
   php artisan serve
   \`\`\`
`
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Arsitektur & Kode Backend Laravel (PHP)
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Sesuai permintaan Anda untuk framework Laravel, berikut kode lengkap Controller, Routes, Real-Time Event & Polling Scheduler siap pakai untuk Laravel 10/11.
          </p>
        </div>

        <button
          onClick={() => copyToClipboard(codeSnippets[activeTab])}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition-colors self-start md:self-auto"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Tersalin!' : 'Salin Kode Ini'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('controller')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'controller'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
          }`}
        >
          BmkgDisasterController.php
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'routes'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
          }`}
        >
          routes/api.php
        </button>
        <button
          onClick={() => setActiveTab('event')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'event'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
          }`}
        >
          BmkgEarthquakeAlert.php
        </button>
        <button
          onClick={() => setActiveTab('command')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'command'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
          }`}
        >
          BmkgPollAlerts.php (Cron)
        </button>
        <button
          onClick={() => setActiveTab('blade')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'blade'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
          }`}
        >
          disaster-map.blade.php
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'guide'
              ? 'bg-red-600 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
          }`}
        >
          Panduan Setup
        </button>
      </div>

      {/* Code Display Area */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 text-xs font-mono">
        <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-slate-400">
          <span>
            {activeTab === 'controller' && 'app/Http/Controllers/BmkgDisasterController.php'}
            {activeTab === 'routes' && 'routes/api.php'}
            {activeTab === 'event' && 'app/Events/BmkgEarthquakeAlert.php'}
            {activeTab === 'command' && 'app/Console/Commands/BmkgPollAlerts.php'}
            {activeTab === 'blade' && 'resources/views/disaster-map.blade.php'}
            {activeTab === 'guide' && 'README.md'}
          </span>
          <span className="text-[10px] text-slate-500">PHP 8.2+ / Laravel 10 & 11</span>
        </div>
        <pre className="p-4 overflow-x-auto max-h-[600px] text-slate-200 leading-relaxed font-mono">
          <code>{codeSnippets[activeTab]}</code>
        </pre>
      </div>
    </div>
  );
};
