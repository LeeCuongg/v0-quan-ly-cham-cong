import { createHash, randomBytes, pbkdf2Sync } from 'crypto'

/**
 * Hash password sử dụng Node.js crypto built-in
 * @param password - Password cần hash
 * @param salt - Salt (tùy chọn, sẽ tự tạo nếu không có)
 * @returns Hashed password với format: salt:hash
 */
export function hashPassword(password: string, salt?: string): string {
  const crypto = eval('require("crypto")')
  
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex')
  }
  
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify password với hash đã lưu
 * @param password - Password cần kiểm tra
 * @param hashedPassword - Hash đã lưu với format: salt:hash
 * @returns true nếu password đúng
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const crypto = eval('require("crypto")')
    const [salt, hash] = hashedPassword.split(':')
    if (!salt || !hash) {
      // Nếu không có format salt:hash, có thể là bcrypt hash cũ
      // Tạm thời return false để force user đổi password
      console.log('[PASSWORD] Invalid hash format, may be old bcrypt hash')
      return false
    }
    
    const hashToVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return hash === hashToVerify
  } catch (error) {
    console.error('[PASSWORD] Error verifying password:', error)
    return false
  }
}

/**
 * Kiểm tra xem hash có phải là bcrypt format không
 * @param hash - Hash cần kiểm tra
 * @returns true nếu là bcrypt format
 */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2b$') || hash.startsWith('$2a$') || hash.startsWith('$2y$')
}

/**
 * Verify password với cả crypto và bcrypt format (backward compatibility)
 * @param password - Password cần kiểm tra
 * @param hashedPassword - Hash đã lưu
 * @returns true nếu password đúng
 */
export async function verifyPasswordCompat(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Nếu là bcrypt hash, thử dùng bcryptjs (nếu có)
    if (isBcryptHash(hashedPassword)) {
      try {
        const bcrypt = eval('require("bcryptjs")')
        return await bcrypt.compare(password, hashedPassword)
      } catch (error) {
        console.log('[PASSWORD] bcryptjs not available, bcrypt hash will fail')
        return false
      }
    }
    
    // Nếu không phải bcrypt, dùng crypto
    return verifyPassword(password, hashedPassword)
  } catch (error) {
    console.error('[PASSWORD] Error in verifyPasswordCompat:', error)
    return false
  }
}
