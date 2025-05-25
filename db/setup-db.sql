-- This script creates the necessary tables for the shipping application
-- To run this script, execute the following command:
-- psql -U zhangyongzhen99 -d shipping_db -f db/setup-db.sql

DROP TABLE IF EXISTS preferences;
DROP TABLE IF EXISTS saved_addresses;
DROP TABLE IF EXISTS shipping_records;
DROP TABLE IF EXISTS users;

CREATE TABLE shipping_records (
    id SERIAL PRIMARY KEY,                     -- Unique ID for each shipping record
    sender_name VARCHAR(100) NOT NULL,         -- Name of the sender
    recipient_name VARCHAR(100) NOT NULL,      -- Name of the recipient
    zip_from VARCHAR(10) NOT NULL,             -- Sender's ZIP/Postal code
    zip_to VARCHAR(10) NOT NULL,               -- Recipient's ZIP/Postal code
    distance INT,
    zone VARCHAR(50),                          -- USPS zones
    occasion VARCHAR(100),                    -- Occasion
    ordered_date DATE NOT NULL,                -- Date the order was placed
    delivery_date DATE NOT NULL,               -- Estimate delivery/event date
    shipping_method VARCHAR(50) NOT NULL,     -- Shipping method (standard, priority)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE users (
    id SERIAL PRIMARY KEY,                     -- unique User ID
    username VARCHAR(50) UNIQUE NOT NULL,      -- User name 
    email VARCHAR(255) UNIQUE NOT NULL,        -- User email
    password_hash TEXT NOT NULL,               -- User password
    role VARCHAR(20) DEFAULT 'user',           --role: user/admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recipient VARCHAR(255) NOT NULL,
  occasion VARCHAR(50) NOT NULL,
  UNIQUE(user_id, recipient, occasion)  -- one preference per recipient+occasion per user
);

CREATE TABLE saved_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  UNIQUE(user_id, address)               -- no duplicates per user
);

-- Test data insertion
INSERT INTO shipping_records (
  sender_name, recipient_name, zip_from, zip_to, 
  occasion, ordered_date, delivery_date, shipping_method
) VALUES (
  'Test Sender', 'Test Recipient', '12345', '67890',
  'Test Occasion', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 day', 'Standard'
);
ALTER TABLE shipping_records ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- ALTER TABLE shipping_records
-- ADD COLUMN shipping_method VARCHAR(50) NOT NULL;

ALTER TABLE shipping_records 
ALTER COLUMN occasion SET NOT NULL,
ALTER COLUMN occasion SET DEFAULT 'Not specified';