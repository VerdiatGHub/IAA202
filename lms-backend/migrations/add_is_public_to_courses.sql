-- Add is_public column to courses table
-- This allows courses to be marked as public (anyone can enroll) or private (invitation only)

ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_is_public ON courses(is_public);

-- Update existing courses to be public by default
UPDATE courses SET is_public = TRUE WHERE is_public IS NULL;
