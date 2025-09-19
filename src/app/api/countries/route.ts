import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from 'kysely'
import {z} from "zod";

// Schema for countries validation (we're gonna get an array of these)
const CountrySchema = z.object({
  value: z.string(),
  label: z.string()
})

interface DatabaseSchema {
  companies: {
    country: string | null
  }
}

//initialize the DB instance using better-sqlite3
//we initialize an instance as we have to do DB operations (we have to get countries)
const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: new Database('data.db')
  })
})

export async function GET(){
    const rows = await db
      .selectFrom('companies')
      .select('country')
      .distinct()
      .where('country', 'is not', null)
      .execute()
    
    const countries = rows.map(row => ({
      value: row.country!,
      label: row.country!
    }))

    // Validate countries
    const validatedCountries = z.array(CountrySchema).parse(countries)
    
    return NextResponse.json(validatedCountries);
}