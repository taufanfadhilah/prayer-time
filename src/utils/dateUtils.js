import { hijriMonths } from "./constants";

export function islamicToJD(y, m, d) {
  const epoch = 1948439.5;
  return (
    d +
    Math.ceil(29.5 * (m - 1)) +
    (y - 1) * 354 +
    Math.floor((3 + 11 * y) / 30) +
    epoch -
    1
  );
}

export function jdToIslamic(jd) {
  const epoch = 1948439.5;
  const days = jd - epoch;
  const year = Math.floor((30 * days + 10646) / 10631);
  const month = Math.min(
    12,
    Math.ceil((days - (islamicToJD(year, 1, 1) - epoch)) / 29.5)
  );
  const day = Math.floor(jd - islamicToJD(year, month, 1)) + 1;
  return { year, month, day };
}

export function gregorianToJD(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y2 +
    Math.floor(y2 / 4) -
    Math.floor(y2 / 100) +
    Math.floor(y2 / 400) -
    32045
  );
}

export function toHijri(date) {
  const jd = gregorianToJD(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  const { year, month, day } = jdToIslamic(jd);
  return {
    day: String(day).padStart(2, "0"),
    year: String(year),
    month: hijriMonths[month - 1],
  };
}

export function toGregorianDate(date, tz) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "2-digit",
  }).formatToParts(date);

  const day = formatted.find((p) => p.type === "day").value;
  const year = formatted.find((p) => p.type === "year").value;
  const monthNum = parseInt(formatted.find((p) => p.type === "month").value);

  const monthNames = [
    "januar",
    "februar",
    "mart",
    "april",
    "maj",
    "jun",
    "jul",
    "avgust",
    "septembar",
    "oktobar",
    "novembar",
    "decembar",
  ];
  const month = monthNames[monthNum - 1];
  return {
    day: day,
    year: year,
    month: month,
  };
}

export function getTodayKey(tz) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // YYYY-MM-DD in given tz
}

