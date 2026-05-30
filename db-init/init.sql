CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock INT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    total_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, price, stock) VALUES
('Ice Coffee', 3500.00, 50),
('Hot Latte', 3000.00, 30),
('Chocolate Muffin', 2500.00, 20),
('Club Sandwich', 4500.00, 15),
('Green Tea', 2800.00, 40)
ON CONFLICT DO NOTHING;