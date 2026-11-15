import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  type Store,
  rows,
  one,
  obj,
  write,
  fail,
  audit,
} from "./db.js";
import { batchScope, checkBranch, classScope, requireRole } from "./security.js";

const id = z.coerce.number().int().positive();
const monthStr = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export function commercialLedger(store: Store, now = () => new Date()) {
  const r = Router();

  // --------------------------------------------------------------------------
  // 1. ONE-TO-ONE PACKAGES CATALOG (AM-18, 5.2.1)
  // --------------------------------------------------------------------------

  // List active packages
  r.get("/one-to-one/packages", async (_q, s) => {
    s.json(
      await store.read(async (c) =>
        rows(
          c,
          "SELECT * FROM one_to_one_packages WHERE active = 1 ORDER BY total_classes ASC",
        ),
      ),
    );
  });

  // Create package definition (Admin only)
  r.post("/one-to-one/packages", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin");

    const schema = z.object({
      name: z.string().trim().min(3).max(150),
      code: z.string().trim().min(2).max(50),
      total_classes: z.coerce.number().int().positive(),
      total_minutes: z.coerce.number().int().positive(),
      fee_amount: z.coerce.number().positive(),
      currency: z.string().trim().min(3).max(10).default("BDT"),
      validity_days: z.coerce.number().int().positive().default(30),
    });
    const parsed = schema.parse(q.body);

    const result = await store.transaction(async (c) => {
      const existing = await one(
        c,
        "SELECT id FROM one_to_one_packages WHERE code = ?",
        [parsed.code],
      );
      if (existing) fail(409, "Package code already exists");

      const res = await write(
        c,
        `INSERT INTO one_to_one_packages(name, code, total_classes, total_minutes, fee_amount, currency, validity_days, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          parsed.name,
          parsed.code,
          parsed.total_classes,
          parsed.total_minutes,
          parsed.fee_amount,
          parsed.currency,
          parsed.validity_days,
          now().toISOString(),
        ],
      );

      await audit(c, u, "create_package", "one_to_one_packages", res.insertId, {
        code: parsed.code,
        minutes: parsed.total_minutes,
      });

      return { id: res.insertId, ...parsed };
    });

    s.json(result);
  });

  // --------------------------------------------------------------------------
  // 2. ONE-TO-ONE CONTRACTS (AM-18, 5.2.1, 5.4.1)
  // --------------------------------------------------------------------------

  // List contracts (scoped)
  r.get("/one-to-one/contracts", async (q, s) => {
    const u = s.locals.user;
    requireRole(
      u,
      "central_admin",
      "branch_admin",
      "zimmadar",
      "department_supervisor",
      "teacher",
      "guardian_primary",
      "guardian_secondary",
    );
    const enrollmentId = q.query.enrollment_id ? id.parse(q.query.enrollment_id) : undefined;
    const period = q.query.billing_period ? monthStr.parse(String(q.query.billing_period)) : undefined;

    s.json(
      await store.read(async (c) => {
        let sql = `
          SELECT ct.*, p.name package_name, p.total_classes,
                 st.full_name student_name, st.family_id,
                 b.label batch_name, co.title course_title, d.branch_id
          FROM one_to_one_contracts ct
          JOIN one_to_one_packages p ON p.id = ct.package_id
          JOIN enrollments e ON e.id = ct.enrollment_id
          JOIN students st ON st.id = e.student_id
          JOIN batches b ON b.id = e.batch_id
          JOIN courses co ON co.id = b.course_id
          JOIN departments d ON d.id = co.department_id
          WHERE 1=1
        `;
        const params: any[] = [];

        if (enrollmentId) {
          sql += " AND ct.enrollment_id = ?";
          params.push(enrollmentId);
        }
        if (period) {
          sql += " AND ct.billing_period = ?";
          params.push(period);
        }

        // Scope check
        if (u.role.startsWith("guardian")) {
          sql += " AND st.family_id IN (SELECT family_id FROM family_guardians WHERE user_id = ?)";
          params.push(u.id);
        } else if (u.role === "teacher") {
          sql += " AND b.teacher_id = ? AND d.branch_id = ?";
          params.push(u.id, u.branch_id);
          if (u.department_id) {
            sql += " AND co.department_id = ?";
            params.push(u.department_id);
          }
        } else if (u.role === "zimmadar") {
          sql += " AND b.zimmadar_id = ? AND d.branch_id = ?";
          params.push(u.id, u.branch_id);
          if (u.department_id) {
            sql += " AND co.department_id = ?";
            params.push(u.department_id);
          }
        } else if (u.role === "department_supervisor") {
          if (!u.department_id) fail(403, "Department scope required");
          sql += " AND d.branch_id = ? AND co.department_id = ?";
          params.push(u.branch_id, u.department_id);
        } else if (u.role === "branch_admin") {
          sql += " AND d.branch_id = ?";
          params.push(u.branch_id);
        } else if (u.role !== "central_admin") {
          fail(403, "Permission denied");
        }

        sql += " ORDER BY ct.id DESC LIMIT 100";
        return rows(c, sql, params);
      }),
    );
  });

  // Create & activate contract for an enrollment
  r.post("/one-to-one/contracts", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin", "branch_admin", "zimmadar");

    const schema = z.object({
      enrollment_id: id,
      package_id: id,
      billing_period: monthStr,
      start_date: dateStr,
      end_date: dateStr,
    });
    const parsed = schema.parse(q.body);
    if (parsed.end_date < parsed.start_date) fail(400, "End before start");

    const result = await store.transaction(async (c) => {
      // 1. Verify enrollment exists, caller scope, and delivery mode is 1:1
      const en = await obj(c, "enrollments", parsed.enrollment_id, true);
      const batch = await batchScope(c, en.batch_id, u, "manage");
      if (batch.delivery_mode !== "one_to_one")
        fail(400, "Contracts can only be created for one-to-one enrollments");

      // 2. Verify package
      const pkg = await one(
        c,
        "SELECT * FROM one_to_one_packages WHERE id = ? AND active = 1",
        [parsed.package_id],
      );
      if (!pkg) fail(404, "Active package not found");

      // 3. Create contract
      const contractRes = await write(
        c,
        `INSERT INTO one_to_one_contracts(
          enrollment_id, package_id, billing_period, status,
          allocated_minutes, used_minutes, remaining_minutes,
          fee_amount, currency, start_date, end_date, created_by, created_at
        ) VALUES (?, ?, ?, 'active', ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parsed.enrollment_id,
          parsed.package_id,
          parsed.billing_period,
          pkg.total_minutes,
          pkg.total_minutes,
          pkg.fee_amount,
          pkg.currency,
          parsed.start_date,
          parsed.end_date,
          u.id,
          now().toISOString(),
        ],
      );
      const contractId = contractRes.insertId;

      // 4. Post initial allocation to minute ledger
      await write(
        c,
        `INSERT INTO package_minute_ledger(
          contract_id, class_session_id, entry_type, minutes, balance_after, recorded_by, recorded_at, notes
        ) VALUES (?, NULL, 'credit_allocation', ?, ?, ?, ?, ?)`,
        [
          contractId,
          pkg.total_minutes,
          pkg.total_minutes,
          u.id,
          now().toISOString(),
          `Initial package allocation: ${pkg.name}`,
        ],
      );

      await audit(c, u, "create_contract", "one_to_one_contracts", contractId, {
        enrollment_id: parsed.enrollment_id,
        package_id: parsed.package_id,
        minutes: pkg.total_minutes,
      });

      return {
        id: contractId,
        ...parsed,
        allocated_minutes: pkg.total_minutes,
        remaining_minutes: pkg.total_minutes,
        fee_amount: pkg.fee_amount,
        status: "active",
      };
    });

    s.json(result);
  });

  // --------------------------------------------------------------------------
  // 3. PACKAGE MINUTE LEDGER (AM-18, 5.4.1)
  // --------------------------------------------------------------------------

  // View ledger history for a contract
  r.get("/one-to-one/contracts/:id/ledger", async (q, s) => {
    const u = s.locals.user;
    requireRole(
      u,
      "central_admin",
      "branch_admin",
      "zimmadar",
      "department_supervisor",
      "teacher",
      "guardian_primary",
      "guardian_secondary",
    );
    const contractId = id.parse(q.params.id);

    s.json(
      await store.read(async (c) => {
        const ct = await one(
          c,
          `SELECT ct.*, e.batch_id, st.family_id, d.branch_id
           FROM one_to_one_contracts ct
           JOIN enrollments e ON e.id = ct.enrollment_id
           JOIN students st ON st.id = e.student_id
           JOIN batches b ON b.id = e.batch_id
           JOIN courses co ON co.id = b.course_id
           JOIN departments d ON d.id = co.department_id
           WHERE ct.id = ?`,
          [contractId],
        );
        if (!ct) fail(404, "Contract not found");

        if (u.role.startsWith("guardian")) {
          const fg = await one(
            c,
            "SELECT 1 FROM family_guardians WHERE family_id = ? AND user_id = ?",
            [ct.family_id, u.id],
          );
          if (!fg) fail(403, "Access denied to learner ledger");
        } else {
          await batchScope(c, ct.batch_id, u, "read");
        }

        return rows(
          c,
          `SELECT l.*, u.name recorded_by_name, cl.scheduled_start, cl.course_title
           FROM package_minute_ledger l
           JOIN users u ON u.id = l.recorded_by
           LEFT JOIN (
             SELECT cs.id, cs.scheduled_start, c.title course_title
             FROM class_sessions cs
             JOIN batches b ON b.id = cs.batch_id
             JOIN courses c ON c.id = b.course_id
           ) cl ON cl.id = l.class_session_id
           WHERE l.contract_id = ?
           ORDER BY l.id ASC`,
          [contractId],
        );
      }),
    );
  });

  // Administrative adjustment to minute ledger
  r.post("/one-to-one/contracts/:id/adjust", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin", "branch_admin", "zimmadar");
    const contractId = id.parse(q.params.id);

    const schema = z.object({
      minutes: z.coerce.number().int(),
      entry_type: z.enum(["rollover_credit", "reversal_adjustment"]),
      notes: z.string().trim().min(3).max(500),
    });
    const parsed = schema.parse(q.body);

    const result = await store.transaction(async (c) => {
      const ct = await one(
        c,
        "SELECT * FROM one_to_one_contracts WHERE id = ? FOR UPDATE",
        [contractId],
      );
      if (!ct) fail(404, "Contract not found");
      const en = await obj(c, "enrollments", ct.enrollment_id);
      await batchScope(c, en.batch_id, u, "manage");

      const newRemaining = ct.remaining_minutes + parsed.minutes;
      if (newRemaining < 0) {
        fail(400, "Adjustment would result in negative minute balance");
      }

      const ledgerRes = await write(
        c,
        `INSERT INTO package_minute_ledger(
          contract_id, class_session_id, entry_type, minutes, balance_after, recorded_by, recorded_at, notes
        ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
        [
          contractId,
          parsed.entry_type,
          parsed.minutes,
          newRemaining,
          u.id,
          now().toISOString(),
          parsed.notes,
        ],
      );

      await write(
        c,
        "UPDATE one_to_one_contracts SET remaining_minutes = ? WHERE id = ?",
        [newRemaining, contractId],
      );

      await audit(c, u, "adjust_minutes", "one_to_one_contracts", contractId, {
        minutes: parsed.minutes,
        balance_after: newRemaining,
        notes: parsed.notes,
      });

      return {
        id: ledgerRes.insertId,
        contract_id: contractId,
        minutes: parsed.minutes,
        balance_after: newRemaining,
      };
    });

    s.json(result);
  });

  // Deduct session minutes against contract
  r.post("/one-to-one/contracts/:id/consume-session", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin", "branch_admin", "zimmadar", "teacher");
    const contractId = id.parse(q.params.id);

    const schema = z.object({
      class_session_id: id,
      minutes: z.coerce.number().int().positive().optional(),
      notes: z.string().trim().max(500).optional(),
    });
    const parsed = schema.parse(q.body);

    const result = await store.transaction(async (c) => {
      const ct = await one(
        c,
        "SELECT * FROM one_to_one_contracts WHERE id = ? FOR UPDATE",
        [contractId],
      );
      if (!ct) fail(404, "Contract not found");
      const en = await obj(c, "enrollments", ct.enrollment_id);

      const { s: cl } = await classScope(
        c,
        parsed.class_session_id,
        u,
        u.role === "teacher" ? "teach" : "manage",
        true,
      );
      if (cl.batch_id !== en.batch_id)
        fail(400, "Class session does not belong to contract batch");
      if (cl.status === "cancelled")
        fail(409, "Cancelled class session cannot consume package minutes");

      const existing = await one(
        c,
        "SELECT id FROM package_minute_ledger WHERE contract_id = ? AND class_session_id = ?",
        [contractId, parsed.class_session_id],
      );
      if (existing) fail(409, "Minutes already deducted for this class session");

      let mins = parsed.minutes;
      if (!mins) {
        if (cl.actual_start && cl.actual_end) {
          mins = Math.round((new Date(cl.actual_end).getTime() - new Date(cl.actual_start).getTime()) / 60000);
        } else {
          mins = 45;
        }
      }

      const newUsed = ct.used_minutes + mins;
      const newRemaining = ct.remaining_minutes - mins;
      const status = newRemaining <= 0 ? "depleted" : ct.status;

      const ledgerRes = await write(
        c,
        `INSERT INTO package_minute_ledger(
          contract_id, class_session_id, entry_type, minutes, balance_after, recorded_by, recorded_at, notes
        ) VALUES (?, ?, 'class_deduction', ?, ?, ?, ?, ?)`,
        [
          contractId,
          parsed.class_session_id,
          -mins,
          newRemaining,
          u.id,
          now().toISOString(),
          parsed.notes || ("Deduction for class #" + parsed.class_session_id),
        ],
      );

      await write(
        c,
        "UPDATE one_to_one_contracts SET used_minutes = ?, remaining_minutes = ?, status = ? WHERE id = ?",
        [newUsed, newRemaining, status, contractId],
      );

      await audit(c, u, "deduct_class_minutes", "one_to_one_contracts", contractId, {
        class_session_id: parsed.class_session_id,
        deducted_minutes: mins,
        balance_after: newRemaining,
      });

      return {
        id: ledgerRes.insertId,
        contract_id: contractId,
        deducted_minutes: mins,
        balance_after: newRemaining,
        status,
      };
    });

    s.json(result);
  });

  // --------------------------------------------------------------------------
  // 4. TUITION INVOICES (D-011, D-013, D-015, D-141)
  // --------------------------------------------------------------------------

  // List invoices (scoped)
  r.get("/invoices", async (q, s) => {
    const u = s.locals.user;
    requireRole(
      u,
      "central_admin",
      "branch_admin",
      "guardian_primary",
      "guardian_secondary",
    );
    const enrollmentId = q.query.enrollment_id ? id.parse(q.query.enrollment_id) : undefined;
    const status = q.query.status ? String(q.query.status) : undefined;

    s.json(
      await store.read(async (c) => {
        let sql = `
          SELECT inv.*, st.full_name student_name, st.family_id,
                 b.label batch_name, co.title course_title, d.branch_id
          FROM tuition_invoices inv
          JOIN enrollments e ON e.id = inv.enrollment_id
          JOIN students st ON st.id = e.student_id
          JOIN batches b ON b.id = e.batch_id
          JOIN courses co ON co.id = b.course_id
          JOIN departments d ON d.id = co.department_id
          WHERE 1=1
        `;
        const params: any[] = [];

        if (enrollmentId) {
          sql += " AND inv.enrollment_id = ?";
          params.push(enrollmentId);
        }
        if (status) {
          sql += " AND inv.status = ?";
          params.push(status);
        }

        if (u.role.startsWith("guardian")) {
          sql += " AND st.family_id IN (SELECT family_id FROM family_guardians WHERE user_id = ?)";
          params.push(u.id);
        } else if (u.role === "branch_admin") {
          sql += " AND d.branch_id = ?";
          params.push(u.branch_id);
        } else if (u.role !== "central_admin") {
          fail(403, "Permission denied");
        }

        sql += " ORDER BY inv.id DESC LIMIT 100";
        return rows(c, sql, params);
      }),
    );
  });

  // Create invoice
  r.post("/invoices", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin", "branch_admin");

    const schema = z.object({
      enrollment_id: id,
      contract_id: id.optional(),
      billing_month: monthStr,
      amount_due: z.coerce.number().positive(),
      due_date: dateStr,
      notes: z.string().trim().max(500).optional(),
    });
    const parsed = schema.parse(q.body);

    const result = await store.transaction(async (c) => {
      const en = await one(
        c,
        `SELECT e.id, d.branch_id
         FROM enrollments e
         JOIN batches b ON b.id = e.batch_id
         JOIN courses co ON co.id = b.course_id
         JOIN departments d ON d.id = co.department_id
         WHERE e.id = ?`,
        [parsed.enrollment_id],
      );
      if (!en) fail(404, "Enrollment not found");
      checkBranch(u, en.branch_id);

      if (parsed.contract_id) {
        const ct = await one(
          c,
          "SELECT id, enrollment_id FROM one_to_one_contracts WHERE id = ?",
          [parsed.contract_id],
        );
        if (!ct) fail(404, "Contract not found");
        if (ct.enrollment_id !== parsed.enrollment_id) {
          fail(400, "Contract does not belong to specified enrollment");
        }
      }

      const uniqueSuffix = randomUUID().slice(0, 8).toUpperCase();
      const invoiceNum = `INV-${parsed.billing_month.replace("-", "")}-${en.id}-${uniqueSuffix}`;

      const res = await write(
        c,
        `INSERT INTO tuition_invoices(
          enrollment_id, contract_id, invoice_number, billing_month,
          amount_due, amount_paid, due_date, status, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, 0.00, ?, 'unpaid', ?, ?, ?)`,
        [
          parsed.enrollment_id,
          parsed.contract_id || null,
          invoiceNum,
          parsed.billing_month,
          parsed.amount_due,
          parsed.due_date,
          parsed.notes || null,
          u.id,
          now().toISOString(),
        ],
      );

      await audit(c, u, "create_invoice", "tuition_invoices", res.insertId, {
        invoice_number: invoiceNum,
        amount_due: parsed.amount_due,
      });

      return {
        id: res.insertId,
        invoice_number: invoiceNum,
        ...parsed,
        amount_paid: 0.0,
        status: "unpaid",
      };
    });

    s.json(result);
  });

  // Record payment reference against invoice (D-015, D-141)
  r.post("/invoices/:id/record-payment", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin", "branch_admin");
    const invoiceId = id.parse(q.params.id);

    const schema = z.object({
      payment_reference_code: z.string().trim().min(3).max(80),
      amount_paid: z.coerce.number().positive(),
    });
    const parsed = schema.parse(q.body);

    const result = await store.transaction(async (c) => {
      const inv = await one(
        c,
        "SELECT * FROM tuition_invoices WHERE id = ? FOR UPDATE",
        [invoiceId],
      );
      if (!inv) fail(404, "Invoice not found");
      const en = await obj(c, "enrollments", inv.enrollment_id);
      await batchScope(c, en.batch_id, u, "admin");

      const newPaid = Number(inv.amount_paid) + parsed.amount_paid;
      const newStatus = newPaid >= Number(inv.amount_due) ? "paid" : "partially_paid";

      await write(
        c,
        `UPDATE tuition_invoices
         SET amount_paid = ?, status = ?, payment_reference_code = ?
         WHERE id = ?`,
        [newPaid, newStatus, parsed.payment_reference_code, invoiceId],
      );

      await audit(c, u, "record_invoice_payment", "tuition_invoices", invoiceId, {
        payment_reference_code: parsed.payment_reference_code,
        amount_paid: parsed.amount_paid,
        total_paid: newPaid,
        status: newStatus,
      });

      return {
        id: invoiceId,
        invoice_number: inv.invoice_number,
        amount_paid: newPaid,
        status: newStatus,
        payment_reference_code: parsed.payment_reference_code,
      };
    });

    s.json(result);
  });

  // --------------------------------------------------------------------------
  // 5. TEACHER PAYABLES (D-025, 7.2.1)
  // --------------------------------------------------------------------------

  // List payables
  r.get("/finance/teacher-payables", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin", "branch_admin", "zimmadar", "teacher");
    const rawPeriod = q.query.billing_period || q.query.billing_month;
    const period = rawPeriod ? monthStr.parse(String(rawPeriod)) : undefined;

    s.json(
      await store.read(async (c) => {
        let sql = `
          SELECT tp.*, t.name teacher_name, t.email teacher_email,
                 cs.scheduled_start, co.title course_title, b.label batch_name, d.branch_id
          FROM teacher_payables tp
          JOIN users t ON t.id = tp.teacher_id
          JOIN class_sessions cs ON cs.id = tp.class_session_id
          JOIN batches b ON b.id = cs.batch_id
          JOIN courses co ON co.id = b.course_id
          JOIN departments d ON d.id = co.department_id
          WHERE 1=1
        `;
        const params: any[] = [];

        if (period) {
          sql += " AND tp.billing_month = ?";
          params.push(period);
        }

        if (u.role === "teacher") {
          sql += " AND tp.teacher_id = ? AND d.branch_id = ?";
          params.push(u.id, u.branch_id);
        } else if (u.role === "zimmadar") {
          sql += " AND b.zimmadar_id = ? AND d.branch_id = ?";
          params.push(u.id, u.branch_id);
          if (u.department_id) {
            sql += " AND co.department_id = ?";
            params.push(u.department_id);
          }
        } else if (u.role === "branch_admin") {
          sql += " AND d.branch_id = ?";
          params.push(u.branch_id);
        } else if (u.role !== "central_admin") {
          fail(403, "Permission denied");
        }

        sql += " ORDER BY tp.id DESC LIMIT 100";
        return rows(c, sql, params);
      }),
    );
  });

  // Calculate teacher payable for a class session
  r.post("/finance/teacher-payables/calculate", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin", "branch_admin", "zimmadar");

    const schema = z.object({
      class_session_id: id,
      hourly_rate: z.coerce.number().positive(),
    });
    const parsed = schema.parse(q.body);

    const result = await store.transaction(async (c) => {
      const { s: cl, b } = await classScope(c, parsed.class_session_id, u, "manage", true);
      if (cl.status !== "ended") fail(400, "Payable can only be calculated for ended classes");

      const teacherId = cl.actual_teacher_id || b.teacher_id;
      if (!teacherId) fail(400, "No teacher assigned to class session");

      const start = new Date(cl.actual_start || cl.scheduled_start);
      const end = new Date(cl.actual_end || cl.scheduled_end);
      let durationMins = Math.round((end.getTime() - start.getTime()) / 60000);
      if (durationMins <= 0 || isNaN(durationMins)) durationMins = 45;

      const billingMonth = (cl.scheduled_start || now().toISOString()).slice(0, 7);
      const amount = Math.round(((durationMins / 60) * parsed.hourly_rate) * 100) / 100;

      const existing = await one(
        c,
        "SELECT id FROM teacher_payables WHERE class_session_id = ?",
        [parsed.class_session_id],
      );
      if (existing) fail(409, "Payable already calculated for this class session");

      const res = await write(
        c,
        `INSERT INTO teacher_payables(
          teacher_id, class_session_id, billing_month, conducted_minutes, hourly_rate, payable_amount, status, calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [
          teacherId,
          parsed.class_session_id,
          billingMonth,
          durationMins,
          parsed.hourly_rate,
          amount,
          now().toISOString(),
        ],
      );

      await audit(c, u, "calculate_teacher_payable", "teacher_payables", res.insertId, {
        class_session_id: parsed.class_session_id,
        payable_amount: amount,
      });

      return {
        id: res.insertId,
        teacher_id: teacherId,
        class_session_id: parsed.class_session_id,
        conducted_minutes: durationMins,
        hourly_rate: parsed.hourly_rate,
        payable_amount: amount,
        status: "pending",
      };
    });

    s.json(result);
  });

  return r;
}
