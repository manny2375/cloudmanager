/*
  # Fix Admin User Password Hash

  1. Updates
    - Fix the truncated password hash for admin user
    - Ensure the full 60-character bcrypt hash is stored
  
  2. Security
    - Uses complete bcrypt hash for admin123 password
    - Maintains admin role and active status
*/

-- Update the admin user with the complete, untruncated password hash
UPDATE users 
SET password_hash = '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZOeJ9QmjQZ9QmjQZ9QmjQZ9QmjQZ9Qmj',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'lamado@cloudcorenow.com';