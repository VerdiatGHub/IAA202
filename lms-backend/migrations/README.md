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

### 002_migrate_lessons_to_modules.js
Data migration script that migrates existing lessons to default "General" modules.

- **What it does:**
  - Identifies all courses with lessons that don't have a module_id
  - Creates a default "General" module for each course (or uses existing one)
  - Migrates all orphaned lessons to their course's default module
  - Preserves existing lesson order_index values
  - Verifies that no lessons remain without module assignment

- **Prerequisites:**
  - Migration 001 must be applied first
  - Node.js environment with database connection configured
  - Database credentials in `.env` file

- **When to run:** After deploying migration 001 and before using the new course content management features

- **To apply:**
  ```bash
  cd lms-backend
  node migrations/002_migrate_lessons_to_modules.js
  ```

- **To rollback:**
  ```bash
  cd lms-backend
  node migrations/002_migrate_lessons_to_modules.js --rollback
  ```

- **Rollback behavior:**
  - Finds all "General" modules created by this migration
  - Sets module_id back to NULL for all lessons in those modules
  - Deletes the default "General" modules
  - **WARNING:** This will orphan lessons again!

## Migration Order

For the course content management feature, run migrations in this order:

1. **001_add_course_content_management.sql** - Creates schema (modules, content_items tables)
2. **002_migrate_lessons_to_modules.js** - Migrates existing lesson data to default modules
