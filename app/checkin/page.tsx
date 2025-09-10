"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedPage } from "@/components/protected-page"
import { useAuth } from "@/components/auth-provider"
import { Clock, CheckCircle, XCircle, LogIn, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CheckinStatus {
  isCheckedIn: boolean
  checkInTime?: string
  status: "not-checked-in" | "working" | "finished"
}

export default function CheckinPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>({
    isCheckedIn: false,
    status: "not-checked-in",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    if (user) {
      checkTodayStatus()
    }

    return () => clearInterval(timer)
  }, [user])

  const checkTodayStatus = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split("T")[0]
      const response = await fetch(`/api/my-timesheets?startDate=${today}&endDate=${today}`)
      const data = await response.json()

      if (data.timesheets && data.timesheets.length > 0) {
        const todayTimesheet = data.timesheets[0]
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
    } catch (error) {
      console.error("Error checking status:", error)
    }
  }

  const handleCheckin = async () => {
  if (!user) {
    console.log("[Frontend] No user found")
    return
  }

  console.log("[Frontend] Starting checkin process...")
  console.log("[Frontend] User:", user)
  console.log("[Frontend] Location:", location)

  setLoading(true)
  try {
    const requestBody = {
      location: location.latitude && location.longitude ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      } : null,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }

    console.log("[Frontend] Request body:", requestBody)
    console.log("[Frontend] Sending POST to /api/checkin...")

    const response = await fetch("/api/checkin", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody),
    })

    console.log("[Frontend] Response status:", response.status)
    console.log("[Frontend] Response headers:", Object.fromEntries(response.headers.entries()))

    const data = await response.json()
    console.log("[Frontend] Response data:", data)

    if (response.ok) {
      console.log("[Frontend] Checkin successful")
      setCheckinStatus({
        status: "working",
        canCheckIn: false,
        canCheckOut: true,
        checkInTime: data.timesheet.checkIn,
        timesheet: data.timesheet
      })
      toast({
        title: "✅ Chấm công thành công!",
        description: data.message,
      })
    } else {
      console.log("[Frontend] Checkin failed:", data.error)
      toast({
        title: "Lỗi chấm công",
        description: data.error,
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error("[Frontend] Checkin error:", error)
    toast({
      title: "Lỗi kết nối",
      description: "Không thể kết nối đến server",
      variant: "destructive",
    })
  } finally {
    setLoading(false)
  }
}

  const handleCheckout = async () => {
  if (!user) {
    console.log("[Frontend] No user found")
    return
  }

  console.log("[Frontend] Starting checkout process...")
  console.log("[Frontend] Current checkin status:", checkinStatus)

  setLoading(true)
  try {
    const requestBody = {
      location: location.latitude && location.longitude ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      } : null,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }

    console.log("[Frontend] Checkout request body:", requestBody)
    console.log("[Frontend] Sending POST to /api/checkout...")

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody),
    })

    console.log("[Frontend] Checkout response status:", response.status)
    
    const data = await response.json()
    console.log("[Frontend] Checkout response data:", data)

    if (response.ok) {
      console.log("[Frontend] Checkout successful")
      setCheckinStatus({
        status: "finished",
        canCheckIn: false,
        canCheckOut: false,
        checkInTime: checkinStatus.checkInTime,
        checkOutTime: data.timesheet.checkOut,
        totalHours: data.timesheet.totalHours,
        timesheet: data.timesheet
      })
      
      // Show detailed success message
      toast({
        title: "✅ Check-out thành công!",
        description: (
          <div className="space-y-1">
            <div>{data.message}</div>
            {data.summary && (
              <div className="text-xs mt-2 space-y-1">
                <div>⏰ {data.summary.checkInTime} - {data.summary.checkOutTime}</div>
                <div>💰 Lương: {parseInt(data.summary.salary).toLocaleString('vi-VN')}đ</div>
              </div>
            )}
          </div>
        ),
      })
    } else {
      console.log("[Frontend] Checkout failed:", data.error)
      toast({
        title: "Lỗi check-out",
        description: data.error,
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error("[Frontend] Checkout error:", error)
    toast({
      title: "Lỗi kết nối",
      description: "Không thể kết nối đến server",
      variant: "destructive",
    })
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

  return (
    <ProtectedPage requiredRole="employee">
      <main className="flex min-h-screen bg-background">
        {/* Removed Sidebar component */}
        <div className="flex-1 lg:pl-72">
          <div className="p-6 lg:p-8 pt-16 lg:pt-8">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Chấm công</h1>
                <p className="text-muted-foreground">Quản lý thời gian làm việc của bạn</p>
              </div>

              {/* Current Time */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <Clock className="w-8 h-8 mx-auto text-primary" />
                    <div className="text-4xl font-mono font-bold text-foreground">
                      {currentTime.toLocaleTimeString("vi-VN")}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {currentTime.toLocaleDateString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Trạng thái hiện tại</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {getStatusBadge()}
                  {checkinStatus.checkInTime && (
                    <p className="text-sm text-muted-foreground">Đã check-in lúc: {checkinStatus.checkInTime}</p>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  size="lg"
                  className="h-20 text-lg bg-green-600 hover:bg-green-700"
                  onClick={handleCheckin}
                  disabled={loading || checkinStatus.status !== "not-checked-in"}
                >
                  <LogIn className="w-6 h-6 mr-2" />
                  CHECK IN
                </Button>

                <Button
                  size="lg"
                  variant="destructive"
                  className="h-20 text-lg"
                  onClick={handleCheckout}
                  disabled={loading || checkinStatus.status !== "working"}
                >
                  <LogOut className="w-6 h-6 mr-2" />
                  CHECK OUT
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedPage>
  )
}
