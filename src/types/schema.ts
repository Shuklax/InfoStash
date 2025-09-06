// src/types/schema.ts
import type { ColumnType } from "kysely";

// Companies table
export interface CompaniesTable {
  domain: ColumnType<string, string, string>; // PK
  name: ColumnType<string | null, string | null, string | null>;
  category: ColumnType<string | null, string | null, string | null>;
  country: ColumnType<string | null, string | null, string | null>;
  city: ColumnType<string | null, string | null, string | null>;
}

// Technologies table
export interface TechnologiesTable {
  name: ColumnType<string, string, string>; // PK
  category: ColumnType<string | null, string | null, string | null>;
}

// Company - Technology join table
export interface CompanyTechTable {
  domain: ColumnType<string, string, string>;     // FK → companies.domain
  tech_name: ColumnType<string, string, string>;  // FK → technologies.name
}

// Kysely DB schema interface
export interface DB {
  companies: CompaniesTable;
  technologies: TechnologiesTable;
  company_tech: CompanyTechTable;
}
