-- Seed Data for Insurance Management System

-- Seed Users (Passwords are hashed 'password123' using bcrypt)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('John Agent', 'agent@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent');

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
('Neha Sharma', '+91 87654 32109', 'Family Floater', 'Active', '2025-04-13'),
('Sameer Khan', '+91 76543 21098', 'Term Life', 'Active', '2025-04-12');
