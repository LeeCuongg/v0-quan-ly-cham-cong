const crypto = require('crypto')

function hashPassword(password, salt) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex')
  }
  
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

// Tạo hash cho các password
const passwords = {
  'admin123': hashPassword('admin123'),
  'password123': hashPassword('password123')
}

console.log('New crypto hashed passwords:')
console.log('============================')
for (const [plain, hashed] of Object.entries(passwords)) {
  console.log(`${plain}: ${hashed}`)
}

console.log('\nSQL UPDATE statements:')
console.log('======================')
console.log(`UPDATE employees SET password = '${passwords['admin123']}' WHERE email = 'manager@company.com';`)
console.log(`UPDATE employees SET password = '${passwords['password123']}' WHERE email = 'nguyen.van.an@company.com';`)
