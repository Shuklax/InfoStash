import { Kysely, SqliteDialect } from "kysely";
import Database from "better-sqlite3";
import path from "path";

// Define your DB interface here or import it
import type {DB} from "@/types/schema";

//finds the data.db file in the root directory
const dbPath = path.resolve(process.cwd(), "data.db");

//initializes a better-sqlite3 instance for kysely
const sqliteDb = new Database(dbPath);

//creates a kysely databsse instance
const db = new Kysely<DB>({
  dialect: new SqliteDialect({ database: sqliteDb }),
});

export default db;