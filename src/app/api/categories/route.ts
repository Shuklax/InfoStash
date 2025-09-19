import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from 'kysely'
import {z} from "zod";

// Schema for categories validation (we're gonna get an array of these)
const CategorySchema = z.object({
  value: z.string(),
  label: z.string()
})

interface DatabaseSchema {
  companies: {
    category: string | null
  }
}

//initialize the DB instance using better-sqlite3
//we initialize an instance as we have to do DB operations (we have to get categories)
const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: new Database('data.db')
  })
})

export async function GET(){
    const rows = await db
      .selectFrom('companies')
      .select('category')
      .distinct()
      .where('category', 'is not', null)
      .execute()
   
    const categories = rows.map(row => ({
      value: row.category!,
      label: row.category!
    }))
    
    // Validate categories
    const validatedCategories = z.array(CategorySchema).parse(categories)
   
    return NextResponse.json(validatedCategories);
}