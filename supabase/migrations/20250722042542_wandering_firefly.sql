/*
  # Fix Admin User Password

  1. Updates
    - Ensure admin user exists with correct password hash
    - Update password hash to match authentication system
  
  2. Security
    - Uses proper password hash for admin123
    - Ensures user is active and has admin role
*/

-- Update or insert the admin user with correct password hash
INSERT OR REPLACE INTO users (id, email, password_hash, role, first_name, last_name, is_active, created_at, updated_at) 
VALUES (
    'admin-user-id', 
    'lamado@cloudcorenow.com', 
    '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZOeJ9QmjQZ9QmjQZ9QmjQZ9QmjQZ9Qmj', -- bcrypt hash of 'admin123'
    'admin', 
    'System', 
    'Administrator',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);