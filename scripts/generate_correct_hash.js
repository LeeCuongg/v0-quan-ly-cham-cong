const bcrypt = require('bcryptjs');

async function generateHashForPassword1() {
  try {
    console.log('Generating bcrypt hash for password "1"...');
    
    const password = '1';
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('Password:', password);
    console.log('Generated hash:', hash);
    
    // Test verification
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification test:', isValid ? '✓ PASS' : '✗ FAIL');
    
    // Test với hash cũ
    const oldHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    const isOldHashValid = await bcrypt.compare(password, oldHash);
    console.log('Old hash test:', isOldHashValid ? '✓ PASS' : '✗ FAIL');
    console.log('Old hash:', oldHash);
    
    if (!isOldHashValid) {
      console.log('\n🚨 OLD HASH IS INCORRECT! Use this new hash instead:');
      console.log('New hash:', hash);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHashForPassword1();