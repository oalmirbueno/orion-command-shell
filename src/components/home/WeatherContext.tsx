/**
 * WeatherContext — Contextual weather block for the Command Center.
 *
 * Displays current weather for the operational base (Curitiba, PR)
 * as environmental context, not as a standalone weather app.
 *
 * Uses Open-Meteo (free, no API key) for real weather data.
 */

import { useState, useEffect } from "react";
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning, CloudDrizzle, Wind, Thermometer, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode: number;
  windSpeed: number;
  humidity: number;
  forecast: string;
}

type WeatherState = "loading" | "ready" | "error";

const WMO_CONDITIONS: Record<number, { label: string; icon: React.ElementType }> = {
  0: { label: "Céu limpo", icon: Sun },
  1: { label: "Predominantemente limpo", icon: Sun },
  2: { label: "Parcialmente nublado", icon: Cloud },
  3: { label: "Nublado", icon: Cloud },
  45: { label: "Nevoeiro", icon: Cloud },
  48: { label: "Nevoeiro com geada", icon: Cloud },
  51: { label: "Garoa leve", icon: CloudDrizzle },
  53: { label: "Garoa moderada", icon: CloudDrizzle },
  55: { label: "Garoa intensa", icon: CloudDrizzle },
  61: { label: "Chuva leve", icon: CloudRain },
  63: { label: "Chuva moderada", icon: CloudRain },
  65: { label: "Chuva forte", icon: CloudRain },
  71: { label: "Neve leve", icon: CloudSnow },
  73: { label: "Neve moderada", icon: CloudSnow },
  75: { label: "Neve forte", icon: CloudSnow },
  80: { label: "Pancadas leves", icon: CloudRain },
  81: { label: "Pancadas moderadas", icon: CloudRain },
  82: { label: "Pancadas fortes", icon: CloudRain },
  95: { label: "Tempestade", icon: CloudLightning },
  96: { label: "Tempestade com granizo", icon: CloudLightning },
  99: { label: "Tempestade severa", icon: CloudLightning },
};

function getCondition(code: number) {
  return WMO_CONDITIONS[code] || { label: "Indisponível", icon: Cloud };
}

function buildForecast(maxTemp: number, minTemp: number, code: number): string {
  const cond = getCondition(code);
  return `${cond.label}, máx ${Math.round(maxTemp)}° mín ${Math.round(minTemp)}°`;
}

export function WeatherContext() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [state, setState] = useState<WeatherState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        // Curitiba, PR — lat/lon
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-25.4284&longitude=-49.2733&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo&forecast_days=1"
        );
        if (!res.ok) throw new Error("Weather API error");
        const json = await res.json();

        if (cancelled) return;

        const c = json.current;
        const d = json.daily;
        const cond = getCondition(c.weather_code);

        setWeather({
          temperature: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          condition: cond.label,
          conditionCode: c.weather_code,
          windSpeed: Math.round(c.wind_speed_10m),
          humidity: c.relative_humidity_2m,
          forecast: buildForecast(d.temperature_2m_max[0], d.temperature_2m_min[0], d.weather_code[0]),
        });
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    fetchWeather();
    return () => { cancelled = true; };
  }, []);

  if (state === "error") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card/50">
        <Cloud className="h-4 w-4 text-muted-foreground/40" />
        <span className="text-xs font-mono text-muted-foreground/40">Clima indisponível</span>
      </div>
    );
  }

  if (state === "loading" || !weather) {
    return (
      <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card/50">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-40" />
        </div>
      </div>
    );
  }

  const { icon: CondIcon } = getCondition(weather.conditionCode);

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card/50">
      {/* Icon + temp */}
      <div className="flex items-center gap-3">
        <CondIcon className="h-5 w-5 text-muted-foreground/60" />
        <span className="text-lg font-semibold font-mono text-foreground">{weather.temperature}°</span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border" />

      {/* Details */}
      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground/60">
        <span>{weather.condition}</span>
        <span className="flex items-center gap-1">
          <Thermometer className="h-3 w-3" />
          {weather.feelsLike}°
        </span>
        <span className="flex items-center gap-1">
          <Wind className="h-3 w-3" />
          {weather.windSpeed} km/h
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {weather.humidity}%
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border" />

      {/* Location + forecast */}
      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground/40">
        <span>Curitiba, PR</span>
        <span>·</span>
        <span>{weather.forecast}</span>
      </div>
    </div>
  );
}
