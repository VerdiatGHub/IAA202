# Database Migrations

## How to Run Migrations

### On your database server:

1. Connect to your PostgreSQL database:
```bash
psql -U your_username -d your_database_name
```

2. Run the migration file:
```bash
\i /path/to/add_is_public_to_courses.sql
```

Or using psql command directly:
```bash
psql -U your_username -d your_database_name -f add_is_public_to_courses.sql
```

## Available Migrations

### add_is_public_to_courses.sql
Adds the `is_public` column to the courses table to support public/private course visibility.

- **What it does:**
  - Adds `is_public` BOOLEAN column (defaults to TRUE)
  - Creates an index for better query performance
  - Updates existing courses to be public by default

- **When to run:** Before deploying the updated backend code that includes the public/private course feature

### 001_add_course_content_management.sql
Adds hierarchical content structure for course content management (Modules → Lessons → Content Items).

- **What it does:**
  - Creates `modules` table for organizing lessons into modules
  - Creates `content_items` table for storing various content types (video, text, quiz, assignment, resource)
  - Creates `content_type` enum type
  - Adds `module_id` column to `lessons` table (nullable for backward compatibility)
  - Adds `is_required` column to `lessons` table (defaults to TRUE)
  - Creates indexes for performance optimization
  - Adds updated_at triggers for new tables

- **When to run:** Before deploying the course content management feature

- **Rollback:** Use `001_rollback_course_content_management.sql` to revert changes

### 001_rollback_course_content_management.sql
Rollback script for the course content management migration.

- **What it does:**
  - Drops `content_items` table
  - Drops `modules` table
  - Removes `module_id` and `is_required` columns from `lessons` table
  - Drops `content_type` enum type
  - Removes all related indexes

- **WARNING:** This will delete all modules and content items data! Backup your database first.
