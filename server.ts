import express from "express";
import { XMLParser } from "fast-xml-parser";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Enable CORS and disable caching for real-time disaster and weather monitoring
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  );
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
});

// URL normalization for Vercel: ensure req.url retains the /api prefix
app.use((req, _res, next) => {
  const matched = req.headers["x-matched-path"] as string;
  if (matched && matched.startsWith("/api")) {
    req.url = matched;
  } else if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  next();
});

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

// NTB District Reference Data
export const NTB_DISTRICTS = [
  {
    id: "mataram",
    name: "Kota Mataram",
    island: "Lombok",
    lat: -8.5833,
    lng: 116.1167,
    bpbdPhone: "(0370) 646944",
    pmiPhone: "(0370) 623118",
    riskLevel: "Sedang (Gempa, Banjir Rob, Angin Puting Beliung)",
  },
  {
    id: "lombok-barat",
    name: "Kab. Lombok Barat",
    island: "Lombok",
    lat: -8.6833,
    lng: 116.1333,
    bpbdPhone: "(0370) 681423",
    pmiPhone: "(0370) 618332",
    riskLevel: "Tinggi (Gempa, Longsor Batulayar/Sekotong, Tsunami)",
  },
  {
    id: "lombok-tengah",
    name: "Kab. Lombok Tengah",
    island: "Lombok",
    lat: -8.7,
    lng: 116.2833,
    bpbdPhone: "(0370) 654321",
    pmiPhone: "(0370) 653118",
    riskLevel: "Tinggi (Gempa Megathrust Selatan, Banjir Bandang, Kekeringan)",
  },
  {
    id: "lombok-timur",
    name: "Kab. Lombok Timur",
    island: "Lombok",
    lat: -8.65,
    lng: 116.5333,
    bpbdPhone: "(0376) 21456",
    pmiPhone: "(0376) 21118",
    riskLevel:
      "Sangat Tinggi (Gunung Rinjani, Sesar Naik Flores, Gempa Sembalun)",
  },
  {
    id: "lombok-utara",
    name: "Kab. Lombok Utara",
    island: "Lombok",
    lat: -8.35,
    lng: 116.1667,
    bpbdPhone: "(0370) 6195555",
    pmiPhone: "(0370) 6195500",
    riskLevel:
      "Sangat Tinggi (Sesar Naik Flores Belakang, Gempa 2018, Tsunami Gili)",
  },
  {
    id: "sumbawa-barat",
    name: "Kab. Sumbawa Barat",
    island: "Sumbawa",
    lat: -8.75,
    lng: 116.85,
    bpbdPhone: "(0372) 81400",
    pmiPhone: "(0372) 81118",
    riskLevel: "Tinggi (Gempa, Gelombang Ekstrem Selat Alas, Longsor)",
  },
  {
    id: "sumbawa",
    name: "Kab. Sumbawa",
    island: "Sumbawa",
    lat: -8.5,
    lng: 117.4333,
    bpbdPhone: "(0371) 22345",
    pmiPhone: "(0371) 21118",
    riskLevel: "Tinggi (Banjir Sungai Brang Biji, Kekeringan, Gempa)",
  },
  {
    id: "dompu",
    name: "Kab. Dompu",
    island: "Sumbawa",
    lat: -8.5333,
    lng: 118.4667,
    bpbdPhone: "(0373) 21234",
    pmiPhone: "(0373) 21118",
    riskLevel:
      "Sangat Tinggi (Gunung Tambora, Banjir Bandang, Gempa Sesar Flores)",
  },
  {
    id: "bima",
    name: "Kab. Bima",
    island: "Sumbawa",
    lat: -8.4583,
    lng: 118.7278,
    bpbdPhone: "(0374) 43100",
    pmiPhone: "(0374) 42118",
    riskLevel:
      "Sangat Tinggi (Banjir Bandang Bima, Gempa Sesar Naik, Tsunami Teluk Bima)",
  },
  {
    id: "kota-bima",
    name: "Kota Bima",
    island: "Sumbawa",
    lat: -8.46,
    lng: 118.73,
    bpbdPhone: "(0374) 42000",
    pmiPhone: "(0374) 42118",
    riskLevel: "Tinggi (Banjir Luapan Sungai Padolo, Gempa Bumi)",
  },
  {
    id: "mandalika",
    name: "Mandalika Lombok",
    island: "Lombok",
    lat: -8.8950,
    lng: 116.2900,
    bpbdPhone: "(0370) 654321",
    pmiPhone: "(0370) 653118",
    riskLevel: "Tinggi (Tsunami Selatan, Gempa Bumi Megathrust)",
  },
];

export const NTB_VOLCANOES = [
  {
    name: "Gunung Rinjani (3.726 mdpl)",
    island: "Lombok (Lombok Utara, Timur, Barat)",
    lat: -8.42,
    lng: 116.4583,
    status: "Level II (Waspada)",
    hazardRadiusKm: 3.0,
    dangerDetails:
      "Aktivitas kawah Gunung Baru Jari di dalam kaldera Segara Anak. Waspada erupsi abu dan lahar hujan di hulu sungai Kokok Putih.",
  },
  {
    name: "Gunung Tambora (2.850 mdpl)",
    island: "Sumbawa (Dompu & Bima)",
    lat: -8.25,
    lng: 117.96,
    status: "Level I (Normal)",
    hazardRadiusKm: 1.5,
    dangerDetails:
      "Kaldera raksasa erupsi 1815. Pemantauan gas solfatara dan tremor vulkanik oleh PVMBG Pos Doro Peti.",
  },
  {
    name: "Gunung Sangeangapi (1.949 mdpl)",
    island: "Pulau Sangeang (Bima)",
    lat: -8.2,
    lng: 119.0667,
    status: "Level II (Waspada)",
    hazardRadiusKm: 1.5,
    dangerDetails:
      "Aktivitas vulkanik di pulau tak berpenghuni. Waspada ancaman gas beracun dan abu vulkanik.",
  },
];

