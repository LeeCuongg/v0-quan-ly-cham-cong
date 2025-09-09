"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedPage } from "@/components/protected-page"
import { useAuth } from "@/components/auth-provider"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Clock, DollarSign, Calendar, TrendingUp, BarChart3, Activity } from "lucide-react"

interface EmployeeStats {
  weekStats: {
    totalHours: number
    totalSalary: number
    avgHoursPerDay: number
    daysWorkedThisMonth: number
  }
  chartData: {
    last7Days: Array<{
      date: string
      hours: number
    }>
    last3Months: Array<{
      month: string
      salary: number
    }>
  }
}

export default function MyStatsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<EmployeeStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/my-stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const formatChartData = () => {
    if (!stats) return { dailyHours: [], monthlySalary: [], workDistribution: [] }

    const dailyHours = stats.chartData.last7Days.map((day) => ({
      date: new Date(day.date).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric" }),
      hours: day.hours,
    }))

    const monthlySalary = stats.chartData.last3Months.map((month) => ({
      month: month.month,
      salary: month.salary / 1000000, // Convert to millions for better display
    }))

    // Work distribution pie chart data
    const totalHours = stats.weekStats.totalHours
    const workingHours = totalHours
    const standardWeekHours = 40 // Assuming 40 hours standard work week
    const remainingHours = Math.max(0, standardWeekHours - workingHours)

    const workDistribution = [
      { name: "Đã làm", value: workingHours, color: "#1d4ed8" },
      { name: "Còn lại", value: remainingHours, color: "#e5e7eb" },
    ]

    return { dailyHours, monthlySalary, workDistribution }
  }

  const { dailyHours, monthlySalary, workDistribution } = formatChartData()

  if (loading) {
    return (
      <ProtectedPage requiredRole="employee">
        <main className="p-4 lg:p-8">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-64"></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </main>
      </ProtectedPage>
    )
  }

  if (!stats) {
    return (
      <ProtectedPage requiredRole="employee">
        <main className="p-4 lg:p-8">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Không thể tải dữ liệu thống kê</p>
          </div>
        </main>
      </ProtectedPage>
    )
  }

  return (
    <ProtectedPage requiredRole="employee">
      <main className="p-4 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Thống kê cá nhân</h1>
            <p className="text-muted-foreground">Phân tích hiệu suất làm việc của {user?.name}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Giờ tuần này</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weekStats.totalHours}h</div>
                <p className="text-xs text-muted-foreground">
                  Trung bình {stats.weekStats.avgHoursPerDay.toFixed(1)}h/ngày
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lương tuần này</CardTitle>
                <DollarSign className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weekStats.totalSalary.toLocaleString("vi-VN")}đ</div>
                <p className="text-xs text-muted-foreground">Lương/giờ: {user?.hourlyRate.toLocaleString("vi-VN")}đ</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ngày làm tháng này</CardTitle>
                <Calendar className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weekStats.daysWorkedThisMonth}</div>
                <p className="text-xs text-muted-foreground">Ngày đã làm việc</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hiệu suất</CardTitle>
                <TrendingUp className="h-4 w-4 text-chart-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{((stats.weekStats.totalHours / 40) * 100).toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">So với 40h/tuần</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Daily Hours Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Giờ làm 7 ngày qua
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyHours}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`${value}h`, "Giờ làm"]}
                        labelFormatter={(label) => `Ngày: ${label}`}
                      />
                      <Bar dataKey="hours" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Salary Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Xu hướng lương 3 tháng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySalary}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(1)}M đ`, "Lương"]}
                        labelFormatter={(label) => `Tháng: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="salary"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Work Distribution and Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Work Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Phân bổ giờ làm tuần này
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {workDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}h`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {workDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-sm text-muted-foreground">
                        {entry.name}: {entry.value}h
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Thông tin chi tiết
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Tổng giờ tuần này</span>
                    <span className="text-sm font-bold">{stats.weekStats.totalHours}h</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Trung bình mỗi ngày</span>
                    <span className="text-sm font-bold">{stats.weekStats.avgHoursPerDay.toFixed(1)}h</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Ngày làm tháng này</span>
                    <span className="text-sm font-bold">{stats.weekStats.daysWorkedThisMonth} ngày</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Tổng lương tuần này</span>
                    <span className="text-sm font-bold text-secondary">
                      {stats.weekStats.totalSalary.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Mục tiêu tuần</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tiến độ (40h/tuần)</span>
                      <span>{((stats.weekStats.totalHours / 40) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((stats.weekStats.totalHours / 40) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </ProtectedPage>
  )
}
