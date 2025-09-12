"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { Clock, Calendar, DollarSign, CheckCircle, XCircle, LogIn, User, BarChart3 } from "lucide-react"
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
  isCheckedIn: boolean
  checkInTime?: string
  status: "not-checked-in" | "working" | "finished"
}

export function EmployeeDashboard() {
  const { user, isEmployee } = useAuth()
  const [stats, setStats] = useState<EmployeeStats | null>(null)
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>({
    isCheckedIn: false,
    status: "not-checked-in",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isEmployee && user) {
      fetchEmployeeData()
    }
  }, [isEmployee, user])

  const fetchEmployeeData = async () => {
    try {
      // Fetch employee stats
      const statsResponse = await fetch("/api/my-stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Check today's status
      const today = new Date().toISOString().split("T")[0]
      const timesheetResponse = await fetch(`/api/my-timesheets?startDate=${today}&endDate=${today}`)
      if (timesheetResponse.ok) {
        const timesheetData = await timesheetResponse.json()

        if (timesheetData.timesheets && timesheetData.timesheets.length > 0) {
          const todayTimesheet = timesheetData.timesheets[0]
          if (todayTimesheet.checkIn && !todayTimesheet.checkOut) {
            setCheckinStatus({
              isCheckedIn: true,
              checkInTime: todayTimesheet.checkIn,
              status: "working",
            })
          } else if (todayTimesheet.checkIn && todayTimesheet.checkOut) {
            setCheckinStatus({
              isCheckedIn: false,
              checkInTime: todayTimesheet.checkIn,
              status: "finished",
            })
          }
        }
      }
    } catch (error) {
      console.error("Error fetching employee data:", error)
    } finally {
      setLoading(false)
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
      case "finished":
        return (
          <Badge variant="outline">
            <CheckCircle className="w-4 h-4 mr-1" />
            Đã hoàn thành
          </Badge>
        )
    }
  }

  // Only show employee dashboard for employees
  if (!isEmployee || !user) {
    return (
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Quản lý</h1>
        <p className="text-muted-foreground">Tổng quan hệ thống chấm công và quản lý nhân viên</p>

        {/* Manager content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Hoạt động gần đây</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span className="text-muted-foreground">Nguyễn Văn An đã check-in lúc 08:15</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-muted-foreground">Trần Thị Bình đã check-out lúc 17:30</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Lê Minh Cường đã check-in lúc 09:00</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Thông báo</h3>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Có 2 nhân viên chưa check-out hôm nay</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Báo cáo tháng này sẽ được tạo vào ngày 30</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
                <p className="text-xs text-muted-foreground">Check-in: {checkinStatus.checkInTime}</p>
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
            <p className="text-sm text-muted-foreground">Quản lý thời gian làm việc hàng ngày</p>
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
                <p>Ngày: {new Date().toLocaleDateString("vi-VN")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