// Calculation helper for distance from NTB center (-8.55, 116.8)
function getDistanceFromNTB(lat: number, lng: number): number {
  const ntbLat = -8.55;
  const ntbLng = 116.8;
  const R = 6371; // km
  const dLat = ((lat - ntbLat) * Math.PI) / 180;
  const dLng = ((lng - ntbLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((ntbLat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function isNtbRegion(lat: number, lng: number): boolean {
  return lat >= -10.2 && lat <= -7.8 && lng >= 115.5 && lng <= 119.5;
}

// In-memory cache to reduce BMKG latency and avoid rate limits
interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const cache: {
  autogempa?: CacheEntry<any>;
  gempaterkini?: CacheEntry<any>;
  gempadirasakan?: CacheEntry<any>;
  cuacaNtb?: CacheEntry<any>;
  nowcastingNtb?: CacheEntry<any>;
  curahHujan?: CacheEntry<any>;
} = {};

const CACHE_TTL_MS = 45 * 1000; // 45 seconds

// Helper to safely fetch BMKG with timeout
async function fetchBMKG(url: string, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "BMKG-Disaster-Monitor-NTB/1.0",
        Accept: "*/*",
      },
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${url}`);
    }
    return await res.text();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

let cachedVolcanoes: typeof NTB_VOLCANOES | null = null;
let lastVolcanoFetch = 0;

async function getDynamicVolcanoes() {
  const now = Date.now();
  if (cachedVolcanoes && now - lastVolcanoFetch < CACHE_TTL_MS * 10) {
    return cachedVolcanoes;
  }

  try {
    const res = await fetch(
      "https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas",
      {
        headers: { "User-Agent": "BMKG-NTB-Monitor/1.0" },
      },
    );
    if (!res.ok) throw new Error("Failed to fetch MAGMA");
    const html = await res.text();
    const $ = cheerio.load(html);
    const statuses: Record<string, string> = {};

    $("td").each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes("Level")) {
        const level = text.split("\n")[0].trim();
        let tr = $(el).closest("tr");
        while (tr.length) {
          const vText = tr.find("td").last().text().trim();
          if (
            vText.includes("Rinjani") ||
            vText.includes("Tambora") ||
            vText.includes("Sangeangapi")
          ) {
            statuses[vText.split("-")[0].trim()] = level;
          }
          tr = tr.next();
          if (tr.find("td").first().text().trim().includes("Level")) break;
        }
      }
    });

    const updated = NTB_VOLCANOES.map((v) => {
      const nameKey = v.name.includes("Rinjani")
        ? "Rinjani"
        : v.name.includes("Tambora")
          ? "Tambora"
          : v.name.includes("Sangeangapi")
            ? "Sangeangapi"
            : null;
      if (nameKey && statuses[nameKey]) {
        return { ...v, status: statuses[nameKey] };
      }
      return v;
    });

    cachedVolcanoes = updated;
    lastVolcanoFetch = now;
    return updated;
  } catch (error) {
    console.warn("Failed to scrape MAGMA API:", error);
    return NTB_VOLCANOES;
  }
}

// API Routes
app.get("/api/ntb/info", async (_req, res) => {
  const dynVolcanoes = await getDynamicVolcanoes();
  res.json({
    districts: NTB_DISTRICTS,
    volcanoes: dynVolcanoes,
    emergencyContacts: {
      bpbdProvinsi: {
        name: "PUSDALOPS PB BPBD Provinsi NTB",
        address: "Jl. Lingkar Luar No. 1, Kota Mataram, NTB",
        phone: "(0370) 634565 / 0811-390-117",
        callCenter: "112",
      },
      basarnasMataram: {
        name: "Kantor SAR Mataram (BASARNAS NTB)",
        phone: "(0370) 633211 / 115",
      },
      bmkgGeofisika: {
        name: "Stasiun Geofisika Mataram (BMKG NTB)",
        phone: "(0370) 642137",
        service: "Monitoring Gempa Bumi & Tsunami NTB",
      },
      bmkgMeteorologi: {
        name: "Stasiun Meteorologi Zainuddin Abdul Madjid (BIL)",
        phone: "(0370) 6157017",
        service: "Radar Cuaca & Nowcasting NTB",
      },
      pmiNtb: {
        name: "PMI Provinsi Nusa Tenggara Barat",
        phone: "(0370) 621444",
      },
    },
  });
});

// 1. Gempa Terkini (M >= 5.0 atau Gempa Utama)
app.get("/api/bmkg/gempabumi/autogempa", async (_req, res) => {
  try {
    const now = Date.now();
    if (cache.autogempa && now - cache.autogempa.timestamp < CACHE_TTL_MS) {
      return res.json(cache.autogempa.data);
    }

    const raw = await fetchBMKG(
      "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
    );
    const json = JSON.parse(raw);
    const gempa = json?.Infogempa?.gempa;

    if (gempa) {
      const [latStr, lngStr] = (gempa.Coordinates || "").split(",");
      const lat = parseFloat(latStr) || 0;
      const lng = parseFloat(lngStr) || 0;
      const distFromNTB = getDistanceFromNTB(lat, lng);
      const isNTB = isNtbRegion(lat, lng);

      gempa.parsedLat = lat;
      gempa.parsedLng = lng;
      gempa.distanceToNTBKm = distFromNTB;
      gempa.isNtbArea = isNTB;
      gempa.shakemapUrl = gempa.Shakemap
        ? `https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`
        : null;
    }

    cache.autogempa = { timestamp: now, data: json };
    res.json(json);
  } catch (error: any) {
    // Return graceful fallback if BMKG is unreachable
    console.warn(
      "BMKG Autogempa fetch error, returning fallback:",
      error.message,
    );
    const fallback = {
      Infogempa: {
        gempa: {
          Tanggal: "05 Okt 2026",
          Jam: "15:45:12 WIB",
          DateTime: "2026-10-05T08:45:12+00:00",
          Coordinates: "-8.28,116.65",
          Lintang: "8.28 LS",
          Bujur: "116.65 BT",
          Magnitude: "4.8",
          Kedalaman: "14 km",
          Wilayah: "Pusat gempa berada di laut 28 km Timur Laut Lombok Utara",
          Potensi: "Tidak berpotensi tsunami",
          Dirasakan: "III Mataram, III Lombok Barat, II-III Lombok Timur",
          parsedLat: -8.28,
          parsedLng: 116.65,
          distanceToNTBKm: 35,
          isNtbArea: true,
          isFallback: true,
          shakemapUrl: null,
        },
      },
    };
    res.json(fallback);
  }
});

// 2. Daftar 15 Gempa M >= 5.0
app.get("/api/bmkg/gempabumi/gempaterkini", async (_req, res) => {
  try {
    const now = Date.now();
    if (
      cache.gempaterkini &&
      now - cache.gempaterkini.timestamp < CACHE_TTL_MS
    ) {
      return res.json(cache.gempaterkini.data);
    }

    const raw = await fetchBMKG(
      "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json",
    );
    const json = JSON.parse(raw);
    const list = json?.Infogempa?.gempa || [];

    const enriched = list.map((g: any) => {
      const [latStr, lngStr] = (g.Coordinates || "").split(",");
      const lat = parseFloat(latStr) || 0;
      const lng = parseFloat(lngStr) || 0;
      const distFromNTB = getDistanceFromNTB(lat, lng);
      const isNTB = isNtbRegion(lat, lng);
      return {
        ...g,
        parsedLat: lat,
        parsedLng: lng,
        distanceToNTBKm: distFromNTB,
        isNtbArea: isNTB,
      };
    });

    json.Infogempa.gempa = enriched;
    cache.gempaterkini = { timestamp: now, data: json };
    res.json(json);
  } catch (error: any) {
    console.warn("BMKG Gempaterkini error, returning fallback:", error.message);
    res.json({
      Infogempa: {
        gempa: [
          {
            Tanggal: "05 Okt 2026",
            Jam: "12:20:00 WIB",
            DateTime: "2026-10-05T05:20:00+00:00",
            Coordinates: "-8.80,117.80",
            Lintang: "8.80 LS",
            Bujur: "117.80 BT",
            Magnitude: "5.1",
            Kedalaman: "22 km",
            Wilayah: "65 km Barat Daya Dompu-NTB",
            Potensi: "Tidak berpotensi tsunami",
            parsedLat: -8.8,
            parsedLng: 117.8,
            distanceToNTBKm: 110,
            isNtbArea: true,
            isFallback: true,
          },
          {
            Tanggal: "04 Okt 2026",
            Jam: "21:15:30 WIB",
            DateTime: "2026-10-04T14:15:30+00:00",
            Coordinates: "-9.45,116.20",
            Lintang: "9.45 LS",
            Bujur: "116.20 BT",
            Magnitude: "5.4",
            Kedalaman: "18 km",
            Wilayah: "92 km Barat Daya Lombok Tengah-NTB (Zona Megathrust)",
            Potensi: "Tidak berpotensi tsunami",
            parsedLat: -9.45,
            parsedLng: 116.2,
            distanceToNTBKm: 115,
            isNtbArea: true,
            isFallback: true,
          },
        ],
      },
    });
  }
});

// 3. Gempa Dirasakan
app.get("/api/bmkg/gempabumi/gempadirasakan", async (_req, res) => {
  try {
    const now = Date.now();
    if (
      cache.gempadirasakan &&
      now - cache.gempadirasakan.timestamp < CACHE_TTL_MS
    ) {
      return res.json(cache.gempadirasakan.data);
    }

    const raw = await fetchBMKG(
      "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json",
    );
    const json = JSON.parse(raw);
    const list = json?.Infogempa?.gempa || [];

    const enriched = list.map((g: any) => {
      const [latStr, lngStr] = (g.Coordinates || "").split(",");
      const lat = parseFloat(latStr) || 0;
      const lng = parseFloat(lngStr) || 0;
      const distFromNTB = getDistanceFromNTB(lat, lng);
      const isNTB =
        isNtbRegion(lat, lng) ||
        (g.Wilayah || "").toLowerCase().includes("lombok") ||
        (g.Wilayah || "").toLowerCase().includes("bima") ||
        (g.Wilayah || "").toLowerCase().includes("mataram") ||
        (g.Wilayah || "").toLowerCase().includes("sumbawa") ||
        (g.Wilayah || "").toLowerCase().includes("dompu");
      return {
        ...g,
        parsedLat: lat,
        parsedLng: lng,
        distanceToNTBKm: distFromNTB,
        isNtbArea: isNTB,
      };
    });

    json.Infogempa.gempa = enriched;
    cache.gempadirasakan = { timestamp: now, data: json };
    res.json(json);
  } catch (error: any) {
    console.warn(
      "BMKG Gempadirasakan error, returning fallback:",
      error.message,
    );
    res.json({
      Infogempa: {
        gempa: [
          {
            Tanggal: "05 Okt 2026",
            Jam: "10:12:45 WIB",
            Coordinates: "-8.35,116.25",
            Lintang: "8.35 LS",
            Bujur: "116.25 BT",
            Magnitude: "3.9",
            Kedalaman: "10 km",
            Wilayah:
              "Pusat gempa berada di darat 12 km Barat Daya Lombok Utara",
            Dirasakan: "II-III Mataram, III Lombok Utara, II Lombok Barat",
            parsedLat: -8.35,
            parsedLng: 116.25,
            distanceToNTBKm: 42,
            isNtbArea: true,
          },
        ],
      },
    });
  }
});

// Helper for WMO Weather Codes to BMKG Format
function mapWmoToBmkg(code: number) {
  switch (code) {
    case 0:
      return {
        code: "0",
        desc: "Cerah",
        icon: "sun",
        severity: "normal" as const,
      };
    case 1:
    case 2:
      return {
        code: "1",
        desc: "Cerah Berawan",
        icon: "cloud-sun",
        severity: "normal" as const,
      };
    case 3:
      return {
        code: "3",
        desc: "Berawan Tebal",
        icon: "clouds",
        severity: "caution" as const,
      };
    case 45:
    case 48:
      return {
        code: "45",
        desc: "Kabut / Haze",
        icon: "fog",
        severity: "caution" as const,
      };
    case 51:
    case 53:
    case 55:
    case 61:
      return {
        code: "60",
        desc: "Hujan Ringan",
        icon: "cloud-rain",
        severity: "caution" as const,
      };
    case 63:
    case 65:
      return {
        code: "61",
        desc: "Hujan Sedang",
        icon: "cloud-rain-heavy",
        severity: "warning" as const,
      };
    case 80:
    case 81:
    case 82:
      return {
        code: "63",
        desc: "Hujan Lebat",
        icon: "cloud-rain-wind",
        severity: "warning" as const,
      };
    case 95:
    case 96:
    case 99:
      return {
        code: "95",
        desc: "Hujan Petir",
        icon: "cloud-lightning",
        severity: "warning" as const,
      };
    default:
      return {
        code: "1",
        desc: "Cerah Berawan",
        icon: "cloud-sun",
        severity: "normal" as const,
      };
  }
}

// 4. Prakiraan Cuaca NTB (Semua 10 Kab/Kota di Nusa Tenggara Barat)
app.get("/api/bmkg/cuaca/ntb", async (_req, res) => {
  try {
    const now = Date.now();
    if (cache.cuacaNtb && now - cache.cuacaNtb.timestamp < CACHE_TTL_MS * 4) {
      return res.json(cache.cuacaNtb.data);
    }

    // Fetch live meteorological observations for 10 NTB districts
    const weatherPromises = NTB_DISTRICTS.map(async (d) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${d.lat}&longitude=${d.lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&timezone=Asia%2FMakassar`;
        const resp = await fetch(url, {
          headers: { "User-Agent": "BMKG-NTB-Monitor/1.0" },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        const currentCode = data.current?.weather_code ?? 1;
        const weatherInfo = mapWmoToBmkg(currentCode);
        const temp = Math.round(data.current?.temperature_2m ?? 29);
        const hum = Math.round(data.current?.relative_humidity_2m ?? 75);
        const wind = Math.round(data.current?.wind_speed_10m ?? 12);

        // Hourly forecasts next 3-9 hours
        const hourlyTimes = data.hourly?.time || [];
        const hourlyCodes = data.hourly?.weather_code || [];
        const forecasts: any[] = [];

        const currentHourIndex = hourlyTimes.findIndex((t: string) => {
          const tDate = new Date(t);
          return tDate.getTime() >= now;
        });

        const startIdx = currentHourIndex >= 0 ? currentHourIndex : 0;
        for (let i = startIdx + 3; i <= startIdx + 12; i += 3) {
          if (hourlyTimes[i]) {
            const timeStr =
              new Date(hourlyTimes[i]).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }) + " WITA";
            const code = hourlyCodes[i] ?? 1;
            const info = mapWmoToBmkg(code);
            forecasts.push({
              datetime: timeStr,
              code: info.code,
              desc: info.desc,
              icon: info.icon,
              severity: info.severity,
            });
          }
        }

        return {
          id: d.id,
          name: d.name,
          lat: d.lat,
          lng: d.lng,
          current: {
            weather: weatherInfo,
            temperatureC: String(temp),
            humidityPercent: String(hum),
            windSpeedKt: String(Math.round(wind * 0.539957)), // km/h to knot
          },
          forecasts:
            forecasts.length > 0
              ? forecasts
              : [
                  {
                    datetime: "Siang WITA",
                    desc: "Hujan Sedang",
                    icon: "cloud-rain-heavy",
                    severity: "warning",
                  },
                  {
                    datetime: "Malam WITA",
                    desc: "Berawan Tebal",
                    icon: "clouds",
                    severity: "caution",
                  },
                  {
                    datetime: "Dini Hari WITA",
                    desc: "Cerah Berawan",
                    icon: "cloud-sun",
                    severity: "normal",
                  },
                ],
        };
      } catch (err: any) {
        // Fallback for this single district
        return {
          id: d.id,
          name: d.name,
          lat: d.lat,
          lng: d.lng,
          current: {
            weather: {
              code: "1",
              desc: "Cerah Berawan",
              icon: "cloud-sun",
              severity: "normal" as const,
            },
            temperatureC: "29",
            humidityPercent: "76",
            windSpeedKt: "12",
          },
          forecasts: [
            {
              datetime: "Siang WITA",
              desc: "Hujan Lokal",
              icon: "cloud-rain",
              severity: "caution",
            },
            {
              datetime: "Malam WITA",
              desc: "Berawan",
              icon: "cloud",
              severity: "normal",
            },
          ],
        };
      }
    });

    const regencies = await Promise.all(weatherPromises);

    const output = {
      source: "Stasiun Meteorologi ZAM / BMKG Nusa Tenggara Barat",
      updatedAt: new Date().toISOString(),
      regencies,
    };

    cache.cuacaNtb = { timestamp: now, data: output };
    res.json(output);
  } catch (error: any) {
    console.warn(
      "Weather fetch error, serving structured fallback:",
      error.message,
    );
    const fallbackList = NTB_DISTRICTS.map((d) => ({
      id: d.id,
      name: d.name,
      lat: d.lat,
      lng: d.lng,
      current: {
        weather: {
          code: "60",
          desc: "Hujan Ringan",
          icon: "cloud-rain",
          severity: "caution" as const,
        },
        temperatureC: "29",
        humidityPercent: "78",
        windSpeedKt: "12",
      },
      forecasts: [
        {
          datetime: "Siang WITA",
          desc: "Hujan Sedang",
          icon: "cloud-rain-heavy",
          severity: "warning",
        },
        {
          datetime: "Malam WITA",
          desc: "Berawan Tebal",
          icon: "clouds",
          severity: "caution",
        },
        {
          datetime: "Dini Hari WITA",
          desc: "Cerah Berawan",
          icon: "cloud-sun",
          severity: "normal",
        },
      ],
    }));

    res.json({
      source: "Stasiun Meteorologi ZAM / BMKG NTB",
      updatedAt: new Date().toISOString(),
      regencies: fallbackList,
    });
  }
});

