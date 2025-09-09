import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  console.log("[v0] 🔄 Đang kết nối MongoDB...")

  if (cached.conn) {
    console.log("[v0] ✅ Sử dụng kết nối MongoDB đã có sẵn")
    return cached.conn
  }

  if (!cached.promise) {
    console.log("[v0] 🆕 Tạo kết nối MongoDB mới...")
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("[v0] ✅ Kết nối MongoDB thành công!")
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
    console.log("[v0] 🎯 MongoDB đã sẵn sàng sử dụng")
  } catch (e) {
    console.log("[v0] ❌ Lỗi kết nối MongoDB:", e)
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
