// src/setup.ts
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { Kysely, SqliteDialect } from "kysely";
import { z } from "zod";
import dayjs from "dayjs";
import _ from "lodash";

// --- Paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "../data.db");
const DATASET_URL =
  "https://fiber-challenges.s3.us-east-1.amazonaws.com/sample-data.zip";

// --- Schemas ---
const CompanySchema = z.object({
  D: z.string(),
  CN: z.string().nullable().optional(),
  T: z.union([z.array(z.string()), z.string()]).optional(),
  C: z.string().nullable().optional(),
  CAT: z.string().nullable().optional(),
  ST: z.string().nullable().optional(),
  CO: z.string().nullable().optional(),
  Z: z.string().nullable().optional(),
});

const TechSchema = z.object({
  Name: z.string(),
  Category: z.string().nullable().optional(),
  Premium: z.string().nullable().optional(),
  Description: z.string().nullable().optional(),
});

const CompanyTechSchema = z.object({
  D: z.string(),
  N: z.string(),
  FD: z.string().nullable().optional(),
  LD: z.string().nullable().optional(),
});

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

async function main() {
  console.log("Downloading dataset...");
  const res = await fetch(DATASET_URL);
  const buffer = Buffer.from(await res.arrayBuffer());

  console.log("Unzipping dataset...");
  const zip = await JSZip.loadAsync(buffer);

  const metaDataBuffer = await zip
    .file("metaData.sample.json")!
    .async("uint8array");
  const techDataBuffer = await zip
    .file("techData.sample.json")!
    .async("uint8array");
  const techIndexRaw = await zip.file("techIndex.sample.json")!.async("string");

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

  console.log("Inserting companies...");
  for (const c of metaData) {
    const parsed = CompanySchema.safeParse(c);
    if (!parsed.success) {
      console.warn("Skipped invalid company", parsed.error.format());
      continue;
    }

    const cleanCompany = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v])
    ) as Record<string, string | null | string[]>;

    await db
      .insertInto("companies")
      .values({
        domain: cleanCompany.D ?? "", //must be non-null (This is PK)
        name: cleanCompany.CN ?? null,
        phone: Array.isArray(cleanCompany.T)
          ? cleanCompany.T.join(", ")
          : (cleanCompany.T as string | null),
        city: cleanCompany.C ?? null,
        category: cleanCompany.CAT ?? null,
        state: cleanCompany.ST ?? null,
        country: cleanCompany.CO ?? null,
        zipcode: cleanCompany.Z ?? null,
      })
      .execute();
  }

  console.log("Inserting technologies...");
  for (const t of techIndex) {
    const parsed = TechSchema.safeParse(t);
    if (!parsed.success) {
      console.warn("Skipped invalid tech", parsed.error.format());
      continue;
    }
    const cleanTech = _.mapValues(parsed.data, (v) => (v === "" ? null : v));
    await db.insertInto("technologies").values(cleanTech).execute();
  }

  console.log("Inserting company_tech relationships...");
  let inserted = 0;
  let skippedCompanies = 0;
  let skippedTechs = 0;

  for (const c of techData) {
    if (!CompanySchema.shape.D.safeParse(c.D).success) continue;

    const companyExists = await db
      .selectFrom("companies")
      .select("domain")
      .where("domain", "=", c.D)
      .executeTakeFirst();

    if (!companyExists) {
      skippedCompanies++;
      continue;
    }

    for (const tech of c.T) {
      const parsed = CompanyTechSchema.safeParse({ D: c.D, ...tech });
      if (!parsed.success) {
        console.warn("Skipped invalid company_tech", parsed.error.format());
        continue;
      }

      const techExists = await db
        .selectFrom("technologies")
        .select("name")
        .where("name", "=", tech.N)
        .executeTakeFirst();

      if (!techExists) {
        skippedTechs++;
        continue;
      }

      await db
        .insertInto("company_tech")
        .values({
          domain: c.D,
          tech_name: tech.N,
          first_detected: tech.FD ? dayjs(tech.FD).toISOString() : null,
          last_detected: tech.LD ? dayjs(tech.LD).toISOString() : null,
        })
        .execute();

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
