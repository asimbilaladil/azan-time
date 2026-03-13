ALTER TABLE users
ADD COLUMN event_token TEXT NULL,
ADD COLUMN event_token_expires DATETIME NULL;
