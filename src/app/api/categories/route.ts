import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from 'kysely'
import {z} from "zod";

// Schema for categories (not countries)
const CategorySchema = z.object({
  value: z.string(),
  label: z.string()
})

interface DatabaseSchema {
  companies: {
    country: string | null
    category: string | null
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
      .select('category')
      .distinct()
      .where('category', 'is not', null)
      .execute()
   
    const categories = rows.map(row => ({
      value: row.category!,
      label: row.category!
    }))
    
    // Validate categories (not countries)
    const validatedCategories = z.array(CategorySchema).parse(categories)
   
    return NextResponse.json(validatedCategories);
}