import { NextResponse } from "next/server"
import { sampleEmployees } from "@/lib/database"

export async function GET() {
  try {
    return NextResponse.json(sampleEmployees)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}
