-- ============================================
-- COURSE CONTENT MANAGEMENT SYSTEM MIGRATION
-- Adds hierarchical content structure: Modules → Lessons → Content Items
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE NEW ENUM TYPE FOR CONTENT TYPES
-- ============================================

CREATE TYPE content_type AS ENUM ('video', 'text', 'quiz', 'assignment', 'resource');

-- ============================================
-- CREATE MODULES TABLE
-- ============================================

CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_modules_order ON modules(course_id, order_index);

-- Add updated_at trigger for modules
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CREATE CONTENT_ITEMS TABLE
-- ============================================

CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    content_type content_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT true,
    
    -- Video-specific fields
    video_url TEXT,
    duration INTEGER, -- in minutes
    
    -- Text-specific fields
    text_content TEXT,
    
    -- Quiz-specific fields (links to existing quizzes table)
    quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
    
    -- Assignment-specific fields (links to existing assignments table)
    assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
    
    -- Resource-specific fields
    resource_type TEXT, -- 'file' or 'link'
    resource_url TEXT,
    file_path TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_content_items_lesson ON content_items(lesson_id);
CREATE INDEX idx_content_items_order ON content_items(lesson_id, order_index);
CREATE INDEX idx_content_items_type ON content_items(content_type);

-- Add updated_at trigger for content_items
CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MODIFY LESSONS TABLE
-- Add module_id and is_required columns
-- ============================================

-- Add module_id column (nullable initially for backward compatibility)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id) ON DELETE CASCADE;

-- Add is_required column
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT true;

-- Create index for module_id
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables were created
SELECT 'Migration completed successfully!' as status;
SELECT 'Created tables: modules, content_items' as tables_created;
SELECT 'Modified table: lessons (added module_id, is_required)' as tables_modified;
SELECT 'Created enum type: content_type' as enums_created;
