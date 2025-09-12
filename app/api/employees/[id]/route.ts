import { NextResponse } from "next/server"
import { updateUser } from "@/lib/database"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { hourlyRate } = await request.json()

    const updatedEmployee = await updateUser(params.id, { hourly_rate: hourlyRate })

    if (!updatedEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 })
  }
}
