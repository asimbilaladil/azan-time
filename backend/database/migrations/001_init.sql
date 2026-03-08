-- Azan Time — Initial Schema
-- Run: mysql -u root -p azantime < database/migrations/001_init.sql

CREATE DATABASE IF NOT EXISTS azantime
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE azantime;

-- ── Cities ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(128) NOT NULL,
  country            VARCHAR(64)  NOT NULL,
  latitude           DECIMAL(10,7) NOT NULL,
  longitude          DECIMAL(10,7) NOT NULL,
  timezone           VARCHAR(64)  NOT NULL,
  calculation_method VARCHAR(64)  NOT NULL DEFAULT 'MuslimWorldLeague',
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_country (country)
) ENGINE=InnoDB;

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  amazon_user_id     VARCHAR(255) NOT NULL UNIQUE,
  email              VARCHAR(255),
  city_id            INT,
  latitude           DECIMAL(10,7),
  longitude          DECIMAL(10,7),
  timezone           VARCHAR(64),
  calculation_method VARCHAR(64)  DEFAULT 'MuslimWorldLeague',
  device_id          VARCHAR(255),
  access_token       TEXT,
  refresh_token      TEXT,
  token_expires_at   TIMESTAMP NULL,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
  INDEX idx_amazon_user_id (amazon_user_id),
  INDEX idx_city_id (city_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- ── Trigger log ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trigger_log (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  prayer        VARCHAR(32) NOT NULL,
  triggered_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success       BOOLEAN NOT NULL,
  error_message TEXT,
  INDEX idx_user_id (user_id),
  INDEX idx_triggered_at (triggered_at)
) ENGINE=InnoDB;

-- ── Seed cities ───────────────────────────────────────────────────────────────
INSERT IGNORE INTO cities (name, country, latitude, longitude, timezone, calculation_method) VALUES
('Berlin',        'DE',  52.5200,  13.4050, 'Europe/Berlin',      'MuslimWorldLeague'),
('Hamburg',       'DE',  53.5511,   9.9937, 'Europe/Berlin',      'MuslimWorldLeague'),
('Munich',        'DE',  48.1351,  11.5820, 'Europe/Berlin',      'MuslimWorldLeague'),
('Frankfurt',     'DE',  50.1109,   8.6821, 'Europe/Berlin',      'MuslimWorldLeague'),
('Cologne',       'DE',  50.9333,   6.9500, 'Europe/Berlin',      'MuslimWorldLeague'),
('London',        'GB',  51.5074,  -0.1278, 'Europe/London',      'MoonsightingCommittee'),
('Paris',         'FR',  48.8566,   2.3522, 'Europe/Paris',       'MuslimWorldLeague'),
('Istanbul',      'TR',  41.0082,  28.9784, 'Europe/Istanbul',    'Turkey'),
('Dubai',         'AE',  25.2048,  55.2708, 'Asia/Dubai',         'MuslimWorldLeague'),
('Cairo',         'EG',  30.0444,  31.2357, 'Africa/Cairo',       'Egyptian'),
('Karachi',       'PK',  24.8607,  67.0011, 'Asia/Karachi',       'Karachi'),
('Kuala Lumpur',  'MY',   3.1390, 101.6869, 'Asia/Kuala_Lumpur',  'Singapore'),
('Jakarta',       'ID',  -6.2088, 106.8456, 'Asia/Jakarta',       'Singapore'),
('New York',      'US',  40.7128, -74.0060, 'America/New_York',   'NorthAmerica'),
('Chicago',       'US',  41.8781, -87.6298, 'America/Chicago',    'NorthAmerica'),
('Los Angeles',   'US',  34.0522,-118.2437, 'America/Los_Angeles','NorthAmerica'),
('Toronto',       'CA',  43.6532, -79.3832, 'America/Toronto',    'NorthAmerica'),
('Vienna',        'AT',  48.2082,  16.3738, 'Europe/Vienna',      'MuslimWorldLeague'),
('Amsterdam',     'NL',  52.3676,   4.9041, 'Europe/Amsterdam',   'MuslimWorldLeague'),
('Brussels',      'BE',  50.8503,   4.3517, 'Europe/Brussels',    'MuslimWorldLeague');
