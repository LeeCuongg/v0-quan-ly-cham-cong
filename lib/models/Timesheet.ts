import mongoose, { Schema, type Document } from "mongoose"

export interface ITimesheet extends Document {
  employeeId: mongoose.Types.ObjectId
  employeeName: string
  date: Date
  checkIn: string
  checkOut: string | null
  totalHours: number
  salary: number
  createdAt: Date
  updatedAt: Date
}

const TimesheetSchema: Schema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "ID nhân viên là bắt buộc"],
    },
    employeeName: {
      type: String,
      required: [true, "Tên nhân viên là bắt buộc"],
    },
    date: {
      type: Date,
      required: [true, "Ngày làm việc là bắt buộc"],
    },
    checkIn: {
      type: String,
      required: [true, "Giờ vào là bắt buộc"],
    },
    checkOut: {
      type: String,
      default: null,
    },
    totalHours: {
      type: Number,
      default: 0,
      min: [0, "Tổng giờ làm không thể âm"],
    },
    salary: {
      type: Number,
      default: 0,
      min: [0, "Lương không thể âm"],
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for unique employee per date
TimesheetSchema.index({ employeeId: 1, date: 1 }, { unique: true })
TimesheetSchema.index({ date: 1 })
TimesheetSchema.index({ employeeId: 1 })

export default mongoose.models.Timesheet || mongoose.model<ITimesheet>("Timesheet", TimesheetSchema)
