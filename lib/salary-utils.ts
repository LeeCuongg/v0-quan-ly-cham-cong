export interface SalaryCalculation {
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
  overtimeRate: number;
}

export interface OvertimeRules {
  dailyLimit: number; // Giờ thường tối đa/ngày
  weeklyLimit: number; // Giờ thường tối đa/tuần
  overtimeMultiplier: number; // Hệ số nhân (1.5 = 150%)
}

const DEFAULT_OVERTIME_RULES: OvertimeRules = {
  dailyLimit: 10,
  weeklyLimit: 50,
  overtimeMultiplier: 1.5,
};

/**
 * Tính lương với overtime cho một ngày
 */
export function calculateDailySalary(
  totalHours: number,
  hourlyRate: number,
  employeeOvertimeRate: number = 1.5,
  overtimeRules: OvertimeRules = DEFAULT_OVERTIME_RULES
): SalaryCalculation {
  // Tính giờ thường và ngoài giờ
  const regularHours = Math.min(totalHours, overtimeRules.dailyLimit);
  const overtimeHours = Math.max(0, totalHours - overtimeRules.dailyLimit);

  // Sử dụng overtime rate cá nhân của nhân viên
  const effectiveOvertimeRate = employeeOvertimeRate;

  // Tính lương
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * (hourlyRate * effectiveOvertimeRate);
  const totalPay = regularPay + overtimePay;

  return {
    regularHours,
    overtimeHours,
    regularPay: Math.round(regularPay),
    overtimePay: Math.round(overtimePay),
    totalPay: Math.round(totalPay),
    overtimeRate: effectiveOvertimeRate,
  };
}

/**
 * Format currency for Vietnamese locale
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Tính tổng số giờ từ check-in và check-out
 */
export function calculateTotalHours(checkIn: string, checkOut: string): number {
  const [checkInHour, checkInMinute] = checkIn.split(':').map(Number);
  const [checkOutHour, checkOutMinute] = checkOut.split(':').map(Number);
  
  const checkInTime = checkInHour * 60 + checkInMinute;
  const checkOutTime = checkOutHour * 60 + checkOutMinute;
  
  let totalMinutes = checkOutTime - checkInTime;
  
  // Handle next day checkout
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Add 24 hours
  }
  
  return Math.round((totalMinutes / 60) * 100) / 100; // Round to 2 decimal places
}