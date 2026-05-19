// Use CORS proxy (Cloudflare Function) to avoid CORS errors
export const API = "/api/prayer-times";
// Direct API as fallback
export const API_DIRECT = "https://api.vaktija.ba/vaktija/v1";
export const STORAGE_KEY = "vaktijaCache";
export const LOCAL_STORAGE_DAY_KEY = "localStorageDay";
export const SELECTED_MOSQUE_ID_KEY = "selectedMosqueId";

export const labels = {
  en: ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"],
  bs: [
    "Namaz u džamiji",
    "Izlazak sunca",
    "Podne",
    "Ikindija",
    "Akšam",
    "Jacija",
  ],
  ar: ["الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"],
};

export const hijriMonths = [
  "muharrem",
  "safer",
  "rebiul-evvel",
  "rebiul-ahir",
  "džumadel-ula",
  "džumadel-uhra",
  "redžeb",
  "ša'ban",
  "ramazan",
  "ševval",
  "zul-ka'de",
  "zul-hidždže"
];