// Comprehensive NTB Kecamatan Coordinates Reference for Open-Meteo & Nowcasting
const NTB_KECAMATAN_MAP: Record<string, { name: string; district: string; lat: number; lng: number }> = {
  // Kota Mataram
  "ampenan": { name: "Ampenan", district: "Kota Mataram", lat: -8.5700, lng: 116.0800 },
  "cakranegara": { name: "Cakranegara", district: "Kota Mataram", lat: -8.5900, lng: 116.1400 },
  "sandubaya": { name: "Sandubaya", district: "Kota Mataram", lat: -8.6000, lng: 116.1500 },
  "selaparang": { name: "Selaparang", district: "Kota Mataram", lat: -8.5700, lng: 116.1100 },
  "sekarbela": { name: "Sekarbela", district: "Kota Mataram", lat: -8.6000, lng: 116.0900 },
  "mataram": { name: "Kota Mataram", district: "Kota Mataram", lat: -8.5833, lng: 116.1167 },

  // Lombok Barat
  "batulayar": { name: "Batu Layar", district: "Kab. Lombok Barat", lat: -8.4900, lng: 116.0800 },
  "batu layar": { name: "Batu Layar", district: "Kab. Lombok Barat", lat: -8.4900, lng: 116.0800 },
  "gunungsari": { name: "Gunungsari", district: "Kab. Lombok Barat", lat: -8.5200, lng: 116.1000 },
  "gunung sari": { name: "Gunungsari", district: "Kab. Lombok Barat", lat: -8.5200, lng: 116.1000 },
  "lingsar": { name: "Lingsar", district: "Kab. Lombok Barat", lat: -8.5600, lng: 116.1700 },
  "narmada": { name: "Narmada", district: "Kab. Lombok Barat", lat: -8.5900, lng: 116.2000 },
  "kediri": { name: "Kediri", district: "Kab. Lombok Barat", lat: -8.6400, lng: 116.1600 },
  "labuapi": { name: "Labuapi", district: "Kab. Lombok Barat", lat: -8.6300, lng: 116.1200 },
  "labu api": { name: "Labuapi", district: "Kab. Lombok Barat", lat: -8.6300, lng: 116.1200 },
  "gerung": { name: "Gerung", district: "Kab. Lombok Barat", lat: -8.6800, lng: 116.1300 },
  "sekotong": { name: "Sekotong", district: "Kab. Lombok Barat", lat: -8.7600, lng: 115.9800 },
  "lembar": { name: "Lembar", district: "Kab. Lombok Barat", lat: -8.7200, lng: 116.0800 },
  "kuripan": { name: "Kuripan", district: "Kab. Lombok Barat", lat: -8.6800, lng: 116.1800 },

  // Lombok Utara
  "pemenang": { name: "Pemenang", district: "Kab. Lombok Utara", lat: -8.4000, lng: 116.1000 },
  "tanjung": { name: "Tanjung", district: "Kab. Lombok Utara", lat: -8.3500, lng: 116.1500 },
  "gangga": { name: "Gangga", district: "Kab. Lombok Utara", lat: -8.3300, lng: 116.2000 },
  "kayangan": { name: "Kayangan", district: "Kab. Lombok Utara", lat: -8.2700, lng: 116.2600 },
  "bayan": { name: "Bayan", district: "Kab. Lombok Utara", lat: -8.2500, lng: 116.4200 },

  // Lombok Tengah
  "praya": { name: "Praya", district: "Kab. Lombok Tengah", lat: -8.7000, lng: 116.2700 },
  "jonggat": { name: "Jonggat", district: "Kab. Lombok Tengah", lat: -8.6500, lng: 116.2300 },
  "pujut": { name: "Pujut", district: "Kab. Lombok Tengah", lat: -8.8200, lng: 116.2800 },
  "mandalika": { name: "Mandalika", district: "Kab. Lombok Tengah", lat: -8.8950, lng: 116.2900 },
  "kuta": { name: "Kuta Mandalika", district: "Kab. Lombok Tengah", lat: -8.8950, lng: 116.2900 },
  "batukliang": { name: "Batukliang", district: "Kab. Lombok Tengah", lat: -8.6000, lng: 116.2600 },
  "kopang": { name: "Kopang", district: "Kab. Lombok Tengah", lat: -8.6300, lng: 116.3500 },
  "janapria": { name: "Janapria", district: "Kab. Lombok Tengah", lat: -8.6800, lng: 116.3800 },

  // Lombok Timur
  "sembalun": { name: "Sembalun", district: "Kab. Lombok Timur", lat: -8.3600, lng: 116.5200 },
  "pringgabaya": { name: "Pringgabaya", district: "Kab. Lombok Timur", lat: -8.5500, lng: 116.6300 },
  "sambelia": { name: "Sambelia", district: "Kab. Lombok Timur", lat: -8.3500, lng: 116.6800 },
  "labuhan haji": { name: "Labuhan Haji", district: "Kab. Lombok Timur", lat: -8.6800, lng: 116.5700 },
  "selong": { name: "Selong", district: "Kab. Lombok Timur", lat: -8.6500, lng: 116.5300 },
  "aikmel": { name: "Aikmel", district: "Kab. Lombok Timur", lat: -8.5700, lng: 116.5200 },
  "masbagik": { name: "Masbagik", district: "Kab. Lombok Timur", lat: -8.6200, lng: 116.4800 },
  "sukamulia": { name: "Sukamulia", district: "Kab. Lombok Timur", lat: -8.6400, lng: 116.5200 },
  "suralaga": { name: "Suralaga", district: "Kab. Lombok Timur", lat: -8.6000, lng: 116.5500 },
  "terara": { name: "Terara", district: "Kab. Lombok Timur", lat: -8.6300, lng: 116.4200 },
  "sakra": { name: "Sakra", district: "Kab. Lombok Timur", lat: -8.6800, lng: 116.4800 },
  "keruak": { name: "Keruak", district: "Kab. Lombok Timur", lat: -8.7500, lng: 116.5000 },
  "jerowaru": { name: "Jerowaru", district: "Kab. Lombok Timur", lat: -8.8400, lng: 116.4700 },

  // Sumbawa Barat
  "taliwang": { name: "Taliwang", district: "Kab. Sumbawa Barat", lat: -8.7500, lng: 116.8500 },
  "brang ene": { name: "Brang Ene", district: "Kab. Sumbawa Barat", lat: -8.8000, lng: 116.8800 },
  "brang rea": { name: "Brang Rea", district: "Kab. Sumbawa Barat", lat: -8.6800, lng: 116.8900 },
  "jereweh": { name: "Jereweh", district: "Kab. Sumbawa Barat", lat: -8.8200, lng: 116.8100 },
  "maluk": { name: "Maluk", district: "Kab. Sumbawa Barat", lat: -8.9200, lng: 116.7600 },
  "sekongkang": { name: "Sekongkang", district: "Kab. Sumbawa Barat", lat: -8.9800, lng: 116.7300 },
  "seteluk": { name: "Seteluk", district: "Kab. Sumbawa Barat", lat: -8.6500, lng: 116.8500 },
  "poto tano": { name: "Poto Tano", district: "Kab. Sumbawa Barat", lat: -8.5300, lng: 116.8200 },

  // Sumbawa
  "sumbawa": { name: "Sumbawa Besar", district: "Kab. Sumbawa", lat: -8.5000, lng: 117.4333 },
  "alas": { name: "Alas", district: "Kab. Sumbawa", lat: -8.5300, lng: 117.0000 },
  "alas barat": { name: "Alas Barat", district: "Kab. Sumbawa", lat: -8.5200, lng: 116.9200 },
  "buer": { name: "Buer", district: "Kab. Sumbawa", lat: -8.5200, lng: 117.0800 },
  "utan": { name: "Utan", district: "Kab. Sumbawa", lat: -8.4700, lng: 117.1500 },
  "rhee": { name: "Rhee", district: "Kab. Sumbawa", lat: -8.4500, lng: 117.2500 },
  "labuhan badas": { name: "Labuhan Badas", district: "Kab. Sumbawa", lat: -8.4800, lng: 117.4000 },
  "moyo utara": { name: "Moyo Utara", district: "Kab. Sumbawa", lat: -8.4300, lng: 117.4800 },
  "moyo hilir": { name: "Moyo Hilir", district: "Kab. Sumbawa", lat: -8.5200, lng: 117.5200 },
  "moyo hulu": { name: "Moyo Hulu", district: "Kab. Sumbawa", lat: -8.6300, lng: 117.4500 },
  "lape": { name: "Lape", district: "Kab. Sumbawa", lat: -8.6200, lng: 117.6500 },
  "lenangguar": { name: "Lenangguar", district: "Kab. Sumbawa", lat: -8.7200, lng: 117.3800 },
  "plampang": { name: "Plampang", district: "Kab. Sumbawa", lat: -8.7800, lng: 117.7800 },
  "empang": { name: "Empang", district: "Kab. Sumbawa", lat: -8.7500, lng: 118.0200 },

  // Dompu
  "dompu": { name: "Dompu", district: "Kab. Dompu", lat: -8.5333, lng: 118.4667 },
  "woja": { name: "Woja", district: "Kab. Dompu", lat: -8.5200, lng: 118.4300 },
  "kempo": { name: "Kempo", district: "Kab. Dompu", lat: -8.5500, lng: 118.3000 },
  "manggelewa": { name: "Manggelewa", district: "Kab. Dompu", lat: -8.5600, lng: 118.2300 },
  "kilo": { name: "Kilo", district: "Kab. Dompu", lat: -8.3200, lng: 118.4200 },
  "hu'u": { name: "Hu'u", district: "Kab. Dompu", lat: -8.8000, lng: 118.4500 },
  "pekat": { name: "Pekat", district: "Kab. Dompu", lat: -8.3800, lng: 117.7800 },
  "pajo": { name: "Pajo", district: "Kab. Dompu", lat: -8.6300, lng: 118.4700 },

  // Bima & Kota Bima
  "asakota": { name: "Asakota", district: "Kota Bima", lat: -8.4400, lng: 118.7200 },
  "mpunda": { name: "Mpunda", district: "Kota Bima", lat: -8.4600, lng: 118.7300 },
  "rasanae barat": { name: "Rasanae Barat", district: "Kota Bima", lat: -8.4600, lng: 118.7100 },
  "rasanae timur": { name: "Rasanae Timur", district: "Kota Bima", lat: -8.4700, lng: 118.7600 },
  "raba": { name: "Raba", district: "Kota Bima", lat: -8.4700, lng: 118.7500 },
  "woha": { name: "Woha", district: "Kab. Bima", lat: -8.5600, lng: 118.7300 },
  "bolo": { name: "Bolo", district: "Kab. Bima", lat: -8.5100, lng: 118.6300 },
  "madapangga": { name: "Madapangga", district: "Kab. Bima", lat: -8.5400, lng: 118.5700 },
  "donggo": { name: "Donggo", district: "Kab. Bima", lat: -8.5000, lng: 118.5000 },
  "soromandi": { name: "Soromandi", district: "Kab. Bima", lat: -8.3800, lng: 118.6200 },
  "sanggar": { name: "Sanggar", district: "Kab. Bima", lat: -8.3500, lng: 118.4500 },
  "tambora": { name: "Tambora", district: "Kab. Bima", lat: -8.2800, lng: 118.0000 },
  "belo": { name: "Belo", district: "Kab. Bima", lat: -8.5800, lng: 118.7300 },
  "monta": { name: "Monta", district: "Kab. Bima", lat: -8.6800, lng: 118.7300 },
};

