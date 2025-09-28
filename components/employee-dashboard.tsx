"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import {
  Clock,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  LogIn,
  User,
  BarChart3,
  Users,
  UserCheck,
  Activity,
} from "lucide-react"
import Link from "next/link"

interface EmployeeStats {
  weekStats: {
    totalHours: number
    totalSalary: number
    avgHoursPerDay: number
    daysWorkedThisMonth: number
  }
}

interface CheckinStatus {
  hasActiveSession: boolean
  checkInTime?: string
  status: "not-checked-in" | "working" | "can-checkin-again"
  totalSessions: number
}

interface DashboardStats {
  totalEmployees: number
  currentlyWorking: number
  totalHoursToday: number
  totalSalaryCost: number
}

interface RecentActivity {
  id: string
  employeeName: string
  action: string
  time: string
  type: "checkin" | "checkout"
}

export function EmployeeDashboard() {
  const { user, isEmployee, isManager } = useAuth()
  const [stats, setStats] = useState<EmployeeStats | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>({
    hasActiveSession: false,
    status: "not-checked-in",
    totalSessions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [overtimeInfo, setOvertimeInfo] = useState({
    todayOvertime: 0,
    weekOvertime: 0,
    monthOvertime: 0,
    overtimePay: 0,
    weekOvertimePay: 0,
  })

  // Manager calendar / filters
  const [employeesList, setEmployeesList] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"month" | "week">("month") // default month
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [timesheetByDate, setTimesheetByDate] = useState<Record<string, any[]>>({})

  useEffect(() => {
    if (isEmployee && user) {
      fetchEmployeeData()
    } else if (isManager && user) {
      fetchManagerData()
    }
  }, [isEmployee, isManager, user])

  const fetchEmployeeData = async () => {
    try {
      // Fetch employee stats
      const statsResponse = await fetch("/api/my-stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      const statusResponse = await fetch("/api/checkout")
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()

        if (statusData.hasActiveSession) {
          setCheckinStatus({
            hasActiveSession: true,
            checkInTime: statusData.checkInTime,
            status: "working",
            totalSessions: statusData.totalSessions || 0,
          })
        } else if (statusData.hasCheckedIn) {
          setCheckinStatus({
            hasActiveSession: false,
            status: "can-checkin-again",
            totalSessions: statusData.totalSessions || 0,
          })
        } else {
          setCheckinStatus({
            hasActiveSession: false,
            status: "not-checked-in",
            totalSessions: 0,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching employee data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchManagerData = async () => {
    try {
      // Fetch dashboard stats
      const params = new URLSearchParams()
      if (selectedEmployee && selectedEmployee !== 'all') params.set('employeeId', selectedEmployee)
      const statsResponse = await fetch(`/api/dashboard/stats?${params.toString()}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setDashboardStats(statsData)
      }

      // Fetch recent activities from timesheets
  const today = new Date().toISOString().split("T")[0]
  const tsParams = new URLSearchParams({ startDate: today, endDate: today })
  if (selectedEmployee && selectedEmployee !== 'all') tsParams.set('employeeId', selectedEmployee)
  const timesheetsResponse = await fetch(`/api/timesheets?${tsParams.toString()}`)
      if (timesheetsResponse.ok) {
        const timesheetsData = await timesheetsResponse.json()

  // Transform timesheets to recent activities
        const activities: RecentActivity[] = []
        timesheetsData.forEach((timesheet: any) => {
          if (timesheet.check_in_time) {
            activities.push({
              id: `${timesheet.id}-checkin`,
              employeeName: timesheet.employee_name,
              action: `đã check-in lúc ${formatTime(timesheet.check_in_time)}`,
              time: timesheet.check_in_time,
              type: "checkin",
            })
          }
          if (timesheet.check_out_time) {
            activities.push({
              id: `${timesheet.id}-checkout`,
              employeeName: timesheet.employee_name,
              action: `đã check-out lúc ${formatTime(timesheet.check_out_time)}`,
              time: timesheet.check_out_time,
              type: "checkout",
            })
          }
        })

        // Sort by time and take latest 5
        activities.sort((a, b) => b.time.localeCompare(a.time))
        setRecentActivities(activities.slice(0, 5))
      }
      // fetch employees for filter
      try {
        const empRes = await fetch('/api/employees')
        if (empRes.ok) {
          const empData = await empRes.json()
          setEmployeesList(empData)
        }
      } catch (e) {
        console.error('Failed to fetch employees for manager calendar', e)
      }
    } catch (error) {
      console.error("Error fetching manager data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Helpers for calendar
  const toYMD = (d: Date) => d.toISOString().split('T')[0]

  const getRangeForView = (date: Date) => {
    if (viewMode === 'week') {
      // find Monday
      const day = date.getDay() // 0 Sun .. 6 Sat
      const diffToMon = (day + 6) % 7 // days to subtract to get Monday
      const mon = new Date(date)
      mon.setDate(date.getDate() - diffToMon)
      const start = new Date(mon)
      const end = new Date(mon)
      end.setDate(mon.getDate() + 6)
      return { start: toYMD(start), end: toYMD(end) }
    }
    // month
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return { start: toYMD(start), end: toYMD(end) }
  }

  const fetchCalendarTimesheets = async () => {
    try {
      const { start, end } = getRangeForView(currentDate)
      const params = new URLSearchParams({ startDate: start, endDate: end })
      if (selectedEmployee && selectedEmployee !== 'all') params.set('employeeId', selectedEmployee)
      const res = await fetch(`/api/timesheets?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      // group by date (yyyy-mm-dd)
      const map: Record<string, any[]> = {}
      data.forEach((ts: any) => {
        const d = (ts.date || ts.check_in?.split('T')?.[0] || ts.check_in_time?.split('T')?.[0] || toYMD(new Date()))
        if (!map[d]) map[d] = []
        map[d].push(ts)
      })
      setTimesheetByDate(map)
    } catch (e) {
      console.error('Error fetching calendar timesheets', e)
    }
  }

  useEffect(() => {
    if (isManager && user) {
      fetchCalendarTimesheets()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee, viewMode, currentDate, isManager, user])

  // When selectedEmployee changes, also refetch manager-level stats and recent activities
  useEffect(() => {
    if (isManager && user) {
      fetchManagerData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee])

  // Build calendar cells for rendering
  const buildCalendarCells = () => {
    const cells: Date[] = []
    if (viewMode === 'week') {
      // start from Monday
      const day = currentDate.getDay()
      const diffToMon = (day + 6) % 7
      const mon = new Date(currentDate)
      mon.setDate(currentDate.getDate() - diffToMon)
      for (let i = 0; i < 7; i++) {
        const d = new Date(mon)
        d.setDate(mon.getDate() + i)
        cells.push(d)
      }
      return cells
    }

    // month view: show 6 weeks (42 cells) starting from Monday of the first week
    const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startDay = firstOfMonth.getDay()
    const diffToMon = (startDay + 6) % 7
    const start = new Date(firstOfMonth)
    start.setDate(firstOfMonth.getDate() - diffToMon)

    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      cells.push(d)
    }
    return cells
  }

  const prev = () => {
    const d = new Date(currentDate)
    if (viewMode === 'week') {
      d.setDate(d.getDate() - 7)
    } else {
      d.setMonth(d.getMonth() - 1)
    }
    setCurrentDate(d)
  }

  const next = () => {
    const d = new Date(currentDate)
    if (viewMode === 'week') {
      d.setDate(d.getDate() + 7)
    } else {
      d.setMonth(d.getMonth() + 1)
    }
    setCurrentDate(d)
  }

  const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + 'đ'


  const fetchOvertimeInfo = async () => {
    try {
      const response = await fetch("/api/my-stats/overtime")
      if (response.ok) {
        const data = await response.json()
        setOvertimeInfo(data)
      }
    } catch (error) {
      console.error("Error fetching overtime info:", error)
    }
  }

  const formatTime = (timeString: string) => {
    // Return zero-padded HH:MM (e.g., 08:00) for calendar display
    try {
      if (!timeString) return '--:--'
      if (timeString.includes("T")) {
        const dt = new Date(timeString)
        const h = dt.getHours().toString().padStart(2, '0')
        const m = dt.getMinutes().toString().padStart(2, '0')
        return `${h}:${m}`
      }
      const parts = timeString.split(":")
      if (parts.length >= 2) {
        const h = parts[0].padStart(2, '0')
        const m = parts[1].padStart(2, '0')
        return `${h}:${m}`
      }
      return timeString.slice(0, 5)
    } catch (e) {
      return timeString.slice(0, 5)
    }
  }

  const getStatusBadge = () => {
    switch (checkinStatus.status) {
      case "not-checked-in":
        return (
          <Badge variant="secondary">
            <XCircle className="w-4 h-4 mr-1" />
            Chưa chấm công
          </Badge>
        )
      case "working":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-4 h-4 mr-1" />
            Đang làm việc
          </Badge>
        )
      case "can-checkin-again":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            <Activity className="w-4 h-4 mr-1" />
            Có thể chấm công lại
          </Badge>
        )
    }
  }

  // Manager dashboard
  if (isManager && user) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Quản lý</h1>
          <p className="text-muted-foreground">Tổng quan hệ thống chấm công và quản lý nhân viên</p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Real-time Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng nhân viên</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.totalEmployees || 0}</div>
                  <p className="text-xs text-muted-foreground">Nhân viên đang hoạt động</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đang làm việc</CardTitle>
                  <UserCheck className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{dashboardStats?.currentlyWorking || 0}</div>
                  <p className="text-xs text-muted-foreground">Nhân viên hiện tại</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Giờ làm hôm nay</CardTitle>
                  <Clock className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats?.totalHoursToday?.toFixed(1) || "0.0"}h</div>
                  <p className="text-xs text-muted-foreground">Tổng giờ làm việc</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chi phí lương</CardTitle>
                  <DollarSign className="h-4 w-4 text-chart-1" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-1">
                    {(dashboardStats?.totalSalaryCost || 0).toLocaleString("vi-VN")}đ
                  </div>
                  <p className="text-xs text-muted-foreground">Tổng chi phí hôm nay</p>
                </CardContent>
              </Card>
            </div>

            {/* Manager content */}
            {/* Calendar + Filters for manager */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Lịch chấm công</CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedEmployee}
                    onChange={(e: any) => setSelectedEmployee(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">Tất cả nhân viên</option>
                    {employeesList.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>

                  <div className="flex items-center rounded bg-muted p-0.5">
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-2 py-1 text-sm ${viewMode === 'month' ? 'bg-white rounded' : ''}`}
                    >
                      Tháng
                    </button>
                    <button
                      onClick={() => setViewMode('week')}
                      className={`px-2 py-1 text-sm ${viewMode === 'week' ? 'bg-white rounded' : ''}`}
                    >
                      Tuần
                    </button>
                  </div>

                  <Button variant="outline" onClick={prev}>Prev</Button>
                  <Button variant="outline" onClick={next}>Next</Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
                    <div key={d} className="text-center font-medium py-1">{d}</div>
                  ))}

                  {buildCalendarCells().map((d) => {
                    const ymd = toYMD(d)
                    const entries = timesheetByDate[ymd] || []
                    const isCurrentMonth = d.getMonth() === currentDate.getMonth()
                    const reg = entries.reduce((s, e) => s + (Number(e.regular_pay || e.salary || 0) || 0), 0)
                    const ot = entries.reduce((s, e) => s + (Number(e.overtime_pay || e.overtime_salary || 0) || 0), 0)
                    const total = reg + ot

                    return (
                      <div key={ymd} className={`min-h-[72px] border rounded p-2 ${isCurrentMonth ? '' : 'bg-muted/50 text-muted-foreground'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{d.getDate()}</span>
                          <span className="text-[10px] text-muted-foreground">{ymd}</span>
                        </div>

                        {entries.length === 0 ? (
                          <div className="text-sm text-center text-red-600 font-semibold">Nghỉ</div>
                        ) : (
                          <div className="text-[12px] space-y-1">
                            <div className="font-medium">Ca: {entries.length}</div>
                            <div className="flex flex-col gap-1">
                              {entries.map((e: any, idx: number) => {
                                // Determine start/end times
                                const start = e.check_in_time || (e.check_in && e.check_in.split('T')?.[1]) || e.start_time || ''
                                const end = e.check_out_time || (e.check_out && e.check_out.split('T')?.[1]) || e.end_time || ''
                                const startFmt = start ? formatTime(start) : '--:--'
                                const endFmt = end ? formatTime(end) : '--:--'
                                return (
                                  <div key={e.id || idx} className="flex items-center justify-between">
                                    <div className="text-[13px]">
                                      Ca {e.shift_number || idx + 1}: <span className="font-medium">{startFmt} - {endFmt}</span>
                                    </div>
                                    <div className="text-[12px] text-muted-foreground">
                                      {/* small badges */}
                                      {Number(e.overtime_hours || e.overtimeHours || 0) > 0 && (
                                        <Badge className="bg-orange-100 text-orange-700">OT</Badge>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            <div>LCB: <span className="font-medium">{formatCurrency(reg)}</span></div>
                            <div>OT: <span className="font-medium">{formatCurrency(ot)}</span></div>
                            <div>Tổng: <span className="font-medium">{formatCurrency(total)}</span></div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    )
  }

  // Employee dashboard
  if (!isEmployee || !user) {
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Nhân viên</h1>
          <p className="text-muted-foreground">Chào mừng {user.name}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Nhân viên</h1>
        <p className="text-muted-foreground">Chào mừng {user.name}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giờ tuần này</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weekStats.totalHours || 0}h</div>
            <p className="text-xs text-muted-foreground">
              Trung bình {stats?.weekStats.avgHoursPerDay.toFixed(1) || 0}h/ngày
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lương tuần này</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.weekStats.totalSalary || 0).toLocaleString("vi-VN")}đ</div>
            <p className="text-xs text-muted-foreground">Lương theo giờ: {user.hourlyRate.toLocaleString("vi-VN")}đ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ngày làm tháng này</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weekStats.daysWorkedThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Ngày đã làm việc</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái hôm nay</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {getStatusBadge()}
              {checkinStatus.checkInTime && (
                <p className="text-xs text-muted-foreground">Phiên hiện tại: {checkinStatus.checkInTime}</p>
              )}
              {checkinStatus.totalSessions > 0 && (
                <p className="text-xs text-muted-foreground">Phiên hôm nay: {checkinStatus.totalSessions}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              Chấm công
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Quản lý thời gian làm việc - Hỗ trợ nhiều phiên trong ngày</p>
            <Link href="/checkin">
              <Button className="w-full">Đi đến trang chấm công</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary" />
              Lịch sử chấm công
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Xem lại thời gian làm việc của bạn</p>
            <Link href="/my-timesheets">
              <Button variant="outline" className="w-full bg-transparent">
                Xem lịch sử
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              Thống kê cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Phân tích hiệu suất làm việc</p>
            <Link href="/my-stats">
              <Button variant="outline" className="w-full bg-transparent">
                Xem thống kê
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tóm tắt hôm nay</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Thông tin cá nhân</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Tên: {user.name}</p>
                <p>Email: {user.email}</p>
                <p>Lương theo giờ: {user.hourlyRate.toLocaleString("vi-VN")}đ</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Trạng thái làm việc</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <span>Trạng thái:</span>
                  {getStatusBadge()}
                </div>
                {checkinStatus.checkInTime && <p>Thời gian check-in: {checkinStatus.checkInTime}</p>}
                {checkinStatus.totalSessions > 0 && <p>Số phiên hôm nay: {checkinStatus.totalSessions}</p>}
                <p>Ngày: {new Date().toLocaleDateString("vi-VN")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards with Overtime */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Existing cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giờ làm hôm nay</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weekStats.totalHours || 0}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giờ tuần này</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weekStats.totalHours || 0}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giờ tháng này</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.weekStats.totalSalary || 0).toLocaleString("vi-VN")}đ</div>
          </CardContent>
        </Card>

        {/* New Overtime Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime hôm nay</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overtimeInfo.todayOvertime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">+{overtimeInfo.overtimePay.toLocaleString("vi-VN")}đ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime tuần này</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overtimeInfo.weekOvertime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">+{overtimeInfo.weekOvertimePay.toLocaleString("vi-VN")}đ</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
