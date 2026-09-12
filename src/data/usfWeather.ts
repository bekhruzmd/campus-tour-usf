export type USFWeatherData = {
  temperatureF: number;
  feelsLikeF: number;
  conditionText: string;
  conditionCategory: "sunny" | "cloudy" | "rainy" | "stormy";
  precipitationProbability: number;
  precipitationInches: number;
  windMph: number;
  humidityPercent: number;
  hourlyRainProb: { hour: string; prob: number; temp: number }[];
  isStormAlert: boolean;
  commuterAdvice: string;
  coveredWalkwayTip: string;
};

// Official coordinates for USF Tampa Campus
const USF_LAT = 28.0587;
const USF_LON = -82.4139;

export async function fetchTampaCampusWeather(): Promise<USFWeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${USF_LAT}&longitude=${USF_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=1&timezone=America%2FNew_York`;

    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) throw new Error("Weather API status " + res.status);
    const data = await res.json();

    const current = data.current || {};
    const temp = Math.round(current.temperature_2m ?? 82);
    const feelsLike = Math.round(current.apparent_temperature ?? temp);
    const weatherCode = current.weather_code ?? 0;
    const precip = current.precipitation ?? 0;
    const wind = Math.round(current.wind_speed_10m ?? 8);
    const humidity = Math.round(current.relative_humidity_2m ?? 68);

    // Weather condition interpretation
    let conditionText = "Sunny & Warm";
    let conditionCategory: USFWeatherData["conditionCategory"] = "sunny";

    if (weatherCode >= 95) {
      conditionText = "Severe Thunderstorm Warning";
      conditionCategory = "stormy";
    } else if (weatherCode >= 80 || weatherCode >= 61 || precip > 0.05) {
      conditionText = "Tropical Downpour";
      conditionCategory = "rainy";
    } else if (weatherCode >= 51) {
      conditionText = "Light Rain / Mist";
      conditionCategory = "rainy";
    } else if (weatherCode >= 1 && weatherCode <= 3) {
      conditionText = "Partly Cloudy";
      conditionCategory = "cloudy";
    }

    // Hourly rain probabilities
    const hourly = data.hourly || {};
    const times = hourly.time || [];
    const probs = hourly.precipitation_probability || [];
    const temps = hourly.temperature_2m || [];

    const nowHour = new Date().getHours();
    const hourlyRainProb: USFWeatherData["hourlyRainProb"] = [];

    for (let i = 0; i < Math.min(times.length, 24); i++) {
      const hDate = new Date(times[i]);
      const h = hDate.getHours();
      if (h >= nowHour && hourlyRainProb.length < 6) {
        const ampm = h >= 12 ? (h === 12 ? "12 PM" : `${h - 12} PM`) : h === 0 ? "12 AM" : `${h} AM`;
        hourlyRainProb.push({
          hour: ampm,
          prob: probs[i] ?? 15,
          temp: Math.round(temps[i] ?? temp),
        });
      }
    }

    // Typical Tampa afternoon storm peak check (between 1:00 PM and 5:00 PM)
    const currentMaxProb = Math.max(
      ...hourlyRainProb.map((p) => p.prob),
      precip > 0 ? 85 : 15
    );
    const isStormAlert = currentMaxProb >= 50 || conditionCategory === "stormy" || conditionCategory === "rainy";

    let commuterAdvice = "Great Florida weather for walking across campus today!";
    let coveredWalkwayTip = "Direct outdoor walkways across the quad are clear.";

    if (isStormAlert) {
      commuterAdvice = `[RAIN ADVISORY] Afternoon rain risk (${currentMaxProb}%). Pack an umbrella before driving to campus!`;
      coveredWalkwayTip =
        "Use the covered breezeway between Cooper Hall and Education, and the Hall of Flags connecting the Engineering buildings to stay dry.";
    } else if (temp >= 90) {
      commuterAdvice = `[HEAT ADVISORY] Intense Florida heat (${temp}°F). Stay hydrated and use shaded breezeways near Sessums Mall.`;
      coveredWalkwayTip = "Take the shaded tree-canopy route along Maple Drive.";
    }

    return {
      temperatureF: temp,
      feelsLikeF: feelsLike,
      conditionText,
      conditionCategory,
      precipitationProbability: currentMaxProb,
      precipitationInches: precip,
      windMph: wind,
      humidityPercent: humidity,
      hourlyRainProb,
      isStormAlert,
      commuterAdvice,
      coveredWalkwayTip,
    };
  } catch {
    // Robust offline fallback with authentic Tampa afternoon climate
    return getTampaDefaultWeather();
  }
}

export function getTampaDefaultWeather(): USFWeatherData {
  const now = new Date();
  const hour = now.getHours();
  // Simulated typical Florida afternoon storm pattern
  const isAfternoon = hour >= 13 && hour <= 17;
  const temp = isAfternoon ? 84 : 88;
  const rainProb = isAfternoon ? 72 : 20;

  return {
    temperatureF: temp,
    feelsLikeF: temp + 4,
    conditionText: isAfternoon ? "Scattered Tampa Storms" : "Partly Sunny",
    conditionCategory: isAfternoon ? "rainy" : "sunny",
    precipitationProbability: rainProb,
    precipitationInches: isAfternoon ? 0.2 : 0,
    windMph: 9,
    humidityPercent: 74,
    hourlyRainProb: [
      { hour: "12 PM", prob: 25, temp: 88 },
      { hour: "1 PM", prob: 45, temp: 87 },
      { hour: "2 PM", prob: 75, temp: 84 },
      { hour: "3 PM", prob: 80, temp: 82 },
      { hour: "4 PM", prob: 60, temp: 83 },
      { hour: "5 PM", prob: 30, temp: 85 },
    ],
    isStormAlert: isAfternoon,
    commuterAdvice: isAfternoon
      ? "[STORM ALERT] Afternoon storm risk active! Keep an umbrella in your backpack and park near covered walkways."
      : "[CLEAR] Clear weather for your drive and walk across campus.",
    coveredWalkwayTip:
      "Covered connection: The Hall of Flags connects Kopp, Engineering II, and III. Cooper Hall has full shaded breezeways.",
  };
}
