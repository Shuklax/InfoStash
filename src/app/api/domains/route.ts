import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from 'kysely'
import {z} from "zod";

// Schema for domains of companies
const DomainSchema = z.object({
  value: z.string(),
  label: z.string()
})

interface DatabaseSchema {
  companies: {
    domain: string | null
  }
}

const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: new Database('data.db')
  })
})

export async function GET(){
    const rows = await db
      .selectFrom('companies')
      .select('domain')
      .distinct()
      .where('domain', 'is not', null)
      .execute()
   
    const domains = rows.map(row => ({
      value: row.domain!,
      label: row.domain!
    }))
    
    // Validate domains 
    const validatedDomains = z.array(DomainSchema).parse(domains)
   
    return NextResponse.json(validatedDomains);
}