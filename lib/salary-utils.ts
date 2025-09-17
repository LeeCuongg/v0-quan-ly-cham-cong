export interface SalaryCalculation {
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
  overtimeHourlyRate: number;
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
  overtimeHourlyRate: number = 30000,
  overtimeRules: OvertimeRules = DEFAULT_OVERTIME_RULES
): SalaryCalculation {
  // Tính giờ thường và ngoài giờ (dựa trên 10h/ngày)
  const regularHours = Math.min(totalHours, overtimeRules.dailyLimit);
  const overtimeHours = Math.max(0, totalHours - overtimeRules.dailyLimit);

  // Tính lương - sử dụng overtime_hourly_rate từ DB thay vì tính từ hourlyRate
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * overtimeHourlyRate; // Sử dụng rate cố định từ DB

  const totalPay = regularPay + overtimePay;

  return {
    regularHours,
    overtimeHours,
    regularPay: Math.round(regularPay),
    overtimePay: Math.round(overtimePay),
    totalPay: Math.round(totalPay),
    overtimeHourlyRate: overtimeHourlyRate,
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
