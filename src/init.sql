DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS groups;

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  jobTitle VARCHAR(255) NOT NULL,
  groupId INTEGER, -- Define the column with data type
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);

-- Create the group table
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parentGroupId INTEGER,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
  -- You might consider defining relationships and other fields here
);

-- Add foreign key constraints in separate ALTER TABLE statements
-- Reference groupId in users table to id in groups table
-- ALTER TABLE users
-- ADD CONSTRAINT fk_groupId
-- FOREIGN KEY (groupId)
-- REFERENCES groups (id)
-- ON DELETE CASCADE;

-- Delete data from users and groups tables
DELETE FROM users;
DELETE FROM groups;
