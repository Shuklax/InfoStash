import Database from 'better-sqlite3'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const db = new Database('data.db')
    const result = db.prepare(`SELECT COUNT(*) as count FROM companies LIMIT 1`).get() as { count: number }
    db.close()
    return NextResponse.json({ hasData: result.count > 0 })
  } catch {
    return NextResponse.json({ hasData: false })
  }
}