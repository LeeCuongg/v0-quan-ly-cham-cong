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
      
      console.log("[CHECKIN] Today's timesheet data:", data)

      if (data.timesheets && data.timesheets.length > 0) {
        const todayTimesheet = data.timesheets[0]
        
        // Kiểm tra các trường khác nhau từ database
        const checkIn = todayTimesheet.check_in_time || todayTimesheet.checkIn
        const checkOut = todayTimesheet.check_out_time || todayTimesheet.checkOut
        
        console.log("[CHECKIN] Check-in:", checkIn, "Check-out:", checkOut)
        
        if (checkIn && !checkOut) {
          // Đang làm việc
          setCheckinStatus({
            isCheckedIn: true,
            checkInTime: checkIn,
            status: "working",
          })
          console.log("[CHECKIN] Status: Currently working")
        } else if (checkIn && checkOut) {
          // Đã hoàn thành
          setCheckinStatus({
            isCheckedIn: false,
            checkInTime: checkIn,
            status: "finished",
          })
          console.log("[CHECKIN] Status: Finished for today")
        } else {
          // Chưa check-in
          setCheckinStatus({
            isCheckedIn: false,
            status: "not-checked-in",
          })
          console.log("[CHECKIN] Status: Not checked in")
        }
      } else {
        // Không có bản ghi nào hôm nay
        setCheckinStatus({
          isCheckedIn: false,
          status: "not-checked-in",
        })
        console.log("[CHECKIN] Status: No timesheet for today")
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
          isCheckedIn: true,
          checkInTime: data.timesheet.check_in_time || data.timesheet.checkIn,
          status: "working",
        })
        toast({
          title: "Chấm công thành công!",
          description: `Bạn đã check-in lúc ${data.timesheet.check_in_time || data.timesheet.checkIn}`,
        })
      } else {
        // Nếu đã check-in rồi, cập nhật trạng thái
        if (data.error === "Already checked in today" && data.existingTimesheet) {
          const timesheet = data.existingTimesheet
          setCheckinStatus({
            isCheckedIn: true,
            checkInTime: timesheet.check_in_time || timesheet.checkIn,
            status: "working",
          })
        }
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
      console.log("[CHECKIN] Sending checkout request...")
      
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // Explicitly send empty object
      })

      console.log("[CHECKIN] Checkout response status:", response.status)
      
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("[CHECKIN] Failed to parse response:", parseError)
        throw new Error("Server response is not valid JSON")
      }
      
      console.log("[CHECKIN] Check-out response:", data)

      if (response.ok) {
        setCheckinStatus({
          isCheckedIn: false,
          checkInTime: checkinStatus.checkInTime,
          status: "finished",
        })
        toast({
          title: "Check-out thành công!",
          description: `Bạn đã hoàn thành ${data.timesheet?.total_hours || data.timesheet?.totalHours} giờ làm việc`,
        })
      } else {
        console.error("[CHECKIN] Checkout error response:", data)
        toast({
          title: "Lỗi",
          description: data.error || "Có lỗi xảy ra khi check-out",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[CHECKIN] Check-out error:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể kết nối đến server",
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
                    <p className="text-sm text-muted-foreground">
                      Đã check-in lúc: {checkinStatus.checkInTime}
                    </p>
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
