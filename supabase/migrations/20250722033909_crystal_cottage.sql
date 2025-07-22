@@ .. @@
 -- Insert default admin user (password: admin123 - change in production!)
 INSERT OR IGNORE INTO users (id, email, password_hash, role, first_name, last_name) 
 VALUES (
     'admin-user-id', 
-    'admin@cloudmanager.com', 
+    'lamado@cloudcorenow.com', 
     '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZOeJ9QmjQZ9QmjQZ9QmjQZ9QmjQZ9Qmj', -- bcrypt hash of 'admin123'
     'admin', 
     'System', 
     'Administrator'
 );