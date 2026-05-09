    -- Combined schema and seed for Insurance Management System
    -- Run this file to recreate schema and seed data (development use)

    -- Schema

    -- Drop tables if they exist to start fresh (for dev purposes)
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS claims;
    DROP TABLE IF EXISTS policies;
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS password_reset_tokens;
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS app_settings;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS leads;
    DROP TABLE IF EXISTS products;

    -- 1. Users Table (Agents, Admins)
    CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'agent') DEFAULT 'agent',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        last_login_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- 1.1 App Settings Table
    CREATE TABLE app_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'general',
        description VARCHAR(255) DEFAULT NULL,
        updated_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 1.2 Audit Logs Table
    CREATE TABLE audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        actor_id INT DEFAULT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100) DEFAULT NULL,
        details JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 1.5 Password Reset Tokens Table
    CREATE TABLE password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 1.6 Leads Table
    CREATE TABLE leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        product VARCHAR(100),
        status ENUM('Open', 'Converted', 'Lost') DEFAULT 'Open',
        date DATE NOT NULL,
        converted_policy_number VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- 1.7 Products Table
    CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Customers Table
    CREATE TABLE customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        dob DATE,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- 3. Policies Table
    CREATE TABLE policies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        policy_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        company VARCHAR(100) NOT NULL,
        policy_type VARCHAR(100) NOT NULL,
        premium_amount DECIMAL(15, 2) NOT NULL,
        coverage_amount DECIMAL(15, 2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('active', 'expired', 'cancelled', 'pending', 'pending_renewal') DEFAULT 'pending',
        is_renewal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    -- 4. Claims Table
    CREATE TABLE claims (
        id INT AUTO_INCREMENT PRIMARY KEY,
        claim_number VARCHAR(50) UNIQUE NOT NULL,
        policy_id INT NOT NULL,
        customer_id INT NOT NULL,
        claim_amount DECIMAL(15, 2) NOT NULL,
        description TEXT,
        date_of_incident DATE NOT NULL,
        status ENUM('submitted', 'under_review', 'approved', 'rejected') DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    -- 5. Payments Table
    CREATE TABLE payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        policy_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method ENUM('credit_card', 'bank_transfer', 'cash', 'other') NOT NULL,
        status ENUM('success', 'failed', 'pending') DEFAULT 'success',
        transaction_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
    );

    -- Seed

    -- Seed Products
    INSERT IGNORE INTO products (name, description) VALUES
    ('Motor', 'Motor vehicle insurance'),
    ('Health', 'Health and medical insurance'),
    ('Life', 'Life and term life insurance'),
    ('General', 'Various general coverages');

    -- Seed Users (Passwords are hashed)
    INSERT INTO users (name, email, password, role) VALUES 
    ('Admin User', 'admin@example.com', '$2b$12$MAICeNPoCdNYcSYlgWvR8ueoLDCkOTjitJYDij02qxETsY.mBqcMq', 'admin'),
    ('John Agent', 'agent@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent');

    -- Seed App Settings
    INSERT INTO app_settings (setting_key, setting_value, category, description, updated_by) VALUES
    ('support_email', 'support@insureflow.com', 'company', 'Primary support contact for the software', 1),
    ('renewal_alert_days', '30', 'workflow', 'Days before expiry when renewal alerts should trigger', 1),
    ('maintenance_mode', 'off', 'system', 'Turn on to show maintenance mode messaging', 1);

    -- Seed Customers
    INSERT INTO customers (first_name, last_name, email, phone, dob, address) VALUES 
    ('Alice', 'Smith', 'alice@example.com', '123-456-7890', '1985-04-12', '123 Elm St, Cityville'),
    ('Bob', 'Johnson', 'bob@example.com', '098-765-4321', '1990-11-23', '456 Oak St, Townsville');

    -- Seed Policies
    INSERT INTO policies (policy_number, customer_id, type, company, policy_type, premium_amount, coverage_amount, start_date, end_date, status) VALUES 
    ('POL-1084', 1, 'Motor', 'HDFC ERGO', 'Comprehensive', 18500.00, 500000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active'),
    ('POL-1083', 2, 'Health', 'Star Health', 'Family Floater', 24200.00, 1000000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active');


    -- Seed Claims
    INSERT INTO claims (claim_number, policy_id, customer_id, claim_amount, description, date_of_incident, status) VALUES 
    ('CLM-9001', 1, 1, 1500.00, 'Hospital visit for flu', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'under_review');

    -- Seed Payments
    INSERT INTO payments (policy_id, amount, payment_date, payment_method, status, transaction_id) VALUES 
    (1, 150.00, CURDATE(), 'credit_card', 'success', 'TXN-12345'),
    (2, 200.00, CURDATE(), 'bank_transfer', 'success', 'TXN-67890');

    -- Seed Leads
    INSERT INTO leads (name, phone, product, status, date) VALUES 
    ('Rahul Verma', '+91 98765 43210', 'Motor Comprehensive', 'Converted', '2025-04-14'),
    ('Neha Sharma', '+91 87654 32109', 'Family Floater', 'Open', '2025-04-13'),
    ('Sameer Khan', '+91 76543 21098', 'Term Life', 'Open', '2025-04-12');