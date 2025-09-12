"use cliinterface TimesheetWithOvertime {
  id: string;
  employee_name: string;
  date: string;
  check_in_time: string;
  check_out_time: string | null;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  regular_pay: number;
  overtime_pay: number;
  salary: number;
  overtime_rate: number;
}{ useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign } from "lucide-react"

interface TimesheetWithOvertime {
  id: string
  employee_name: string
  date: string
  check_in_time: string
  check_out_time: string | null
  total_hours: number
  regular_hours: number
  overtime_hours: number
  regular_pay: number
  overtime_pay: number
  salary: number
  isNightShift?: boolean
  isHoliday?: boolean
}

export function TimesheetTable() {
  const [timesheets, setTimesheets] = useState<TimesheetWithOvertime[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimesheets()
  }, [])

  const fetchTimesheets = async () => {
    try {
      const response = await fetch("/api/timesheets")
      if (response.ok) {
        const data = await response.json()
        setTimesheets(data)
      }
    } catch (error) {
      console.error("Error fetching timesheets:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (checkOut: string | null) => {
    if (!checkOut) {
      return <Badge variant="destructive">Đang làm</Badge>
    }
    return <Badge variant="default">Hoàn thành</Badge>
  }

  if (loading) {
    return <div>Đang tải dữ liệu...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Quản lý Chấm công (Ca 10 tiếng)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Enhanced Table with Overtime */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Giờ vào</TableHead>
                <TableHead>Giờ ra</TableHead>
                <TableHead>Tổng giờ</TableHead>
                <TableHead>Giờ thường</TableHead>
                <TableHead className="text-orange-600">Giờ ngoài giờ</TableHead>
                <TableHead>Lương thường</TableHead>
                <TableHead className="text-orange-600">Lương overtime</TableHead>
                <TableHead className="text-orange-600">Hệ số OT</TableHead>
                <TableHead className="font-semibold">Tổng lương</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu chấm công
                  </TableCell>
                </TableRow>
              ) : (
                timesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell className="font-medium">{timesheet.employee_name}</TableCell>
                    <TableCell>{timesheet.date}</TableCell>
                    <TableCell>{timesheet.check_in_time}</TableCell>
                    <TableCell>{timesheet.check_out_time || "Đang làm"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {timesheet.total_hours}h
                      </div>
                    </TableCell>
                    <TableCell>{timesheet.regular_hours}h</TableCell>
                    <TableCell className="text-orange-600 font-medium">
                      {timesheet.overtime_hours > 0 ? `${timesheet.overtime_hours}h` : '-'}
                    </TableCell>
                    <TableCell>{timesheet.regular_pay?.toLocaleString('vi-VN')}đ</TableCell>
                    <TableCell className="text-orange-600 font-medium">
                      {timesheet.overtime_pay > 0 ? `${timesheet.overtime_pay?.toLocaleString('vi-VN')}đ` : '-'}
                    </TableCell>
                    <TableCell className="text-orange-600 font-medium">
                      {timesheet.overtime_rate}x
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {timesheet.salary?.toLocaleString('vi-VN')}đ
                    </TableCell>
                    <TableCell>{getStatusBadge(timesheet.check_out_time)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Enhanced Summary Statistics */}
        {timesheets.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">Tổng giờ thường</div>
              <div className="text-2xl font-bold text-primary">
                {timesheets.reduce((sum, t) => sum + (t.regular_hours || 0), 0).toFixed(1)}h
              </div>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">Tổng giờ overtime</div>
              <div className="text-2xl font-bold text-orange-600">
                {timesheets.reduce((sum, t) => sum + (t.overtime_hours || 0), 0).toFixed(1)}h
              </div>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">Lương overtime</div>
              <div className="text-2xl font-bold text-orange-600">
                {timesheets.reduce((sum, t) => sum + (t.overtime_pay || 0), 0).toLocaleString("vi-VN")}đ
              </div>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">Tổng chi phí lương</div>
              <div className="text-2xl font-bold text-secondary">
                {timesheets.reduce((sum, t) => sum + (t.salary || 0), 0).toLocaleString("vi-VN")}đ
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
