// D-034/055, AM-04/07/16-C1. Preserve v0.2 pilot assumptions, not new policy.
export class InvalidDateTimeError extends Error {}
export function parseLocal(value: string): Date {
  if (
    !/^(?!0000)\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/.test(
      value,
    )
  )
    throw new InvalidDateTimeError(
      "Invalid ISO datetime; maximum millisecond precision",
    );
  // Date() normalizes impossible days instead of rejecting them.
  const calendar = new Date(value.slice(0, 10) + "T00:00:00Z");
  if (
    !Number.isFinite(+calendar) ||
    calendar.toISOString().slice(0, 10) !== value.slice(0, 10)
  )
    throw new InvalidDateTimeError("Invalid calendar date");
  const d = new Date(
    /[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}+06:00`,
  );
  if (!Number.isFinite(+d))
    throw new InvalidDateTimeError("Invalid ISO datetime");
  return d;
}
export const bd = (d: Date) =>
  new Date(+d + 6 * 3600000)
    .toISOString()
    .slice(0, 23)
    .replace(/\.000$/, "");
export const bdIso = (d: Date) => bd(d) + "+06:00";
export function reportDue(start: string, end: string): string | null {
  const s = parseLocal(start),
    e = parseLocal(end);
  if (+e <= +s || +e - +s > 86400000) return null;
  const a = bd(s),
    b = bd(e),
    tm = b.slice(11);
  if (b.slice(0, 10) > a.slice(0, 10))
    return tm <= "11:59:59" ? b.slice(0, 10) + "T12:00:00+06:00" : null;
  if (tm >= "23:00:00")
    return bd(new Date(+e + 86400000)).slice(0, 10) + "T12:00:00+06:00";
  return b.slice(0, 10) + "T23:59:00+06:00";
}
export const lateFromJoin = (start: string, join: string) =>
  +parseLocal(join) - +parseLocal(start) > 900000;
export const correctionCutoff = (start: string) =>
  bd(new Date(+parseLocal(start) + 7 * 86400000)).slice(0, 10) +
  "T23:59:59+06:00";
export function absenceStreak(
  rows: { status: string; unauthorized?: boolean }[],
) {
  return rows.reduce(
    (n, r) => (r.status === "Absent" && r.unauthorized ? n + 1 : 0),
    0,
  );
}
export function dueStages(due: string | null) {
  if (!due || bd(parseLocal(due)).slice(11) !== "12:00:00") return [];
  return [
    ["teacher", "12:05"],
    ["zimmadar", "14:00"],
    ["supervisor", "16:00"],
    ["management", "18:00"],
  ].map(([stage, t]) => ({
    stage,
    at: due.slice(0, 10) + "T" + t + ":00+06:00",
  }));
}
export function attendanceTotals(statuses: (string | null)[]) {
  const held_classes = statuses.length,
    present = statuses.filter((s) => s === "Present").length,
    late = statuses.filter((s) => s === "Late").length,
    absent = statuses.filter((s) => s === "Absent").length,
    unrecorded = held_classes - present - late - absent,
    attendance_percent = held_classes
      ? Math.round((10000 * (present + late)) / held_classes) / 100
      : null,
    low_attendance_evaluable = held_classes >= 3 && unrecorded === 0;
  return {
    held_classes,
    present,
    late,
    absent,
    unrecorded,
    attendance_percent,
    low_attendance_evaluable,
    below_75_percent:
      low_attendance_evaluable && 4 * (present + late) < 3 * held_classes,
    warning_sent: false,
  };
}
