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

//DB_FILE stores the path to the SQLite database file
const DB_FILE = path.join(__dirname, "../data.db");

//S3 link from where the zipped dataset is to be downloaded
const DATASET_URL =
  "https://fiber-challenges.s3.us-east-1.amazonaws.com/sample-data.zip";

// --- DB Type ---
interface DB {
  //contents of metaData file to be stored in companies DB
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

  //contents of techIndex file to be stored in technologies DB
  technologies: {
    name: string;
    category: string | null;
    premium: string | null;
    description: string | null;
  };

  //contents of techData file to be stored in company_tech DB
  company_tech: {
    domain: string;
    tech_name: string;
    first_detected: string | null;
    last_detected: string | null;
  };
}

// --- Helpers ---
// Function to decode UTF-16LE NDJSON files and strip the byte order mark (BOM) if present
function decodeUTF16NDJSON(buffer: Uint8Array) {
  let text = new TextDecoder("utf-16le").decode(buffer);
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

// Function to safely parse JSON and handle trailing commas
function safeJSONParse(raw: string) {
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  raw = raw.replace(/,\s*([\]}])/g, "$1").trim();
  return JSON.parse(raw);
}

// --- Main ---
async function main() {
  console.log("Downloading dataset...");

  //fetching the zipped dataset from S3 link
  const res = await fetch(DATASET_URL);
  if (!res.ok) {
    throw new Error(
      `Failed to download dataset: ${res.status} ${res.statusText}`
    );
  }

  //zipped files are in binary, so we read through this binary data stream
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log("Unzipping dataset...");
  const zip = await JSZip.loadAsync(buffer);

  //assigning the files to variables after unzipping them
  const metaDataFile = zip.file("metaData.sample.json");
  const techDataFile = zip.file("techData.sample.json");
  const techIndexFile = zip.file("techIndex.sample.json");

  //checking whether these files are empty or not
  if (!metaDataFile || !techDataFile || !techIndexFile) {
    throw new Error("Required files missing from zip archive");
  }

  //asynchronously extract the contents as uint8array
  const metaDataBuffer = await metaDataFile.async("uint8array");
  const techDataBuffer = await techDataFile.async("uint8array");
  //techIndex is a normal json file, so we extract it as string
  const techIndexRaw = await techIndexFile.async("string");

  //metaData and techData are in NDJSON format with UTF-16LE encoding
  //so we decode them using our helper function
  const metaData = decodeUTF16NDJSON(metaDataBuffer);
  const techData = decodeUTF16NDJSON(techDataBuffer);
  //techIndex is a normal json file, so we parse it using our helper function
  const techIndex = safeJSONParse(techIndexRaw);

  //if the DB file already exists, we delete it to start fresh
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);

  console.log("Setting up SQLite database...");
  // Initialize Kysely with better-sqlite3
  const betterSqlite = new Database(DB_FILE);
  const db = new Kysely<DB>({
    dialect: new SqliteDialect({ database: betterSqlite }),
  });

  // --- Create Tables ---
  console.log("Creating tables...");
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
    //if primary key is missing, we skip that entry
    if (!c.D) continue; // domain is mandatory PK
    await db
      .insertInto("companies")
      .values({
        //other than the primary key field, everything can be null
        domain: c.D,
        name: c.CN || null,
        //flattening of the array of phone numbers into a single comma-separated string
        phone: Array.isArray(c.T) ? c.T.join(", ") : c.T || null,
        city: c.C || null,
        category: c.CAT || null,
        state: c.ST || null,
        country: c.CO || null,
        zipcode: c.Z || null,
      })
      .execute();
  }

  // --- Insert Technologies ---
  console.log("Inserting technologies...");
  for (const t of techIndex) {
    if (!t.Name) continue;
    await db
      .insertInto("technologies")
      .values({
        //other than the primary key field, everything can be null
        name: t.Name,
        category: t.Category || null,
        premium: t.Premium || null,
        description: t.Description || null,
      })
      .execute();
  }

  // --- Build lookup sets ---
  //these sets are later used to query the database to get all existing company domains and technology names
  //Convert to Sets for O(1) lookup performance instead of O(n) array searches
  //Purpose: These sets will be used later to validate relationships before inserting them.
  const companyDomains = new Set(
    (await db.selectFrom("companies").select("domain").execute()).map(
      (c) => c.domain
    )
  );
  const techNames = new Set(
    (await db.selectFrom("technologies").select("name").execute()).map(
      (t) => t.name
    )
  );

  // --- Insert Company-Tech relationships ---
  console.log("Inserting company_tech...");
  let inserted = 0,
    skippedCompanies = 0,
    skippedTechs = 0;

  for (const c of techData) {
    //if domain is not present in techData or companyDomains set, we skip that entry
    if (!c.D || !companyDomains.has(c.D)) {
      skippedCompanies++;
      continue;
    }
    //if T field is not an array, we skip that entry
    if (!Array.isArray(c.T)) continue;


    for (const tech of c.T) {
      //if tech name is not present in techData or techNames set, we skip that entry
     if (!techNames.has(tech.N)) {
  // Insert missing tech
  await db.insertInto("technologies").values({
    name: tech.N,
    category: null,
    premium: null, 
    description: null,
  }).execute();
  techNames.add(tech.N); // Update the Set
}
      await db
        .insertInto("company_tech")
        .values({
          domain: c.D,
          tech_name: tech.N,
          //converting a date field to ISO format with a null fallback
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
  //close the database connection and cleans up resources
  await db.destroy();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
