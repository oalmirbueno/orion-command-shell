/**
 * WeatherContext — Contextual weather block for the Command Center.
 *
 * Displays current weather for the operational base (Curitiba, PR)
 * as environmental context. Designed to sit alongside CommandStatus.
 *
 * Uses Open-Meteo (free, no API key) for real weather data.
 */

import { useState, useEffect } from "react";
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning, CloudDrizzle, Wind, Thermometer, Droplets, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode: number;
  windSpeed: number;
  humidity: number;
  maxTemp: number;
  minTemp: number;
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

export function WeatherContext() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [state, setState] = useState<WeatherState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-25.4284&longitude=-49.2733&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo&forecast_days=1"
        );
        if (!res.ok) throw new Error("Weather API error");
        const json = await res.json();
        if (cancelled) return;

        const c = json.current;
        const d = json.daily;
        const cond = getCondition(c.weather_code);
        const forecastCond = getCondition(d.weather_code[0]);

        setWeather({
          temperature: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          condition: cond.label,
          conditionCode: c.weather_code,
          windSpeed: Math.round(c.wind_speed_10m),
          humidity: c.relative_humidity_2m,
          maxTemp: Math.round(d.temperature_2m_max[0]),
          minTemp: Math.round(d.temperature_2m_min[0]),
          forecast: forecastCond.label,
        });
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    fetchWeather();
    return () => { cancelled = true; };
  }, []);

  // Shared wrapper to match CommandStatus height
  const wrapperClass = "h-full rounded-lg border border-border bg-card/50 px-5 py-5 flex flex-col justify-between";

  if (state === "error") {
    return (
      <section className={wrapperClass}>
        <div className="flex items-center gap-3">
          <Cloud className="h-5 w-5 text-muted-foreground/30" />
          <span className="text-xs font-mono text-muted-foreground/40">Clima indisponível</span>
        </div>
      </section>
    );
  }

  if (state === "loading" || !weather) {
    return (
      <section className={wrapperClass}>
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex items-end gap-4">
          <Skeleton className="h-12 w-16 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </section>
    );
  }

  const { icon: CondIcon } = getCondition(weather.conditionCode);

  return (
    <section className={wrapperClass}>
      {/* Header: location */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground/40" />
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">Curitiba, PR</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/30 uppercase">Base Operacional</span>
      </div>

      {/* Main: temp + condition */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
            <CondIcon className="h-5 w-5 text-primary/70" />
          </div>
          <div>
            <span className="text-3xl font-bold font-mono text-foreground leading-none">{weather.temperature}°</span>
            <span className="text-sm font-mono text-muted-foreground/40 ml-1">C</span>
          </div>
        </div>

        <div className="h-10 w-px bg-border/50" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground/80 truncate">{weather.condition}</p>
          <p className="text-xs font-mono text-muted-foreground/50 mt-0.5">
            Sensação {weather.feelsLike}° · Máx {weather.maxTemp}° · Mín {weather.minTemp}°
          </p>
        </div>
      </div>

      {/* Footer: metrics row */}
      <div className="flex items-center gap-5 pt-3 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <Thermometer className="h-3.5 w-3.5 text-muted-foreground/30" />
          <span className="text-xs font-mono text-muted-foreground/50">Sensação</span>
          <span className="text-xs font-mono font-medium text-foreground/70">{weather.feelsLike}°</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="h-3.5 w-3.5 text-muted-foreground/30" />
          <span className="text-xs font-mono text-muted-foreground/50">Vento</span>
          <span className="text-xs font-mono font-medium text-foreground/70">{weather.windSpeed} km/h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="h-3.5 w-3.5 text-muted-foreground/30" />
          <span className="text-xs font-mono text-muted-foreground/50">Umidade</span>
          <span className="text-xs font-mono font-medium text-foreground/70">{weather.humidity}%</span>
        </div>
      </div>
    </section>
  );
}
