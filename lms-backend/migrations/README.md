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