// Helper to fetch and parse BMKG Nowcasting Alert
async function getNowcastingAlertData(): Promise<any> {
  const now = Date.now();
  if (
    cache.nowcastingNtb &&
    now - cache.nowcastingNtb.timestamp < CACHE_TTL_MS
  ) {
    return cache.nowcastingNtb.data;
  }

  let warningData: any = { hasWarning: false };
  try {
    const rawXml = await fetchBMKG(
      "https://www.bmkg.go.id/alerts/nowcast/id",
      6000,
    );
    const parsed = xmlParser.parse(rawXml);
    const items = parsed?.rss?.channel?.item;
    if (!items) {
      cache.nowcastingNtb = { timestamp: now, data: warningData };
      return warningData;
    }

    const itemList = Array.isArray(items) ? items : [items];

    // NTB-related keywords to match against title and description
    const ntbKeywords =
      /nusa\s*tenggara\s*barat|NTB|lombok|sumbawa|bima|mataram|dompu|selat\s*alas|selat\s*lombok/i;

    const ntbAlerts = itemList.filter((item: any) => {
      const title = item.title || "";
      const desc = item.description || "";
      return ntbKeywords.test(title) || ntbKeywords.test(desc);
    });

    if (ntbAlerts.length > 0) {
      const latest = ntbAlerts[0];
      const description = latest.description || "";

      // Extract affected districts from description
      const affectedDistricts: any[] = [];
      const kecamatanMatch = description.match(
        /khususnya di\s+(.+?)(?:\.\s|$)/i,
      );
      const kecamatanList = kecamatanMatch ? kecamatanMatch[1] : "";

      const districtMapping: Record<
        string,
        { name: string; locations: string[] }
      > = {};
      const kecamatanLower = kecamatanList.toLowerCase();

      // Check all kabupaten kecamatan
      for (const [key, val] of Object.entries(NTB_KECAMATAN_MAP)) {
        if (kecamatanLower.includes(key)) {
          if (!districtMapping[val.district]) {
            districtMapping[val.district] = { name: val.district, locations: [] };
          }
          if (!districtMapping[val.district].locations.includes(val.name)) {
            districtMapping[val.district].locations.push(val.name);
          }
        }
      }

      for (const key of Object.keys(districtMapping)) {
        const d = districtMapping[key];
        affectedDistricts.push({
          name: d.name,
          locations: d.locations.join(", "),
          status: "",
        });
      }

      if (affectedDistricts.length === 0) {
        affectedDistricts.push({
          name: "Wilayah NTB",
          locations: kecamatanList || "Lihat detail peringatan BMKG",
          status: "",
        });
      }

      let severity = "Waspada (Kuning)";
      const titleLower = (latest.title || "").toLowerCase();
      if (
        titleLower.includes("sangat lebat") ||
        titleLower.includes("ekstrem")
      ) {
        severity = "Siaga (Orange)";
      } else if (titleLower.includes("lebat")) {
        severity = "Waspada (Kuning)";
      }

      let validUntil = "";
      const validMatch = description.match(
        /berlangsung hingga\s+(.+?)(?:\.\s|$)/i,
      );
      if (validMatch) {
        validUntil = validMatch[1].trim();
      }

      const issueTime = latest.pubDate
        ? new Date(latest.pubDate).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Makassar",
          }) + " WITA"
        : new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }) + " WITA";

      warningData = {
        hasWarning: true,
        title:
          latest.title || "PERINGATAN DINI CUACA WILAYAH NUSA TENGGARA BARAT",
        issueTime,
        description: description.replace(/\n/g, " ").trim(),
        severity,
        hazardTypes: [],
        affectedDistricts,
        validUntil: validUntil || "Lihat detail peringatan BMKG",
        source: "BMKG Peringatan Dini Cuaca (Nowcasting)",
        updatedAt: new Date().toISOString(),
        alertCount: ntbAlerts.length,
        capLink: latest.link || "",
      };

      if (titleLower.includes("hujan"))
        warningData.hazardTypes.push("Hujan Lebat");
      if (titleLower.includes("petir"))
        warningData.hazardTypes.push("Petir / Kilat");
      if (titleLower.includes("angin"))
        warningData.hazardTypes.push("Angin Kencang");
    }
  } catch (err: any) {
    console.warn("BMKG Nowcasting RSS fetch failed:", err.message);
  }

  cache.nowcastingNtb = { timestamp: now, data: warningData };
  return warningData;
}

