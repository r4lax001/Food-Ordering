-- Run as a MySQL administrator; replace the password before executing.
-- This example is not used by db:setup and is not executed automatically.
CREATE DATABASE IF NOT EXISTS food_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'food_app'@'127.0.0.1' IDENTIFIED BY 'REPLACE_WITH_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON food_service.* TO 'food_app'@'127.0.0.1';
