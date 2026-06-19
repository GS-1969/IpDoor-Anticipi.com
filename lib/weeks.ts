import type { Month } from "./types";

/** ISO 8601: Monday of week 1 is the Monday on or before January 4. */
export function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = ((jan4.getUTCDay() + 6) % 7); // Mon=0..Sun=6
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Dow);
  const result = new Date(week1Monday);
  result.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return result;
}

/** Number of ISO weeks in a given year (52 or 53). */
export function isoWeeksInYear(year: number): number {
  // A year has 53 weeks if Jan 1 is Thursday, or if it's a leap year and Jan 1 is Wednesday.
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dow = jan1.getUTCDay(); // Sun=0..Sat=6
  const isLeap =
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (dow === 4) return 53;        // Thursday
  if (dow === 3 && isLeap) return 53; // Wednesday + leap
  return 52;
}

/**
 * Build month meta calibrated for the given year, using the ISO Thursday rule
 * (a week belongs to the month containing its Thursday).
 */
export function buildMonths(year: number): Month[] {
  const namesIt = [
    "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
    "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre",
  ];
  const abbrIt = ["GEN","FEB","MAR","APR","MAG","GIU","LUG","AGO","SET","OTT","NOV","DIC"];

  const totalWeeks = isoWeeksInYear(year);
  const monthByWeek: number[] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    const monday = isoWeekMonday(year, w);
    const thursday = new Date(monday);
    thursday.setUTCDate(monday.getUTCDate() + 3);
    monthByWeek.push(thursday.getUTCMonth() + 1); // 1..12
  }

  const months: Month[] = [];
  for (let m = 1; m <= 12; m++) {
    const weeks = monthByWeek
      .map((mm, idx) => (mm === m ? idx + 1 : -1))
      .filter((v) => v > 0);
    if (weeks.length === 0) continue;
    months.push({
      index: m,
      name: namesIt[m - 1],
      abbr: abbrIt[m - 1],
      firstWeek: weeks[0],
      lastWeek: weeks[weeks.length - 1],
    });
  }
  return months;
}

export function weekLabel(w: number): string {
  return `S${String(w).padStart(2, "0")}`;
}

export function formatMonday(year: number, week: number): string {
  const d = isoWeekMonday(year, week);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}
