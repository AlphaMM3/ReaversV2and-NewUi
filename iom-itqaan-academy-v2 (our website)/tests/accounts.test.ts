import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell } from "../src/operations.js";
import { createStore } from "../src/db.js";
test("CSV export treats formulas, delimiters and newlines as data", () => {
  for (const v of ["=1+1", " +SUM(A1)", "@cmd", "-1", "\t=1"])
    assert.ok(csvCell(v).startsWith("\"'"));
  assert.equal(csvCell('A,"B"\nC'), '"A,""B""\nC"');
  assert.equal(csvCell(null), '""');
});
test("test configuration refuses non-test databases and malformed ports before connecting", () => {
  const env = {
    ACADEMY_ENV: "test",
    DB_NAME: "production",
    DB_USER: "synthetic",
    DB_PASSWORD: "synthetic",
    DB_PORT: "3306",
  };
  assert.throws(() => createStore(env), /academy_test_/);
  assert.throws(
    () =>
      createStore({
        ...env,
        DB_NAME: "academy_test_safe",
        DB_PORT: "not-a-port",
      }),
    /port/,
  );
});
