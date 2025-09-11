import { Sidebar } from "@/components/sidebar"
import { EmployeeTable } from "@/components/employee-table"
import { ErrorBoundary } from "@/components/error-boundary"

export default function EmployeesPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 lg:pl-72">
        <main className="p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý Nhân viên</h1>
            <p className="text-muted-foreground">Quản lý thông tin nhân viên và mức lương theo giờ</p>
          </div>

          {/* Employee Table */}
          <ErrorBoundary>
            <EmployeeTable />
          </ErrorBoundary>

          {/* Summary Cards */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Tổng quan</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng nhân viên:</span>
                  <span className="font-medium">5 người</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đang làm việc:</span>
                  <span className="font-medium text-secondary">3 người</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nghỉ:</span>
                  <span className="font-medium">2 người</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Mức lương</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trung bình:</span>
                  <span className="font-medium">172,000 VND/h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cao nhất:</span>
                  <span className="font-medium text-accent">200,000 VND/h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thấp nhất:</span>
                  <span className="font-medium">150,000 VND/h</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Giờ làm việc</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tổng giờ tháng:</span>
                  <span className="font-medium">843 giờ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trung bình/người:</span>
                  <span className="font-medium">168.6 giờ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cao nhất:</span>
                  <span className="font-medium text-primary">172 giờ</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
