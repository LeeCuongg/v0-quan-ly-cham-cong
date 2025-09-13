const bcrypt = require('bcryptjs')

async function hashPasswords() {
  const saltRounds = 10
  
  const passwords = {
    'admin123': await bcrypt.hash('admin123', saltRounds),
    'manager123': await bcrypt.hash('manager123', saltRounds),
    'password123': await bcrypt.hash('password123', saltRounds)
  }
  
  console.log('Hashed passwords:')
  console.log('================')
  for (const [plain, hashed] of Object.entries(passwords)) {
    console.log(`${plain}: ${hashed}`)
  }
}

hashPasswords().catch(console.error)