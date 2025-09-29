import fs from "fs";
import path from "path";
import JSZip from "jszip";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import dayjs from "dayjs";

import { fileURLToPath } from "url";
import { dirname } from "path";

// using custom names as __filename and __dirname are not available in ES modules
//import.meta.url gives the file URL of the current module but is an ESM features
//Jest run tests in a commonJS environmet by default
const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = dirname(FILENAME);

export { FILENAME, DIRNAME };

//reference the db file in the root directory
const DB_FILE = path.join(DIRNAME, "../data.db");
//download link to the dataset zip file
const DATASET_URL =
  "https://huggingface.co/datasets/Built-with/InfoStash/resolve/main/sample-data.zip";

// interface of how our DBs will look like
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

// Decode UTF-16LE NDJSON (newline-delimited JSON) and remove BOM if present
export function decodeUTF16NDJSON(buffer: Uint8Array) {
  let text = new TextDecoder("utf-16le").decode(buffer);
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

// Safely parse JSON with minor corrections (remove trailing commas)
export function safeJSONParse(raw: string) {
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  raw = raw.replace(/,\s*([\]}])/g, "$1").trim();
  return JSON.parse(raw);
}

// --- Main ---
async function main() {
  console.log("Downloading dataset...");

  const res = await fetch(DATASET_URL);
  if (!res.ok) {
    throw new Error(
      `Failed to download dataset: ${res.status} ${res.statusText}`
    );
  }

  //converting the response to a Array buffer
  //then into a buffer that JSZip can read i.e., NodeJS Buffer
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log("Unzipping dataset...");
  //binary data ready to be used with JSZip
  //loading the zip file from the binary buffer async
  const zip = await JSZip.loadAsync(buffer);

  //zip is JSZip object with all the files and folders from the archive

  //reading the files from the zip object
  //if the file is not found, throw an error
  //async because JSZip works asyncly
  const metaDataFile = zip.file("metaData.sample.json");
  const techDataFile = zip.file("techData.sample.json");
  const techIndexFile = zip.file("techIndex.sample.json");

  if (!metaDataFile || !techDataFile || !techIndexFile) {
    throw new Error("Required files missing from zip archive");
  }

  //extracting the file contents as buffers or strings
  //metaData and techData are UTF-16LE NDJSON files
  //techIndex is a standard JSON file but may have trailing commas
  const metaDataBuffer = await metaDataFile.async("uint8array");
  const techDataBuffer = await techDataFile.async("uint8array");
  const techIndexRaw = await techIndexFile.async("string");

  //decoding and parsing the file contents
  //metaData and techData are arrays of objects
  //techIndex is an array of objects
  const metaData = decodeUTF16NDJSON(metaDataBuffer);
  const techData = decodeUTF16NDJSON(techDataBuffer);
  const techIndex = safeJSONParse(techIndexRaw);

  // If DB file exists, remove it to start fresh
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);

  console.log("Setting up SQLite database...");
  // Initialize Kysely with better-sqlite3
  const betterSqlite = new Database(DB_FILE);
  const db = new Kysely<DB>({
    dialect: new SqliteDialect({ database: betterSqlite }),
  });

  // --- Create Tables ---
  console.log("Creating tables...");

  // companies table with domain as primary key
  //derived from mataData which contains company info
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

  // technologies table with name as primary key
  //derived from techIndex which contains known technologies
  await db.schema
    .createTable("technologies")
    .addColumn("name", "text", (col) => col.primaryKey())
    .addColumn("category", "text")
    .addColumn("premium", "text")
    .addColumn("description", "text")
    .execute();

  // company_tech junction table with foreign keys to companies and technologies
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
  let companiesInserted = 0;
  for (const c of metaData) {
    if (!c.D) continue;
    await db
      .insertInto("companies")
      .values({
        domain: c.D,
        name: c.CN || null,
        phone: Array.isArray(c.T) ? c.T.join(", ") : c.T || null,
        city: c.C || null,
        category: c.CAT || null,
        state: c.ST || null,
        country: c.CO || null,
        zipcode: c.Z || null,
      })
      .execute();
    companiesInserted++;
  }
  console.log(`Inserted ${companiesInserted} companies`);

  // --- Insert Technologies from Index ---
  console.log("Inserting technologies from index...");
  let techIndexInserted = 0;
  for (const t of techIndex) {
    if (!t.Name) continue;
    await db
      .insertInto("technologies")
      .values({
        name: t.Name,
        category: t.Category || null,
        premium: t.Premium || null,
        description: t.Description || null,
      })
      .execute();
    techIndexInserted++;
  }
  console.log(`Inserted ${techIndexInserted} technologies from techIndex`);

  console.log("Analyzing tech relationships for missing technologies...");
  const allTechsFromData = new Set<string>();

  // Valid company domains for quick lookup
  const validCompanyDomains = new Set(
    (await db.selectFrom("companies").select("domain").execute()).map(
      (c) => c.domain
    )
  );

  //iterates over techData (domains with tech being used in them)
  for (const c of techData) {
    //domains that are not in both tables are skipped (domain is a PK)
    if (!c.D || !validCompanyDomains.has(c.D)) continue;
    //if the associated technology list is missing or not an array, skip
    if (!Array.isArray(c.T)) continue;

    //add each technology name to the set after trimming whitespace
    for (const tech of c.T) {
      if (tech.N && tech.N.trim()) {
        allTechsFromData.add(tech.N.trim());
      }
    }
  }

  // Fetch existing technology names from the DB to avoid duplicates
  //creates a set of existing technology names for quick lookup
  const existingTechNames = new Set(
    (await db.selectFrom("technologies").select("name").execute()).map(
      (t) => t.name
    )
  );

  // Check which techs are missing from our technologies table
  const missingTechs = Array.from(allTechsFromData).filter(
    (techName) => !existingTechNames.has(techName)
  );

  console.log(
    `Found ${missingTechs.length} missing technologies, inserting them...`
  );

  // Insert all missing technologies at once
  if (missingTechs.length > 0) {
    for (const techName of missingTechs) {
      await db
        .insertInto("technologies")
        .values({
          name: techName,
          category: null,
          premium: null,
          description: null,
        })
        .execute();
    }
  }

  // Check which domains from techData are missing from companies table
  console.log("Analyzing domains for missing companies...");
  const allDomainsFromTechData = new Set<string>();

  // Collect all domains from techData
  for (const c of techData) {
    if (c.D && c.D.trim()) {
      allDomainsFromTechData.add(c.D.trim());
    }
  }

  // Check which domains are missing from our companies table
  const missingDomains = Array.from(allDomainsFromTechData).filter(
    (domain) => !validCompanyDomains.has(domain)
  );

  console.log(
    `Found ${missingDomains.length} missing domains, inserting them as companies...`
  );

  // Insert all missing domains as companies with null values for other fields
  if (missingDomains.length > 0) {
    for (const domain of missingDomains) {
      await db
        .insertInto("companies")
        .values({
          domain: domain,
          name: null,
          phone: null,
          city: null,
          category: null,
          state: null,
          country: null,
          zipcode: null,
        })
        .execute();
    }

    // Update the validCompanyDomains set to include newly inserted domains
    for (const domain of missingDomains) {
      validCompanyDomains.add(domain);
    }
  }

  // --- Now insert company-tech relationships ---
  console.log("Inserting company_tech relationships...");
  let relationshipsInserted = 0;
  let skippedCompanies = 0;
  let skippedTechs = 0;

  for (const c of techData) {
    if (!c.D || !validCompanyDomains.has(c.D)) {
      skippedCompanies++;
      continue;
    }
    if (!Array.isArray(c.T)) continue;

    for (const tech of c.T) {
      if (!tech.N || !tech.N.trim()) {
        skippedTechs++;
        continue;
      }

      try {
        await db
          .insertInto("company_tech")
          .values({
            domain: c.D,
            tech_name: tech.N.trim(),
            first_detected: tech.FD ? dayjs(tech.FD).toISOString() : null,
            last_detected: tech.LD ? dayjs(tech.LD).toISOString() : null,
          })
          .execute();
        relationshipsInserted++;
      } catch (error) {
        console.error(
          `Failed to insert relationship: ${c.D} -> ${tech.N}:`,
          error
        );
        skippedTechs++;
      }
    }
  }

  // --- Create indexes for better query performance ---
  //speeds up queries that search, filter, or join by the domain column in the company_tech table
  //and by country and category in the companies table
  //indexes improve read performance at the cost of slower writes and increased storage
  console.log("Creating indexes...");
  await db.schema
    .createIndex("idx_company_tech_domain")
    .on("company_tech")
    .column("domain")
    .execute();
  await db.schema
    .createIndex("idx_company_tech_tech_name")
    .on("company_tech")
    .column("tech_name")
    .execute();
  await db.schema
    .createIndex("idx_companies_country")
    .on("companies")
    .column("country")
    .execute();
  await db.schema
    .createIndex("idx_companies_category")
    .on("companies")
    .column("category")
    .execute();

  // --- Final verification ---
  console.log("Performing final verification...");
  const finalCounts = await Promise.all([
    db
      .selectFrom("companies")
      .select(db.fn.count("domain").as("count"))
      .executeTakeFirst(),
    db
      .selectFrom("technologies")
      .select(db.fn.count("name").as("count"))
      .executeTakeFirst(),
    db
      .selectFrom("company_tech")
      .select(db.fn.count("domain").as("count"))
      .executeTakeFirst(),
  ]);

  console.log(`
Setup completed successfully!
- Companies: ${finalCounts[0]?.count}
- Technologies: ${finalCounts[1]?.count}
- Relationships: ${finalCounts[2]?.count}
- Skipped companies: ${skippedCompanies}
- Skipped techs: ${skippedTechs}
  `);

  // Test query to verify relationships are working
  const testQuery = await db
    .selectFrom("companies")
    .leftJoin("company_tech", "companies.domain", "company_tech.domain")
    .select((eb) => [
      "companies.domain",
      "companies.name",
      eb.fn.count("company_tech.tech_name").as("tech_count"),
    ])
    .groupBy(["companies.domain", "companies.name"])
    .orderBy("tech_count", "desc")
    .limit(5)
    .execute();

  console.log("\nTop 5 companies by technology count:");
  testQuery.forEach((row, i) => {
    console.log(
      `${i + 1}. ${row.name || row.domain}: ${row.tech_count} technologies`
    );
  });

  //destroy the Kysely instance to close the underlying better-sqlite3 connection
  //to release resources and close active connections
  await db.destroy();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
