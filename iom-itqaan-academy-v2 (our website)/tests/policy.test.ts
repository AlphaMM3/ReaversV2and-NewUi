import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  reportDue,
  lateFromJoin,
  correctionCutoff,
  absenceStreak,
  dueStages,
  attendanceTotals,
  parseLocal,
  bdIso,
} from "../src/policy.js";
import { hashPassword, verifyPassword } from "../src/security.js";
test("D-055 exact 15 minute boundary remains Present; 15:01 Late", () => {
  assert.equal(lateFromJoin("2026-10-31T18:00", "2026-10-31T18:15"), false);
  assert.equal(lateFromJoin("2026-10-31T18:00", "2026-10-31T18:15:01"), true);
});
test("invalid calendar dates and unsupported timestamp precision fail explicitly", () => {
  for (const value of [
    "2026-02-30T18:00",
    "2026-04-31T18:00",
    "2026-10-31T24:00",
    "2026-10-31T18:00:00.000001",
  ])
    assert.throws(() => parseLocal(value), value);
  assert.equal(
    bdIso(parseLocal("2024-02-29T18:00")),
    "2024-02-29T18:00:00+06:00",
  );
});
test("D-055 serialized join evidence retains milliseconds across the 15-minute boundary", () => {
  const join = bdIso(parseLocal("2026-10-31T18:15:00.001"));
  assert.equal(lateFromJoin("2026-10-31T18:00", join), true);
  assert.equal(+parseLocal(join), +parseLocal("2026-10-31T18:15:00.001"));
});
test("D-034 AM-07 report deadlines and AM-16-C1 calendar cutoff", () => {
  assert.equal(
    reportDue("2026-10-31T18:00", "2026-10-31T22:59"),
    "2026-10-31T23:59:00+06:00",
  );
  assert.equal(
    reportDue("2026-10-31T22:30", "2026-10-31T23:00"),
    "2026-11-01T12:00:00+06:00",
  );
  assert.equal(
    reportDue("2026-10-31T23:00", "2026-11-01T00:30"),
    "2026-11-01T12:00:00+06:00",
  );
  assert.equal(
    correctionCutoff("2026-10-31T18:00"),
    "2026-11-07T23:59:59+06:00",
  );
  assert.equal(reportDue("2026-10-31T18:00", "2026-11-01T18:01"), null);
  assert.equal(reportDue("2026-10-31T23:00", "2026-10-31T22:00"), null);
});
test("D-019 consecutive unauthorized held absence helper only", () => {
  const r = Array.from({ length: 7 }, () => ({
    status: "Absent",
    unauthorized: true,
  }));
  assert.equal(absenceStreak(r), 7);
  r.push({ status: "Late", unauthorized: false });
  assert.equal(absenceStreak(r), 0);
});
test("D-084 AM-09 unknown attendance stays unrecorded", () => {
  assert.equal(attendanceTotals([null]).absent, 0);
  assert.equal(attendanceTotals([null]).unrecorded, 1);
  assert.equal(attendanceTotals([null]).low_attendance_evaluable, false);
  assert.equal(attendanceTotals([]).attendance_percent, null);
  const t = attendanceTotals(["Absent", "Absent", "Present"]);
  assert.equal(t.attendance_percent, 33.33);
  assert.equal(t.below_75_percent, true);
  assert.equal(t.warning_sent, false);
});
test("AM-08 only approved noon escalation windows", () => {
  assert.deepEqual(
    dueStages("2026-11-01T12:00:00+06:00").map((v) => v.stage),
    ["teacher", "zimmadar", "supervisor", "management"],
  );
  assert.deepEqual(dueStages("2026-10-31T23:59:00+06:00"), []);
});
test("PBKDF2 compatibility and verification", async () => {
  const h = await hashPassword(
    "A synthetic test password 123!",
    "01".repeat(16),
  );
  assert.equal(
    await verifyPassword("A synthetic test password 123!", h.salt, h.hash),
    true,
  );
  assert.equal(await verifyPassword("wrong", h.salt, h.hash), false);
});
test("220 differential fixtures captured from original Python policy", () => {
  const cases = JSON.parse(
    readFileSync("tests/fixtures/policy-v02.json", "utf8"),
  );
  assert.equal(cases.length, 220);
  for (const c of cases) {
    assert.equal(reportDue(c.start, c.end), c.due, JSON.stringify(c));
    // Original fixture retained; later explicit approval extends the final minute.
    assert.equal(
      correctionCutoff(c.start),
      c.cutoff.replace("T23:59:00", "T23:59:59"),
    );
  }
});
