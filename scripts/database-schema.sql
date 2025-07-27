-- Create database
CREATE DATABASE store_management;
USE store_management;

-- Create customers table
CREATE TABLE customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    total_credit DECIMAL(10,2) DEFAULT 0.00,
    total_debit DECIMAL(10,2) DEFAULT 0.00,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    type ENUM('CREDIT', 'DEBIT') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_customer_mobile ON customers(mobile);
CREATE INDEX idx_transaction_customer ON transactions(customer_id);
CREATE INDEX idx_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_transaction_type ON transactions(type);

-- Insert sample data
INSERT INTO customers (name, mobile, total_credit, total_debit, balance) VALUES
('John Doe', '+1234567890', 5000.00, 3000.00, 2000.00),
('Jane Smith', '+1234567891', 8000.00, 6000.00, 2000.00),
('Bob Johnson', '+1234567892', 3000.00, 4000.00, -1000.00),
('Alice Brown', '+1234567893', 2500.00, 2500.00, 0.00),
('Charlie Wilson', '+1234567894', 6000.00, 4500.00, 1500.00);

-- Insert sample transactions
INSERT INTO transactions (customer_id, type, amount, description, transaction_date) VALUES
(1, 'CREDIT', 1000.00, 'Product sale - Electronics', '2024-01-15'),
(1, 'DEBIT', 500.00, 'Payment received - Cash', '2024-01-14'),
(1, 'CREDIT', 2000.00, 'Bulk order - Mobile accessories', '2024-01-10'),
(1, 'DEBIT', 1500.00, 'Payment received - Bank transfer', '2024-01-08'),
(2, 'CREDIT', 3000.00, 'Wholesale order', '2024-01-13'),
(2, 'CREDIT', 2500.00, 'Additional items', '2024-01-12'),
(2, 'DEBIT', 2000.00, 'Partial payment', '2024-01-11'),
(3, 'CREDIT', 1500.00, 'Product purchase', '2024-01-09'),
(3, 'DEBIT', 2000.00, 'Advance payment', '2024-01-07'),
(4, 'CREDIT', 1200.00, 'Service charge', '2024-01-06'),
(4, 'DEBIT', 1200.00, 'Payment cleared', '2024-01-05'),
(5, 'CREDIT', 4000.00, 'Large order', '2024-01-04'),
(5, 'DEBIT', 2500.00, 'Payment received', '2024-01-03');
