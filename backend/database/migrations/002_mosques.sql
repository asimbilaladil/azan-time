-- Migration 002: Replace cities with mosques from my-masjid.com

USE azantime;

CREATE TABLE IF NOT EXISTS mosques (
  guid        VARCHAR(36) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  city        VARCHAR(128),
  country     VARCHAR(64),
  timezone    VARCHAR(64) NOT NULL DEFAULT 'Europe/Berlin',
  fajr        VARCHAR(5),
  dhuhr       VARCHAR(5),
  asr         VARCHAR(5),
  maghrib     VARCHAR(5),
  isha        VARCHAR(5),
  times_date  DATE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_times_date (times_date)
) ENGINE=InnoDB;

-- Add mosque_guid to users
ALTER TABLE users
ADD COLUMN mosque_guid VARCHAR(36) DEFAULT NULL;

-- Create index
CREATE INDEX idx_mosque_guid ON users(mosque_guid);
