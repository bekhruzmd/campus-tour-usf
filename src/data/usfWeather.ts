export type USFWeatherData = {
  temperatureF: number | null;
  feelsLikeF: number | null;
  conditionText: string;
  updatedAt: string | null;
  available: boolean;
};
export function getTampaDefaultWeather(): USFWeatherData {
  return {
    temperatureF: null,
    feelsLikeF: null,
    conditionText: "Weather unavailable",
    updatedAt: null,
    available: false,
  };
}
export async function fetchTampaCampusWeather(): Promise<USFWeatherData> {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=28.0587&longitude=-82.4139&current=temperature_2m,apparent_temperature,weather_code&temperature_unit=fahrenheit&timezone=America%2FNew_York",
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) throw new Error("Weather unavailable");
    const { current } = await res.json();
    if (
      typeof current?.temperature_2m !== "number" ||
      !Number.isFinite(current.temperature_2m)
    )
      throw new Error("Missing weather");
    const code = current.weather_code;
    const conditionText =
      typeof code !== "number"
        ? "Conditions unavailable"
        : code >= 95
          ? "Thunderstorms"
          : code >= 51
            ? "Rain or precipitation"
            : code >= 45
              ? "Fog"
              : code > 0
                ? "Partly cloudy"
                : "Clear";
    return {
      available: true,
      temperatureF: Math.round(current.temperature_2m),
      feelsLikeF:
        typeof current.apparent_temperature === "number"
          ? Math.round(current.apparent_temperature)
          : null,
      conditionText,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return getTampaDefaultWeather();
  }
}
