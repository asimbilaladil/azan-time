-- Migration 004: Add alexa_device_serial for alexa-remote2 direct control
-- This stores the Echo device serial number (from alexa-remote2 discovery)
-- which is used to send direct commands to the specific Echo device.

USE azantime;

ALTER TABLE users
ADD COLUMN alexa_device_serial VARCHAR(255) DEFAULT NULL;
