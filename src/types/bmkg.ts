export interface EarthquakeItem {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string;
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi: string;
  Dirasakan?: string;
  Shakemap?: string;
  shakemapUrl?: string | null;
  parsedLat?: number;
  parsedLng?: number;
  distanceToNTBKm?: number;
  isNtbArea?: boolean;
  isFallback?: boolean;
}

export interface WeatherHourForecast {
  datetime: string;
  code: string;
  desc: string;
  icon: string;
  severity: 'normal' | 'caution' | 'warning';
}

export interface WeatherRegency {
  id: string;
  name: string;
  lat: number;
  lng: number;
  current: {
    weather: {
      code: string;
      desc: string;
      icon: string;
      severity: 'normal' | 'caution' | 'warning';
    };
    temperatureC: string;
    humidityPercent: string;
    windSpeedKt: string;
  };
  forecasts: WeatherHourForecast[];
}

export interface NowcastingAlert {
  hasWarning: boolean;
  title: string;
  issueTime?: string;
  description: string;
  severity: string;
  hazardTypes?: string[];
  affectedDistricts?: Array<{
    name: string;
    locations: string;
    status: string;
  }>;
  affectedAreas?: string[];
  windSpeedEstimate?: string;
  waveHeightEstimate?: string;
  source?: string;
  validUntil?: string;
  updatedAt: string;
}

export interface DistrictInfo {
  id: string;
  name: string;
  island: 'Lombok' | 'Sumbawa';
  lat: number;
  lng: number;
  bpbdPhone: string;
  pmiPhone: string;
  riskLevel: string;
}

export interface VolcanoInfo {
  name: string;
  island: string;
  lat: number;
  lng: number;
  status: string;
  hazardRadiusKm: number;
  dangerDetails: string;
}
