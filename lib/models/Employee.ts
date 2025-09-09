import mongoose, { Schema, type Document } from "mongoose"

export interface IEmployee extends Document {
  name: string
  email: string
  hourlyRate: number
  totalHoursThisMonth: number
  isCurrentlyWorking: boolean
  password: string
  role: "employee" | "manager"
  isActive: boolean
  phone?: string
  createdAt: Date
  updatedAt: Date
}

const EmployeeSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Tên nhân viên là bắt buộc"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    hourlyRate: {
      type: Number,
      required: [true, "Lương theo giờ là bắt buộc"],
      min: [0, "Lương theo giờ phải lớn hơn 0"],
    },
    totalHoursThisMonth: {
      type: Number,
      default: 0,
      min: [0, "Tổng giờ làm không thể âm"],
    },
    isCurrentlyWorking: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
    },
    role: {
      type: String,
      enum: ["employee", "manager"],
      default: "employee",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
EmployeeSchema.index({ email: 1 })
EmployeeSchema.index({ role: 1 })
EmployeeSchema.index({ isActive: 1 })

export default mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema)