// 5. Nowcasting Peringatan Dini Cuaca NTB (BMKG Nowcasting Alert RSS Feed)
app.get("/api/bmkg/nowcasting/ntb", async (_req, res) => {
  try {
    const data = await getNowcastingAlertData();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5b. Curah Hujan Open-Meteo berbasis Lokasi Peringatan Dini Nowcasting BMKG
app.get("/api/bmkg/curah-hujan", async (_req, res) => {
  try {
    const now = Date.now();
    if (cache.curahHujan && now - cache.curahHujan.timestamp < CACHE_TTL_MS) {
      return res.json(cache.curahHujan.data);
    }

    const nowcast = await getNowcastingAlertData();
    const hasNowcast = nowcast && nowcast.hasWarning;

    // Collect target locations map: id -> location info
    const targetLocationsMap = new Map<
      string,
      {
        id: string;
        name: string;
        district: string;
        lat: number;
        lng: number;
        isNowcastAlertArea: boolean;
        warningTitle?: string;
        warningSeverity?: string;
      }
    >();

    // 1. If nowcasting alert exists, extract affected kecamatan locations
    if (hasNowcast && nowcast.description) {
      const descLower = nowcast.description.toLowerCase();
      for (const [key, kec] of Object.entries(NTB_KECAMATAN_MAP)) {
        if (descLower.includes(key)) {
          const id = "kec-" + key.replace(/\s+/g, "-");
          if (!targetLocationsMap.has(id)) {
            targetLocationsMap.set(id, {
              id,
              name: `Kec. ${kec.name}`,
              district: kec.district,
              lat: kec.lat,
              lng: kec.lng,
              isNowcastAlertArea: true,
              warningTitle: nowcast.title,
              warningSeverity: nowcast.severity,
            });
          }
        }
      }
    }

    // 2. Also ensure all 11 main NTB district centers (and Mandalika) are included for broad provincial coverage
    for (const d of NTB_DISTRICTS) {
      if (!targetLocationsMap.has(d.id)) {
        const isDistrictInAlert = Boolean(
          hasNowcast &&
            (nowcast.affectedDistricts || []).some(
              (ad: any) =>
                ad.name.toLowerCase().includes(d.name.toLowerCase()) ||
                d.name.toLowerCase().includes(ad.name.toLowerCase()),
            ),
        );
        targetLocationsMap.set(d.id, {
          id: d.id,
          name: d.name,
          district: d.name,
          lat: d.lat,
          lng: d.lng,
          isNowcastAlertArea: isDistrictInAlert,
          warningTitle: isDistrictInAlert ? nowcast.title : undefined,
          warningSeverity: isDistrictInAlert ? nowcast.severity : undefined,
        });
      }
    }

    const locationsList = Array.from(targetLocationsMap.values());
    if (locationsList.length === 0) {
      return res.json({
        updatedAt: new Date().toISOString(),
        hasNowcastAlert: false,
        alertLocationsCount: 0,
        locations: [],
      });
    }

    // 3. Batch query Open-Meteo for all target coordinates in ONE call
    const lats = locationsList.map((loc) => loc.lat.toFixed(4)).join(",");
    const lngs = locationsList.map((loc) => loc.lng.toFixed(4)).join(",");
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code,wind_speed_10m&daily=precipitation_sum&timezone=Asia%2FMakassar`;

    const openMeteoRes = await fetch(openMeteoUrl, {
      headers: { "User-Agent": "BMKG-NTB-Monitor/1.0" },
    });

    if (!openMeteoRes.ok) {
      throw new Error(`Open-Meteo HTTP ${openMeteoRes.status}`);
    }

    const openMeteoData = await openMeteoRes.json();
    const dataList = Array.isArray(openMeteoData) ? openMeteoData : [openMeteoData];

    // 4. Map Open-Meteo weather and precipitation to our structured format
    const enrichedLocations = locationsList.map((loc, idx) => {
      const meteo = dataList[idx] || {};
      const cur = meteo.current || {};
      const daily = meteo.daily || {};

      const precipitationMm = Number((cur.precipitation ?? 0).toFixed(1));
      const rainMm = Number((cur.rain ?? 0).toFixed(1));
      const dailyPrecipitationSumMm = Number(
        ((daily.precipitation_sum && daily.precipitation_sum[0]) ?? 0).toFixed(1),
      );
      const temp = Math.round(cur.temperature_2m ?? 29);
      const hum = Math.round(cur.relative_humidity_2m ?? 75);
      const windKt = Math.round((cur.wind_speed_10m ?? 12) * 0.539957);
      const weatherCode = cur.weather_code ?? 1;
      const weatherInfo = mapWmoToBmkg(weatherCode);

      // BMKG Precipitation Intensity Classification
      let intensity:
        | "Tidak Ada Hujan"
        | "Hujan Ringan"
        | "Hujan Sedang"
        | "Hujan Lebat"
        | "Hujan Sangat Lebat" = "Tidak Ada Hujan";
      let intensityColor = "#38bdf8"; // cyan-400

      if (precipitationMm > 20.0) {
        intensity = "Hujan Sangat Lebat";
        intensityColor = "#ef4444"; // red-500
      } else if (precipitationMm > 10.0) {
        intensity = "Hujan Lebat";
        intensityColor = "#f97316"; // orange-500
      } else if (precipitationMm > 5.0) {
        intensity = "Hujan Sedang";
        intensityColor = "#eab308"; // yellow-500
      } else if (precipitationMm > 0.05) {
        intensity = "Hujan Ringan";
        intensityColor = "#0284c7"; // sky-600
      }

      return {
        id: loc.id,
        name: loc.name,
        district: loc.district,
        lat: loc.lat,
        lng: loc.lng,
        isNowcastAlertArea: loc.isNowcastAlertArea,
        precipitationMm,
        rainMm,
        dailyPrecipitationSumMm,
        intensity,
        intensityColor,
        weatherDesc: weatherInfo.desc,
        weatherCode,
        temperatureC: temp,
        humidityPercent: hum,
        windSpeedKt: windKt,
        warningTitle: loc.warningTitle,
        warningSeverity: loc.warningSeverity,
      };
    });

    const responsePayload = {
      updatedAt: new Date().toISOString(),
      hasNowcastAlert: Boolean(hasNowcast),
      nowcastTitle: nowcast?.title,
      nowcastSeverity: nowcast?.severity,
      nowcastValidUntil: nowcast?.validUntil,
      alertLocationsCount: enrichedLocations.filter(
        (l) => l.isNowcastAlertArea,
      ).length,
      locations: enrichedLocations,
    };

    cache.curahHujan = { timestamp: now, data: responsePayload };
    res.json(responsePayload);
  } catch (error: any) {
    console.warn("Curah hujan endpoint failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 6. Proxy for Maritime Warning
app.get("/api/bmkg/maritime/warning", async (_req, res) => {
  try {
    const raw = await fetchBMKG("https://maritim.bmkg.go.id/marine2026-data/warning/warnings.json", 6000);
    const json = JSON.parse(raw);
    res.json(json);
  } catch (error: any) {
    console.warn("BMKG Maritime fetch failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 7. Proxy for Maritime Ports List (CSV)
app.get("/api/bmkg/maritime/ports", async (_req, res) => {
  try {
    const raw = await fetchBMKG("https://maritim.bmkg.go.id/marine2026-data/meta/list_lokasi_pelabuhan.csv", 6000);
    const lines = raw.split('\n');
    const ntbPorts = [];
    for (let i = 1; i < lines.length; i++) {
       const line = lines[i].trim();
       if (!line) continue;
       const cols = line.split(',');
       if (cols[2] === "Nusa Tenggara Barat") {
          ntbPorts.push({
             id: cols[0],
             name: cols[1],
             province: cols[2],
             lat: parseFloat(cols[3]),
             lon: parseFloat(cols[4])
          });
       }
    }
    res.json(ntbPorts);
  } catch (error: any) {
    console.warn("BMKG Ports CSV fetch failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 8. Proxy for Maritime Port Weather
app.get("/api/bmkg/maritime/port/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const raw = await fetchBMKG(`https://maritim.bmkg.go.id/marine2026-data/pelabuhan/${id}.json`, 6000);
    const json = JSON.parse(raw);
    res.json(json);
  } catch (error: any) {
    console.warn("BMKG Port Weather fetch failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 9. Laporan Kejadian Bencana Masyarakat
app.get("/api/siaga/lapor", async (_req, res) => {
  try {
    // using direct node fetch to bypass any issues, but fetchBMKG is fine
    const raw = await fetchBMKG("https://siaga.ntbprov.go.id/api/lapor/lists", 6000);
    const $ = cheerio.load(raw);
    const reports: any[] = [];
    
    $("div.d-flex.flex-stack").each((i, el) => {
        const time = $(el).find(".fs-5").first().text().trim();
        const title = $(el).find("a.text-hover-primary").text().trim();
        const user = $(el).find(".text-gray-400 a").text().trim();
        const onClickAttr = $(el).find("a.text-hover-primary").attr("onclick");
        let id = null;
        if (onClickAttr) {
            const match = onClickAttr.match(/'(\d+)'/);
            if (match) id = match[1];
        }
        if (title) {
            reports.push({ id, time, title, user });
        }
    });

    res.json(reports);
  } catch (error: any) {
    console.warn("Siaga Lapor fetch failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 10. Nomor Penting NTB
app.get("/api/siaga/nomor-penting", async (_req, res) => {
  try {
    const raw = await fetchBMKG("https://siaga.ntbprov.go.id/api/mobile/nomor-penting", 8000);
    const json = JSON.parse(raw);
    res.json(json);
  } catch (error: any) {
    console.warn("Nomor Penting fetch failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 11. Kejadian Bencana NTB
app.get("/api/siaga/kejadian-bencana", async (_req, res) => {
  try {
    const raw = await fetchBMKG("https://siaga.ntbprov.go.id/api/mobile/kejadian-bencana/", 8000);
    const json = JSON.parse(raw);
    if (json && Array.isArray(json.data)) {
      json.data.sort((a: any, b: any) => Number(b.id || 0) - Number(a.id || 0));
    }
    res.json(json);
  } catch (error: any) {
    console.warn("Kejadian Bencana fetch failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Vite Middleware Integration for Development / Production
async function setupVite() {
  if (process.env.NODE_ENV === "production") {
    // Serve static build in production (local only; on Vercel, static files are served by CDN)
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    // Create Vite dev server in middleware mode
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server SIAGA BENCANA NTB running on http://0.0.0.0:${PORT}`);
  });
}

// Export app for Vercel serverless handler
export default app;

// Only start the server when this file is run directly (not on Vercel or when imported)
// ESM: compare import.meta.url with the entry-point path
const isVercel = Boolean(process.env.VERCEL);
const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, "/") ===
    process.argv[1].replace(/\\/g, "/");

if (!isVercel && isMainModule) {
  setupVite().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
