import { Router } from "express";
import { z } from "zod";
import { type Store, rows, one, write, obj, fail, audit } from "./db.js";
import { classScope, requireRole, staff } from "./security.js";
import { reportTemplate } from "./report-templates.js";
import { id } from "./catalog.js";
import { bdIso, parseLocal, reportDue } from "./policy.js";
export function academic(store: Store, now = () => new Date()) {
  const r = Router();
  // D-033/043/044: staff-only detail; Guardian publication is a separate contract.
  r.get("/classes/:class_id/report", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...staff);
    const classId = id.parse(Number(q.params.class_id));
    s.json(
      await store.read(async (c) => {
        const { b } = await classScope(c, classId, u);
        const report = await one(
          c,
          "SELECT id,class_id,author_id,body,status,revision,first_submitted_at,current_submitted_at,review_reason,reviewer_id,reviewed_at,updated_at,(SELECT COALESCE(MAX(rr.id),0) FROM report_revisions rr WHERE rr.report_id=reports.id) latest_history_id FROM reports WHERE class_id=?",
          [classId],
        );
        if (!report)
          return {
            template: await reportTemplate(c, b.course_id),
            report: null,
            history: [],
            latest_history_id: 0,
            history_truncated: false,
          };
        if (u.role === "teacher" && report.author_id !== u.id)
          fail(403, "Report author only");
        const history = await rows(
          c,
          "SELECT id,revision,body,event,actor_id,at FROM report_revisions WHERE report_id=? AND id<=? ORDER BY id DESC LIMIT 201",
          [report.id, report.latest_history_id],
        );
        return {
          template: await reportTemplate(c, b.course_id, report.id),
          report,
          history: history.slice(0, 200).reverse(),
          latest_history_id: report.latest_history_id,
          history_truncated: history.length > 200,
        };
      }),
    );
  });
  for (const action of ["start", "end"])
    r.post(`/classes/:class_id/${action}`, async (q, s) =>
      s.json(
        await store.transaction(async (c) => {
          const uid = Number(q.params.class_id),
            u = s.locals.user,
            { s: cl } = await classScope(c, uid, u, "teach", true);
          if (cl.status !== (action === "start" ? "scheduled" : "in_progress"))
            fail(409, "Class not in expected state");
          await write(
            c,
            `UPDATE class_sessions SET ${action === "start" ? "actual_start" : "actual_end"}=?,status=? WHERE id=?`,
            [bdIso(now()), action === "start" ? "in_progress" : "ended", uid],
          );
          await audit(c, u, action, "class_session", uid);
          return action === "start"
            ? { ok: true, meeting_url: cl.meeting_url }
            : { ok: true, next: "Write class report" };
        }),
      ),
    );
  r.post("/classes/:class_id/verify-held", async (q, s) =>
    s.json(
      await store.transaction(async (c) => {
        const uid = Number(q.params.class_id),
          u = s.locals.user,
          { s: cl, b } = await classScope(c, uid, u, "manage", true);
        if (!(u.role === "zimmadar" && b.zimmadar_id === u.id))
          fail(403, "Assigned Batch Zimmadar only");
        if (cl.status !== "ended" || !cl.actual_start || !cl.actual_end)
          fail(409, "Ended session with actual times required");
        if (cl.held_verified) return { ok: true, already_verified: true };
        await write(c, "UPDATE class_sessions SET held_verified=1 WHERE id=?", [
          uid,
        ]);
        await audit(c, u, "verify_held", "class_session", uid);
        return { ok: true };
      }),
    ),
  );
  r.post("/classes/:class_id/report", async (q, s) => {
    const d = z
      .object({
        body: z.string().min(1).max(10000),
        submit: z.boolean().default(false),
        expected_history_id: z.number().int().nonnegative().optional(),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const uid = Number(q.params.class_id),
          u = s.locals.user,
          { s: cl } = await classScope(c, uid, u, "teach", true);
        if (cl.status !== "ended") fail(409, "Report requires ended class");
        const old = await one(
          c,
          "SELECT * FROM reports WHERE class_id=? FOR UPDATE",
          [uid],
        );
        if (old && old.author_id !== u.id) fail(403, "Report author only");
        if (d.expected_history_id !== undefined) {
          const latest = old
            ? await one(
                c,
                "SELECT id FROM report_revisions WHERE report_id=? ORDER BY id DESC LIMIT 1 FOR UPDATE",
                [old.id],
              )
            : null;
          if ((latest?.id || 0) !== d.expected_history_id)
            fail(409, "Report changed; close and reopen it before saving");
        }
        if (old && ["submitted", "approved"].includes(old.status))
          fail(409, "Report submitted/approved; direct overwrite forbidden");
        const at = now().toISOString(),
          status = d.submit ? "submitted" : "draft",
          rev = old ? old.revision + (old.status === "returned" ? 1 : 0) : 1,
          first = old?.first_submitted_at || (d.submit ? at : null);
        let rid: number;
        if (old) {
          rid = old.id;
          await write(
            c,
            "UPDATE reports SET body=?,status=?,first_submitted_at=?,current_submitted_at=?,revision=?,review_reason=?,reviewer_id=?,reviewed_at=?,updated_at=? WHERE id=?",
            [
              d.body,
              status,
              first,
              d.submit ? at : null,
              rev,
              d.submit ? null : old.review_reason,
              d.submit ? null : old.reviewer_id,
              d.submit ? null : old.reviewed_at,
              at,
              rid,
            ],
          );
        } else
          rid = (
            await write(
              c,
              "INSERT INTO reports(class_id,author_id,body,status,first_submitted_at,current_submitted_at,updated_at) VALUES (?,?,?,?,?,?,?)",
              [uid, u.id, d.body, status, first, d.submit ? at : null, at],
            )
          ).insertId;
        const event = d.submit ? "submit" : "draft";
        if (!old) {
          const { b } = await classScope(c, uid, u);
          const template = await reportTemplate(c, b.course_id);
          if (template)
            await write(
              c,
              "INSERT INTO report_template_bindings VALUES (?,?)",
              [rid, template.id],
            );
        }
        await write(
          c,
          "INSERT INTO report_revisions(report_id,revision,body,event,actor_id,at) VALUES (?,?,?,?,?,?)",
          [rid, rev, d.body, event, u.id, at],
        );
        await audit(c, u, "report_" + event, "report", rid, { revision: rev });
        const due =
          cl.actual_start && cl.actual_end
            ? reportDue(cl.actual_start, cl.actual_end)
            : null;
        return {
          id: rid,
          status,
          revision: rev,
          due_at: due,
          submission_compliance: !d.submit
            ? "pending"
            : due
              ? +now() <= +parseLocal(due)
                ? "on_time"
                : "late"
              : "unresolved",
        };
      }),
    );
  });
  r.post("/reports/:report_id/review", async (q, s) => {
    const d = z
      .object({
        action: z.enum(["approve", "return_report"]),
        reason: z.string().max(10000).nullable().optional(),
        expected_history_id: z.number().int().nonnegative().optional(),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const uid = Number(q.params.report_id),
          u = s.locals.user,
          rep = await obj(c, "reports", uid, true),
          { b } = await classScope(c, rep.class_id, u, "manage");
        if (!(u.role === "zimmadar" && b.zimmadar_id === u.id))
          fail(403, "Batch Zimmadar review required");
        if (u.id === rep.author_id) fail(409, "Self-approval conflict");
        if (rep.status !== "submitted") fail(409, "Report not awaiting review");
        if (d.expected_history_id !== undefined) {
          const latest = await one(
            c,
            "SELECT id FROM report_revisions WHERE report_id=? ORDER BY id DESC LIMIT 1 FOR UPDATE",
            [uid],
          );
          if ((latest?.id || 0) !== d.expected_history_id)
            fail(409, "Report changed; close and reopen it before reviewing");
        }
        if (d.action === "return_report" && !d.reason?.trim())
          fail(400, "Return reason required");
        const status = d.action === "approve" ? "approved" : "returned",
          reason = status === "returned" ? d.reason : null,
          at = now().toISOString();
        await write(
          c,
          "UPDATE reports SET status=?,review_reason=?,reviewer_id=?,reviewed_at=?,updated_at=? WHERE id=?",
          [status, reason, u.id, at, at, uid],
        );
        await write(
          c,
          "INSERT INTO report_revisions(report_id,revision,body,event,actor_id,at) VALUES (?,?,?,?,?,?)",
          [uid, rep.revision, rep.body, d.action, u.id, at],
        );
        await audit(c, u, "review_" + status, "report", uid, { reason });
        return { status };
      }),
    );
  });
  r.get("/reports", async (q, s) => {
    const u = s.locals.user;
    if (u.role.startsWith("guardian")) {
      s.json([]);
      return;
    }
    const queryStatus = typeof q.query.status === "string" && ["draft", "submitted", "approved", "returned"].includes(q.query.status.trim())
      ? q.query.status.trim()
      : undefined;
    const queryClassId = q.query.class_id ? Number(q.query.class_id) : undefined;
    const queryBatchId = q.query.batch_id ? Number(q.query.batch_id) : undefined;
    const queryLimit = q.query.limit ? Number(q.query.limit) : undefined;

    s.json(
      await store.read(async (c) => {
        let sql =
            "SELECT r.id,r.class_id,r.author_id,r.status,r.revision,r.first_submitted_at,r.review_reason,r.updated_at,b.label batch_name,c.title course_title,b.zimmadar_id,b.teacher_id,d.branch_id,s.actual_start,s.actual_end FROM reports r JOIN class_sessions s ON s.id=r.class_id JOIN batches b ON b.id=s.batch_id JOIN courses c ON c.id=b.course_id JOIN departments d ON d.id=c.department_id",
          args: any[] = [];
        if (u.role === "department_supervisor") {
          sql += " WHERE d.branch_id=? AND c.department_id=?";
          args = [u.branch_id, u.department_id];
        } else if (u.role !== "central_admin") {
          sql +=
            " WHERE " +
            (u.role === "branch_admin"
              ? "d.branch_id"
              : u.role === "teacher"
                ? "r.author_id"
                : "b.zimmadar_id") +
            "=?";
          args = [u.role === "branch_admin" ? u.branch_id : u.id];
          if (u.department_id) {
            sql += " AND c.department_id=?";
            args.push(u.department_id);
          }
        }
        if (queryStatus) {
          sql += (sql.includes(" WHERE ") ? " AND " : " WHERE ") + "r.status=?";
          args.push(queryStatus);
        }
        if (queryClassId && Number.isInteger(queryClassId) && queryClassId > 0) {
          sql += (sql.includes(" WHERE ") ? " AND " : " WHERE ") + "r.class_id=?";
          args.push(queryClassId);
        }
        if (queryBatchId && Number.isInteger(queryBatchId) && queryBatchId > 0) {
          sql += (sql.includes(" WHERE ") ? " AND " : " WHERE ") + "s.batch_id=?";
          args.push(queryBatchId);
        }
        const limitClause = queryLimit && Number.isInteger(queryLimit) && queryLimit > 0
          ? ` LIMIT ${Math.min(Math.max(1, queryLimit), 500)}`
          : "";
        const result = await rows(c, sql + " ORDER BY r.updated_at DESC" + limitClause, args);
        return result.map((r) => {
          const due =
            r.actual_start && r.actual_end
              ? reportDue(r.actual_start, r.actual_end)
              : null;
          return {
            ...r,
            due_at: due,
            submission_status: !r.first_submitted_at
              ? "pending"
              : due
                ? +parseLocal(r.first_submitted_at) <= +parseLocal(due)
                  ? "on_time"
                  : "late"
                : "unresolved",
          };
        });
      }),
    );
  });
  return r;
}
