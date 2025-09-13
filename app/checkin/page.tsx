"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedPage } from "@/components/protected-page"
import { useAuth } from "@/components/auth-provider"
import { Clock, CheckCircle, XCircle, LogIn, LogOut, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CheckinStatus {
  hasActiveSession: boolean
  checkInTime?: string
  status: "not-checked-in" | "working" | "can-checkin-again"
  totalSessions: number
}

export default function CheckinPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>({
    hasActiveSession: false,
    status: "not-checked-in",
    totalSessions: 0,
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
      const response = await fetch("/api/checkout")
      const data = await response.json()

      console.log("[CHECKIN] Status check data:", data)

      if (response.ok) {
        if (data.hasActiveSession) {
          // Currently working
          setCheckinStatus({
            hasActiveSession: true,
            checkInTime: data.checkInTime,
            status: "working",
            totalSessions: data.totalSessions || 0,
          })
          console.log("[CHECKIN] Status: Currently working")
        } else if (data.hasCheckedIn) {
          // Has checked in today but not currently working - can check in again
          setCheckinStatus({
            hasActiveSession: false,
            status: "can-checkin-again",
            totalSessions: data.totalSessions || 0,
          })
          console.log("[CHECKIN] Status: Can check in again")
        } else {
          // No check-ins today
          setCheckinStatus({
            hasActiveSession: false,
            status: "not-checked-in",
            totalSessions: 0,
          })
          console.log("[CHECKIN] Status: Not checked in")
        }
      }
    } catch (error) {
      console.error("[CHECKIN] Error checking status:", error)
    }
  }

  const handleCheckin = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      console.log("[CHECKIN] Check-in response:", data)

      if (response.ok) {
        setCheckinStatus({
          hasActiveSession: true,
          checkInTime: data.timesheet.check_in_time || data.timesheet.checkIn,
          status: "working",
          totalSessions: checkinStatus.totalSessions + 1,
        })
        toast({
          title: "Chấm công thành công!",
          description: `Bạn đã check-in lúc ${data.timesheet.check_in_time || data.timesheet.checkIn}`,
        })
      } else {
        toast({
          title: "Lỗi",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[CHECKIN] Check-in error:", error)
      toast({
        title: "Lỗi",
        description: "Không thể kết nối đến server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Tính toán thời gian checkout phía client
      const now = new Date()
      const checkoutTime = now.toTimeString().slice(0, 5) // "HH:MM"

      console.log("[CHECKIN] Sending checkout with time:", checkoutTime)

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutTime: checkoutTime,
        }),
      })

      const data = await response.json()
      console.log("[CHECKIN] Check-out response:", data)

      if (response.ok) {
        setCheckinStatus({
          hasActiveSession: false,
          checkInTime: checkinStatus.checkInTime,
          status: "can-checkin-again", // Allow checking in again
          totalSessions: checkinStatus.totalSessions,
        })
        toast({
          title: "Check-out thành công!",
          description: data.message,
        })

        // Refresh status after a short delay
        setTimeout(() => {
          checkTodayStatus()
        }, 1000)
      } else {
        toast({
          title: "Lỗi",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[CHECKIN] Check-out error:", error)
      toast({
        title: "Lỗi",
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
      case "can-checkin-again":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            <Activity className="w-4 h-4 mr-1" />
            Có thể chấm công lại
          </Badge>
        )
    }
  }

  const canCheckIn = checkinStatus.status === "not-checked-in" || checkinStatus.status === "can-checkin-again"
  const canCheckOut = checkinStatus.status === "working"

  return (
    <ProtectedPage requiredRole="employee">
      <main className="flex min-h-screen bg-background">
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
                    <p className="text-sm text-muted-foreground">Phiên hiện tại: {checkinStatus.checkInTime}</p>
                  )}
                  {checkinStatus.totalSessions > 0 && (
                    <p className="text-sm text-muted-foreground">Số phiên hôm nay: {checkinStatus.totalSessions}</p>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  size="lg"
                  className="h-20 text-lg bg-green-600 hover:bg-green-700"
                  onClick={handleCheckin}
                  disabled={loading || !canCheckIn}
                >
                  <LogIn className="w-6 h-6 mr-2" />
                  {checkinStatus.totalSessions > 0 ? "CHẤM CÔNG ĐẾN TIẾP" : "CHẤM CÔNG ĐẾN"}
                </Button>

                <Button
                  size="lg"
                  variant="destructive"
                  className="h-20 text-lg"
                  onClick={handleCheckout}
                  disabled={loading || !canCheckOut}
                >
                  <LogOut className="w-6 h-6 mr-2" />
                  CHẤM CÔNG VỀ
                </Button>
              </div>

              {checkinStatus.status === "can-checkin-again" && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="text-center text-sm text-blue-700">
                      <p className="font-medium">Bạn có thể chấm công nhiều lần trong ngày!</p>
                      <p>Nhấn "CHECK IN LẠI" để bắt đầu phiên làm việc mới.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedPage>
  )
}
