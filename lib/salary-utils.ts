export interface SalaryCalculation {
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
  overtimeHourlyRate: number;
}

export interface OvertimeRules {
  dailyLimit: number; // Giờ thường tối đa/ngày (10 giờ)
  weeklyLimit: number; // Giờ thường tối đa/tuần  
  overtimeMultiplier: number; // Không dùng nữa, thay bằng overtime_hourly_rate cố định
}

const DEFAULT_OVERTIME_RULES: OvertimeRules = {
  dailyLimit: 10,
  weeklyLimit: 50,
  overtimeMultiplier: 1.5, // Legacy, không dùng
};

/**
 * Làm tròn số thập phân theo quy tắc 3 chữ số (ví dụ: 0.0333333 -> 0.033)
 */
function roundToThreeDecimals(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * CÔNG THỨC CHẤM CÔNG CHUẨN - TRUNG TÂM
 * 
 * Quy tắc:
 * - Ca 1: 04:59 → 10:57 = 5 giờ 58 phút ≈ 5.97 giờ
 * - Ca 2: 13:07 → 18:47 = 5 giờ 40 phút ≈ 5.67 giờ
 * - Tổng: 5.97 + 5.67 = 11.64 giờ
 * 
 * Logic:
 * - Giờ chính thức: min(11.64, 10) = 10 giờ
 * - Giờ tăng ca: max(11.64 - 10, 0) = 1.64 giờ
 * 
 * Tính lương:
 * - Tiền công chính thức: 10 × 23,333 = 233,330 VND
 * - Tiền tăng ca: 1.64 × 30,000 = 49,200 VND
 * - Tổng: 233,330 + 49,200 = 282,530 VND
 * 
 * Quy tắc làm tròn: 3 chữ số thập phân (ví dụ: 0.0333333 -> 0.033)
 */
export function calculateDailySalary(
  totalHours: number,
  hourlyRate: number,
  overtimeHourlyRate: number = 30000,
  overtimeRules: OvertimeRules = DEFAULT_OVERTIME_RULES
): SalaryCalculation {
  // Làm tròn total hours theo quy tắc 3 chữ số thập phân
  const roundedTotalHours = roundToThreeDecimals(totalHours);
  
  // Tính giờ thường và tăng ca (dựa trên 10h/ngày)
  const regularHours = Math.min(roundedTotalHours, overtimeRules.dailyLimit);
  const overtimeHours = Math.max(0, roundedTotalHours - overtimeRules.dailyLimit);

  // Tính lương sử dụng overtime_hourly_rate từ DB (không dùng multiplier)
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * overtimeHourlyRate;
  const totalPay = regularPay + overtimePay;

  return {
    regularHours: roundToThreeDecimals(regularHours),
    overtimeHours: roundToThreeDecimals(overtimeHours),
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
 * Tuân thủ quy tắc làm tròn 3 chữ số thập phân
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
  
  // Trả về giờ chính xác với quy tắc làm tròn 3 chữ số thập phân
  const totalHours = totalMinutes / 60;
  return roundToThreeDecimals(totalHours);
}

/**
 * Validate thời gian check-in và check-out
 */
export function validateTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

/**
 * Tính lương ví dụ theo yêu cầu:
 * Ca 1: 04:59 → 10:57 = 5.97 giờ
 * Ca 2: 13:07 → 18:47 = 5.67 giờ  
 * Tổng: 11.64 giờ
 * Kết quả: 282,530 VND (với hourly_rate=23333, overtime_hourly_rate=30000)
 */
export function calculateExampleSalary(): SalaryCalculation {
  const shift1Hours = calculateTotalHours("04:59", "10:57"); // 5.97 giờ
  const shift2Hours = calculateTotalHours("13:07", "18:47"); // 5.67 giờ
  const totalHours = shift1Hours + shift2Hours; // 11.64 giờ
  
  return calculateDailySalary(totalHours, 23333, 30000);
}
