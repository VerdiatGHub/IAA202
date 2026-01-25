-- ============================================
-- ROLLBACK SCRIPT FOR COURSE CONTENT MANAGEMENT SYSTEM
-- Removes hierarchical content structure changes
-- ============================================

-- WARNING: This will delete all modules and content items data!
-- Make sure to backup your database before running this rollback.

-- ============================================
-- DROP INDEXES FROM LESSONS TABLE
-- ============================================

DROP INDEX IF EXISTS idx_lessons_module;

-- ============================================
-- REMOVE COLUMNS FROM LESSONS TABLE
-- ============================================

ALTER TABLE lessons DROP COLUMN IF EXISTS module_id;
ALTER TABLE lessons DROP COLUMN IF EXISTS is_required;

-- ============================================
-- DROP CONTENT_ITEMS TABLE
-- ============================================

DROP TABLE IF EXISTS content_items CASCADE;

-- ============================================
-- DROP MODULES TABLE
-- ============================================

DROP TABLE IF EXISTS modules CASCADE;

-- ============================================
-- DROP ENUM TYPE
-- ============================================

DROP TYPE IF EXISTS content_type CASCADE;

-- ============================================
-- ROLLBACK COMPLETE
-- ============================================

SELECT 'Rollback completed successfully!' as status;
SELECT 'Dropped tables: modules, content_items' as tables_dropped;
SELECT 'Removed from lessons table: module_id, is_required' as columns_removed;
SELECT 'Dropped enum type: content_type' as enums_dropped;
