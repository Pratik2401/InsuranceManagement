CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO products (name, description) VALUES
('Motor', 'Motor vehicle insurance'),
('Health', 'Health and medical insurance'),
('Life', 'Life and term life insurance'),
('General', 'Various general coverages');
