-- SQL Migration: Add num_guests column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS num_guests INTEGER DEFAULT 2;
