import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from 'kysely'
import {z} from "zod";

// Schema for names of companies
const NameSchema = z.object({
  value: z.string(),
  label: z.string()
})

interface DatabaseSchema {
  companies: {
    name: string | null
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
      .select('name')
      .distinct()
      .where('name', 'is not', null)
      .execute()
   
    const names = rows.map(row => ({
      value: row.name!,
      label: row.name!
    }))
    
    // Validate names 
    const validatedNames = z.array(NameSchema).parse(names)
   
    return NextResponse.json(validatedNames);
}