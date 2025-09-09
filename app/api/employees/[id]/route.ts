import { NextResponse } from "next/server"
import { sampleEmployees } from "@/lib/database"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { hourlyRate } = await request.json()
    const employeeIndex = sampleEmployees.findIndex((emp) => emp.id === params.id)

    if (employeeIndex === -1) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    sampleEmployees[employeeIndex].hourlyRate = hourlyRate

    return NextResponse.json(sampleEmployees[employeeIndex])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 })
  }
}
