// src/setup.ts
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { Kysely, SqliteDialect } from "kysely";
import dayjs from "dayjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "../data.db");
const DATASET_URL =
  "https://fiber-challenges.s3.us-east-1.amazonaws.com/sample-data.zip";

// --- DB Type ---
interface DB {
  companies: {
    domain: string;
    name: string | null;
    phone: string | null;
    city: string | null;
    category: string | null;
    state: string | null;
    country: string | null;
    zipcode: string | null;
  };
  technologies: {
    name: string;
    category: string | null;
    premium: string | null;
    description: string | null;
  };
  company_tech: {
    domain: string;
    tech_name: string;
    first_detected: string | null;
    last_detected: string | null;
  };
}

// --- Helpers ---
function decodeUTF16NDJSON(buffer: Uint8Array) {
  let text = new TextDecoder("utf-16le").decode(buffer);
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function safeJSONParse(raw: string) {
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  raw = raw.replace(/,\s*([\]}])/g, "$1").trim();
  return JSON.parse(raw);
}

// --- Main ---
async function main() {
  console.log("Downloading dataset...");
  console.log("Downloading dataset...");
  const res = await fetch(DATASET_URL);
  if (!res.ok) {
    throw new Error(`Failed to download dataset: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log("Unzipping dataset...");
  const zip = await JSZip.loadAsync(buffer);

  const metaDataFile = zip.file("metaData.sample.json");
  const techDataFile = zip.file("techData.sample.json");
  const techIndexFile = zip.file("techIndex.sample.json");
  
  if (!metaDataFile || !techDataFile || !techIndexFile) {
    throw new Error("Required files missing from zip archive");
  }
  
  const metaDataBuffer = await metaDataFile.async("uint8array");
  const techDataBuffer = await techDataFile.async("uint8array");
  const techIndexRaw = await techIndexFile.async("string");
  const metaData = decodeUTF16NDJSON(metaDataBuffer);
  const techData = decodeUTF16NDJSON(techDataBuffer);
  const techIndex = safeJSONParse(techIndexRaw);

  console.log("Setting up SQLite database...");
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);

  const betterSqlite = new Database(DB_FILE);
  const db = new Kysely<DB>({
    dialect: new SqliteDialect({ database: betterSqlite }),
  });

  await db.schema
    .createTable("companies")
    .addColumn("domain", "text", (col) => col.primaryKey())
    .addColumn("name", "text")
    .addColumn("phone", "text")
    .addColumn("city", "text")
    .addColumn("category", "text")
    .addColumn("state", "text")
    .addColumn("country", "text")
    .addColumn("zipcode", "text")
    .execute();

  await db.schema
    .createTable("technologies")
    .addColumn("name", "text", (col) => col.primaryKey())
    .addColumn("category", "text")
    .addColumn("premium", "text")
    .addColumn("description", "text")
    .execute();

  await db.schema
    .createTable("company_tech")
    .addColumn("domain", "text", (col) => col.references("companies.domain"))
    .addColumn("tech_name", "text", (col) =>
      col.references("technologies.name")
    )
    .addColumn("first_detected", "text")
    .addColumn("last_detected", "text")
    .execute();

  // --- Insert Companies ---
  console.log("Inserting companies...");
  for (const c of metaData) {
    if (!c.D) continue; // domain is mandatory PK
    await db.insertInto("companies").values({
      domain: c.D,
      name: c.CN || null,
      phone: Array.isArray(c.T) ? c.T.join(", ") : c.T || null,
      city: c.C || null,
      category: c.CAT || null,
      state: c.ST || null,
      country: c.CO || null,
      zipcode: c.Z || null,
    }).execute();
  }

  // --- Insert Technologies ---
  console.log("Inserting technologies...");
  for (const t of techIndex) {
    if (!t.Name) continue;
    await db.insertInto("technologies").values({
      name: t.Name,
      category: t.Category || null,
      premium: t.Premium || null,
      description: t.Description || null,
    }).execute();
  }

  // --- Build lookup sets ---
  const companyDomains = new Set(
    (await db.selectFrom("companies").select("domain").execute()).map((c) => c.domain)
  );
  const techNames = new Set(
    (await db.selectFrom("technologies").select("name").execute()).map((t) => t.name)
  );

  // --- Insert Company-Tech relationships ---
  console.log("Inserting company_tech...");
  let inserted = 0, skippedCompanies = 0, skippedTechs = 0;

  for (const c of techData) {
    if (!c.D || !companyDomains.has(c.D)) {
      skippedCompanies++;
      continue;
    }
    if (!Array.isArray(c.T)) continue;

    for (const tech of c.T) {
      if (!tech.N || !techNames.has(tech.N)) {
        skippedTechs++;
        continue;
      }
      await db.insertInto("company_tech").values({
        domain: c.D,
        tech_name: tech.N,
        first_detected: tech.FD ? dayjs(tech.FD).toISOString() : null,
        last_detected: tech.LD ? dayjs(tech.LD).toISOString() : null,
      }).execute();
      inserted++;
    }
  }

  console.log(
    `Setup complete. Inserted ${inserted} relationships. Skipped ${skippedCompanies} companies and ${skippedTechs} techs.`
  );
  await db.destroy();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
