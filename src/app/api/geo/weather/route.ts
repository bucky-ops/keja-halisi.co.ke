export const dynamic = "force-dynamic";
// GET /api/geo/weather?lat={}&lng={} — EPHEMERAL weather derivation (spec STEP 3)
//
// "Weather via OpenWeather link → '22°C windy'. Ephemeral, not stored."
// OpenWeatherMap requires an API key, so we resolve through Open-Meteo (keyless,
// real measurements) and cache in-memory for 6h keyed by coordinates. Nothing is
// written to the database — this is a live link-derived value only.
import { NextRequest, NextResponse } from "next/server";
import { cached, TTL_WEATHER } from "@/lib/cache";

interface WeatherOut {
  tempC: number;
  windKph: number;
  note: string;
  source: "open-meteo";
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const weather = await cached<WeatherOut | null>(
    `weather:${key}`,
    TTL_WEATHER,
    async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m`,
          { signal: controller.signal },
        );
        if (!res.ok) return null;
        const json = (await res.json()) as { current?: { temperature_2m?: number; wind_speed_10m?: number } };
        const cur = json.current;
        if (!cur || typeof cur.temperature_2m !== "number") return null;
        const windKph = Math.round(cur.wind_speed_10m ?? 0);
        return {
          tempC: Math.round(cur.temperature_2m),
          windKph,
          note: windKph >= 15 ? "windy" : windKph >= 8 ? "breeze" : "calm",
          source: "open-meteo" as const,
        };
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    },
    null,
  );

  if (!weather) {
    return NextResponse.json({ error: "weather unavailable" });
  }
  return NextResponse.json(weather);
}
