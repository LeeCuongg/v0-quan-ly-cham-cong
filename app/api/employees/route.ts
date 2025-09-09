import { NextResponse } from "next/server"
import { getAllEmployees } from "@/lib/database-mongodb"

export async function GET() {
  try {
    const employees = await getAllEmployees()
    return NextResponse.json(employees)
  } catch (error) {
    console.error("[v0] Get employees error:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}
