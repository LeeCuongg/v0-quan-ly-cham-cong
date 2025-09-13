const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Cấu hình Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function hashPasswords() {
  console.log('Starting password hashing migration...');
  
  try {
    // Lấy tất cả users có password plain text
    const { data: users, error } = await supabase
      .from('employees')
      .select('id, email, password')
      .not('password', 'is', null);
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${users.length} users with plain text passwords`);
    
    for (const user of users) {
      if (user.password) {
        console.log(`Hashing password for user: ${user.email}`);
        
        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Update user với password_hash và xóa password plain text
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            password_hash: hashedPassword,
            password: null // Xóa plain text password
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`Error updating user ${user.email}:`, updateError);
        } else {
          console.log(`✓ Updated password for ${user.email}`);
        }
      }
    }
    
    console.log('Password hashing migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Chạy migration
hashPasswords();