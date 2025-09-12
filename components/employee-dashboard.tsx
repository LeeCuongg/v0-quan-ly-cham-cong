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
      const statsResponse = await fetch("/api/dashboard/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setDashboardStats(statsData)
      }

      // Fetch recent activities from timesheets
      const today = new Date().toISOString().split("T")[0]
      const timesheetsResponse = await fetch(`/api/timesheets?startDate=${today}&endDate=${today}`)
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
    } catch (error) {
      console.error("Error fetching manager data:", error)
    } finally {
      setLoading(false)
    }
  }

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
    if (timeString.includes("T")) {
      return new Date(timeString).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
    return timeString.slice(0, 5)
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
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Hoạt động gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 text-sm">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              activity.type === "checkin" ? "bg-secondary" : "bg-accent"
                            }`}
                          ></div>
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">{activity.employeeName}</span>{" "}
                            {activity.action}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Không có hoạt động nào hôm nay</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thông báo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardStats?.currentlyWorking && dashboardStats.currentlyWorking > 0 ? (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Có {dashboardStats.currentlyWorking} nhân viên đang làm việc
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Hiện tại không có nhân viên nào đang làm việc</p>
                      </div>
                    )}
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Tổng giờ làm việc hôm nay: {dashboardStats?.totalHoursToday?.toFixed(1) || "0.0"} giờ
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
