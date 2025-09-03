import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from 'kysely'
import {z} from "zod";

const TechSchema = z.object({
  value: z.string(),
  label: z.string()
})

interface DatabaseSchema {
  technologies: {
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
      .selectFrom('technologies')
      .select('name')
      .distinct()
      .where('name', 'is not', null)
      .execute()
    
    const countries = rows.map(row => ({
      value: row.name!,
      label: row.name!
    }))

    const validatedTechnologies = z.array(TechSchema).parse(countries)
    
    return NextResponse.json(validatedTechnologies);
}