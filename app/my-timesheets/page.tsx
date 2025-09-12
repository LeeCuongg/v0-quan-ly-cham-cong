"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProtectedPage } from "@/components/protected-page"
import { useAuth } from "@/components/auth-provider"
import { Calendar, Clock, DollarSign } from "lucide-react"

interface Timesheet {
  id: number
  employeeId: number
  employeeName: string
  date: string
  checkIn: string
  checkOut: string
  totalHours: number
  salary: number
}

interface Summary {
  totalHours: number
  totalSalary: number
  totalDays: number
}

export default function MyTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [summary, setSummary] = useState<Summary>({ totalHours: 0, totalSalary: 0, totalDays: 0 })
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { user } = useAuth()

  useEffect(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setStartDate(firstDay.toISOString().split("T")[0])
    setEndDate(lastDay.toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate && user) {
      fetchTimesheets()
    }
  }, [startDate, endDate, user])

  const fetchTimesheets = async () => {
    if (!user) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      })

      const response = await fetch(`/api/my-timesheets?${params}`)
      const data = await response.json()

      if (response.ok) {
        setTimesheets(data.timesheets)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Error fetching timesheets:", error)
    } finally {
      setLoading(false)
    }
  }

  const setQuickRange = (range: "week" | "month") => {
    const now = new Date()

    if (range === "week") {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6))
      setStartDate(startOfWeek.toISOString().split("T")[0])
      setEndDate(endOfWeek.toISOString().split("T")[0])
    } else {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setStartDate(firstDay.toISOString().split("T")[0])
      setEndDate(lastDay.toISOString().split("T")[0])
    }
  }

  return (
    <ProtectedPage requiredRole="employee">
      <main className="p-4 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lịch sử chấm công</h1>
            <p className="text-muted-foreground">Xem lại thời gian làm việc của bạn</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng giờ làm</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalHours}h</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng lương</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalSalary.toLocaleString("vi-VN")}đ</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Số ngày làm</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalDays}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setQuickRange("week")}>
                  Tuần này
                </Button>
                <Button variant="outline" onClick={() => setQuickRange("month")}>
                  Tháng này
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Từ ngày</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Đến ngày</Label>
                  <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timesheets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Bảng chấm công</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : timesheets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không có dữ liệu chấm công trong khoảng thời gian này
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Ngày</th>
                        <th className="text-left p-2">Check In</th>
                        <th className="text-left p-2">Check Out</th>
                        <th className="text-left p-2">Tổng giờ</th>
                        <th className="text-left p-2">Lương</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timesheets.map((timesheet) => (
                        <tr key={timesheet.id} className="border-b">
                          <td className="p-2">{new Date(timesheet.date).toLocaleDateString("vi-VN")}</td>
                          <td className="p-2">{timesheet.checkIn || "-"}</td>
                          <td className="p-2">{timesheet.checkOut || "-"}</td>
                          <td className="p-2">{timesheet.totalHours}h</td>
                          <td className="p-2">{timesheet.salary.toLocaleString("vi-VN")}đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedPage>
  )
}
