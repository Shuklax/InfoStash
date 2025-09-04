import { Kysely, SqliteDialect } from "kysely";
import Database from "better-sqlite3";
import path from "path";

// Define your DB interface here or import it
import type { DB } from "@/types/schema";


const dbPath = path.resolve(process.cwd(), "data.db");
const sqliteDb = new Database(dbPath);

const db = new Kysely<DB>({
  dialect: new SqliteDialect({ database: sqliteDb }),
});

export default db;