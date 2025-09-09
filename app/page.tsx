import { DashboardStats } from "@/components/dashboard-stats"
import { EmployeeDashboard } from "@/components/employee-dashboard"
import { ErrorBoundary } from "@/components/error-boundary"
import { ProtectedPage } from "@/components/protected-page"

export default function DashboardPage() {
  return (
    <ProtectedPage allowedRoles={["manager", "employee"]}>
      <main className="p-4 lg:p-8">
        <ErrorBoundary>
          <DashboardStats />
          <EmployeeDashboard />
        </ErrorBoundary>
      </main>
    </ProtectedPage>
  )
}
