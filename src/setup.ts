// src/setup.ts
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
// Get the directory name
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "../data.db");
const DATASET_URL =
  "https://fiber-challenges.s3.us-east-1.amazonaws.com/sample-data.zip";

// helper: decode UTF-16LE NDJSON with BOM
function decodeUTF16NDJSON(buffer: Uint8Array) {
  let text = new TextDecoder("utf-16le").decode(buffer);
  // strip BOM if present
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function safeJSONParse(raw: string) {
  // Strip BOM if present
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

  // Remove trailing commas before array/object close
  raw = raw.replace(/,\s*([\]}])/g, "$1");

  // Trim whitespace
  raw = raw.trim();

  return JSON.parse(raw);
}

async function main() {
  console.log("Downloading dataset...");
  const res = await fetch(DATASET_URL);
  const buffer = Buffer.from(await res.arrayBuffer());

  console.log("Unzipping dataset...");
  const zip = await JSZip.loadAsync(buffer);

  // --- metaData ---
  const metaDataBuffer = await zip
    .file("metaData.sample.json")!
    .async("uint8array");

  const metaData = decodeUTF16NDJSON(metaDataBuffer);
  console.log("metaData parsed");

  // --- techData ---
  const techDataBuffer = await zip
    .file("techData.sample.json")!
    .async("uint8array");
  const techData = decodeUTF16NDJSON(techDataBuffer);
  console.log("techData parsed");

  // --- techIndex (UTF-8 JSON) ---
  const techIndexRaw = await zip.file("techIndex.sample.json")!.async("string");
  const techIndex = safeJSONParse(techIndexRaw);
  console.log("techIndex parsed");

  console.log("Setting up SQLite database...");
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  const db = new Database(DB_FILE);

  db.exec(`
    CREATE TABLE companies (
      domain TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      city TEXT,
      category TEXT,
      state TEXT,
      country TEXT,
      zipcode TEXT
    );

    CREATE TABLE technologies (
      name TEXT PRIMARY KEY,
      category TEXT,
      premium TEXT,
      description TEXT
    );

    CREATE TABLE company_tech (
      domain TEXT,
      tech_name TEXT,
      first_detected TEXT,
      last_detected TEXT,
      FOREIGN KEY(domain) REFERENCES companies(domain),
      FOREIGN KEY(tech_name) REFERENCES technologies(name)
    );
  `);

  const insertCompany = db.prepare(`
    INSERT OR REPLACE INTO companies (domain, name, phone, city, category, state, country, zipcode)
    VALUES (@D, @CN, @T, @C, @CAT, @ST, @CO, @Z)
  `);

  const insertTech = db.prepare(`
    INSERT OR REPLACE INTO technologies (name, category, premium, description)
    VALUES (@Name, @Category, @Premium, @Description)
  `);

  const insertCompanyTech = db.prepare(`
    INSERT INTO company_tech (domain, tech_name, first_detected, last_detected)
    VALUES (@D, @N, @FD, @LD)
  `);

  console.log("Inserting companies...");
  for (const c of metaData) {
    insertCompany.run({
      D: c.D || null,
      CN: c.CN || null,
      T: Array.isArray(c.T) ? c.T.join(", ") : c.T ?? null,
      C: c.C || null,
      CAT: c.CAT || null,
      ST: c.ST || null,
      CO: c.CO || null,
      Z: c.Z || null,
    });
  }

  console.log("Inserting technologies...");
  for (const t of techIndex) insertTech.run(t);

  console.log("Inserting company_tech relationships...");
  const checkCompany = db.prepare("SELECT 1 FROM companies WHERE domain = ?");
  const checkTech = db.prepare("SELECT 1 FROM technologies WHERE name = ?");

  let inserted = 0;
  let skippedCompanies = 0;
  let skippedTechs = 0;

  for (const c of techData) {
    if (!checkCompany.get(c.D)) {
      skippedCompanies++;
      continue; // skip entire company
    }

    for (const tech of c.T) {
      if (!checkTech.get(tech.N)) {
        skippedTechs++;
        continue; // skip this tech
      }

      insertCompanyTech.run({
        D: c.D,
        N: tech.N,
        FD: tech.FD,
        LD: tech.LD,
      });
      inserted++;
    }
  }

  console.log("Setup complete. Database ready at data.db");
  db.close();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
