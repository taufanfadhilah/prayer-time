export function fmtTimeWithSeconds(date, tz) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const h = formatted.find((p) => p.type === "hour").value;
  const m = formatted.find((p) => p.type === "minute").value;
  const s = formatted.find((p) => p.type === "second").value;
  return `${h}:${m}:${s}`;
}

export function parseHHMM(hhmm, tz, dayOffset = 0) {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();

  // Get today's date string in the target timezone (YYYY-MM-DD format)
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = dateFormatter.format(now);
  const [year, month, day] = dateStr.split("-").map(Number);

  const nowInTz = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  // Create a date representing "now" as if it were in local time with tz's display
  const nowAsTzLocal = new Date(
    parseInt(nowInTz.find((p) => p.type === "year").value),
    parseInt(nowInTz.find((p) => p.type === "month").value) - 1,
    parseInt(nowInTz.find((p) => p.type === "day").value),
    parseInt(nowInTz.find((p) => p.type === "hour").value),
    parseInt(nowInTz.find((p) => p.type === "minute").value),
    0
  );

  // The offset between actual now and the local representation of tz time
  const tzOffsetMs = now.getTime() - nowAsTzLocal.getTime();

  // Create the target date in local timezone
  const targetLocal = new Date(year, month - 1, day + dayOffset, h, m, 0);

  // Adjust by the timezone offset to get the correct UTC time
  return new Date(targetLocal.getTime() - tzOffsetMs);
}

export function currentTimeTZ(tz) {
  return new Date();
}

export function formatTimeWithoutLeadingZero(timeStr) {
  if (!timeStr || timeStr === "--:--") return timeStr;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;
  const hour = Number(match[1]);
  const minute = match[2];
  return `${hour}:${minute}`;
}

