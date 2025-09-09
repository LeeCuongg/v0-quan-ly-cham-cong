import { Sidebar } from "@/components/sidebar"
import { TimesheetTable } from "@/components/timesheet-table"
import { ErrorBoundary } from "@/components/error-boundary"

export default function TimesheetsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 lg:pl-72">
        <main className="p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý Chấm công</h1>
            <p className="text-muted-foreground">Theo dõi và quản lý thời gian làm việc của nhân viên</p>
          </div>

          {/* Timesheet Table */}
          <ErrorBoundary>
            <TimesheetTable />
          </ErrorBoundary>

          {/* Quick Actions */}
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Thao tác nhanh</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Xuất báo cáo tháng này</span>
                  <button className="text-sm text-primary hover:underline">Xuất</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Gửi thông báo nhắc nhở</span>
                  <button className="text-sm text-primary hover:underline">Gửi</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Cài đặt ca làm việc</span>
                  <button className="text-sm text-primary hover:underline">Cài đặt</button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Thống kê tuần này</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng giờ làm việc:</span>
                  <span className="font-medium">324.5 giờ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trung bình/ngày:</span>
                  <span className="font-medium">46.4 giờ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nhân viên đi muộn:</span>
                  <span className="font-medium text-destructive">2 lần</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tỷ lệ chấm công:</span>
                  <span className="font-medium text-secondary">98.5%</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
