import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
export type Row = Record<string, any>;
export class Store {
  constructor(public pool: Pool) {}
  async transaction<T>(fn: (c: PoolConnection) => Promise<T>): Promise<T> {
    const c = await this.pool.getConnection();
    try {
      await c.beginTransaction();
      const result = await fn(c);
      await c.commit();
      return result;
    } catch (e) {
      await c.rollback();
      throw e;
    } finally {
      c.release();
    }
  }
  async read<T>(fn: (c: PoolConnection) => Promise<T>): Promise<T> {
    const c = await this.pool.getConnection();
    try {
      return await fn(c);
    } finally {
      c.release();
    }
  }
}
export function createStore(env = process.env) {
  if (!["staging", "test"].includes(env.ACADEMY_ENV || ""))
    throw new Error("ACADEMY_ENV must be staging or test");
  if (!env.DB_NAME || !env.DB_USER || !env.DB_PASSWORD)
    throw new Error("Dedicated database environment variables required");
  if (
    env.ACADEMY_ENV === "test" &&
    !/^academy_test_[a-z0-9_]+$/.test(env.DB_NAME)
  )
    throw Error("Dedicated academy_test_* database required");
  const dbPort = Number(env.DB_PORT || 3306);
  if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535)
    throw Error("Invalid database port");
  return new Store(
    mysql.createPool({
      host: env.DB_HOST || "127.0.0.1",
      port: dbPort,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      connectionLimit: 5,
      charset: "utf8mb4",
      timezone: "Z",
      dateStrings: true,
      multipleStatements: false,
      supportBigNumbers: true,
    }),
  );
}
export async function rows(
  c: PoolConnection,
  sql: string,
  args: any[] = [],
): Promise<Row[]> {
  const [r] = await c.execute<RowDataPacket[]>(sql, args);
  return r;
}
export async function one(
  c: PoolConnection,
  sql: string,
  args: any[] = [],
): Promise<Row | null> {
  return (await rows(c, sql, args))[0] || null;
}
export async function write(c: PoolConnection, sql: string, args: any[] = []) {
  const [r] = await c.execute<ResultSetHeader>(sql, args);
  return r;
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function fail(status: number, message: string): never {
  throw new HttpError(status, message);
}
const tables = new Set([
  "branches",
  "users",
  "families",
  "students",
  "departments",
  "courses",
  "batches",
  "enrollments",
  "class_sessions",
  "reports",
]);
export async function obj(
  c: PoolConnection,
  table: string,
  id: number,
  lock = false,
): Promise<Row> {
  if (!tables.has(table)) throw new Error("Untrusted table");
  return (
    (await one(
      c,
      `SELECT * FROM ${table} WHERE id=?${lock ? " FOR UPDATE" : ""}`,
      [id],
    )) || fail(404, `${table} not found`)
  );
}
export async function audit(
  c: PoolConnection,
  u: Row | null,
  action: string,
  entity: string,
  id: number,
  details = {},
) {
  if (u !== null && (typeof u !== "object" || Array.isArray(u))) {
    throw new Error("Invalid audit actor");
  }
  await write(
    c,
    "INSERT INTO audit_events(at,actor_id,action,entity,entity_id,details) VALUES (?,?,?,?,?,?)",
    [
      new Date().toISOString(),
      u?.id || null,
      action,
      entity,
      id,
      JSON.stringify(details),
    ],
  );
}
