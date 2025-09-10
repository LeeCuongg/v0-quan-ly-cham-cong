"use client"

import { cn } from "@/lib/utils"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, DollarSign, UserCheck } from "lucide-react"
import { formatCurrency } from "@/lib/types"

interface DashboardStats {
  totalEmployees: number
  currentlyWorking: number
  totalHoursToday: number
  totalSalaryCost: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/dashboard/stats")
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return <div>Không thể tải dữ liệu thống kê</div>
  }

  const statCards = [
    {
      title: "Tổng nhân viên",
      value: stats.totalEmployees.toString(),
      description: "Nhân viên đang làm việc",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Đang làm việc",
      value: stats.currentlyWorking.toString(),
      description: "Nhân viên hiện tại",
      icon: UserCheck,
      color: "text-secondary",
    },
    {
      title: "Giờ làm hôm nay",
      value: stats.totalHoursToday.toFixed(1),
      description: "Tổng giờ làm việc",
      icon: Clock,
      color: "text-accent",
    },
    {
      title: "Chi phí lương",
      value: formatCurrency(stats.totalSalaryCost),
      description: "Tổng chi phí hôm nay",
      icon: DollarSign,
      color: "text-chart-1",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={cn("h-4 w-4", stat.color)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
