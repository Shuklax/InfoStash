// src/types/schema.ts

export interface CompaniesTable {
  domain: string;    // primary key
  name: string | null;
  category: string | null;
  country: string | null;
  city: string | null;
}

export interface TechnologiesTable {
  name: string;      // primary key
  category: string | null;
}

export interface CompanyTechTable {
  domain: string;    // foreign key → companies.domain
  tech_name: string; // foreign key → technologies.name
}

/**
 * Kysely DB schema interface
 */
export interface DB {
  companies: CompaniesTable;
  technologies: TechnologiesTable;
  company_tech: CompanyTechTable;
}
