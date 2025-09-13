#!/usr/bin/env node

/**
 * Script để hash password từ command line
 * Sử dụng: node scripts/hash-password.js "your-password"
 */

const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  if (!password) {
    console.error('Vui lòng cung cấp password để hash');
    console.log('Sử dụng: node scripts/hash-password.js "your-password"');
    process.exit(1);
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('Original password:', password);
    console.log('Hashed password:', hashedPassword);
    
    // Test verify
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('Verification test:', isValid ? '✓ PASS' : '✗ FAIL');
    
  } catch (error) {
    console.error('Error hashing password:', error);
    process.exit(1);
  }
}

// Lấy password từ command line argument
const password = process.argv[2];
hashPassword(password);
