-- ============================================
-- LMS DATABASE SCHEMA FOR POSTGRESQL
-- Run this after creating the database
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (for clean install)
-- ============================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS course_level CASCADE;
DROP TYPE IF EXISTS question_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');

-- ============================================
-- USERS TABLE (replaces Supabase auth.users + profiles)
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- COURSES TABLE
-- ============================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    category TEXT,
    level course_level DEFAULT 'beginner',
    duration TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_published ON courses(is_published);

-- ============================================
-- LESSONS TABLE
-- ============================================

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    video_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    duration INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_course ON lessons(course_id);

-- ============================================
-- ENROLLMENTS TABLE
-- ============================================

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- ============================================
-- LESSON PROGRESS TABLE
-- ============================================

CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    UNIQUE(student_id, lesson_id)
);

-- ============================================
-- ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    max_score INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_course ON assignments(course_id);

-- ============================================
-- SUBMISSIONS TABLE
-- ============================================

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT,
    content TEXT,
    score INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);

-- ============================================
-- QUIZZES TABLE
-- ============================================

CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    time_limit INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_course ON quizzes(course_id);

-- ============================================
-- QUESTIONS TABLE
-- ============================================

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'multiple_choice',
    options JSONB,
    correct_answer TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_questions_quiz ON questions(quiz_id);

-- ============================================
-- QUIZ ATTEMPTS TABLE
-- ============================================

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}',
    score INTEGER,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT ADMIN USER
-- Password: admin123 (bcrypt hash)
-- ============================================

INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@lms.local',
    '$2a$10$ixbHZgaM4n4M3lOd5oslTeQoDFi5TJ8qsrVxjFnQo45E9tAWRS8EG',
    'System Administrator',
    'admin'
);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- ================== USERS ==================

-- Instructors (Password: password123)
INSERT INTO users (id, email, password_hash, full_name, role, avatar_url)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'instructor@lms.local', '$2a$10$ixbHZgaM4n4M3lOd5oslTeQoDFi5TJ8qsrVxjFnQo45E9tAWRS8EG', 'John Smith', 'instructor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'),
    ('10000000-0000-0000-0000-000000000002', 'sarah.wilson@lms.local', '$2a$10$ixbHZgaM4n4M3lOd5oslTeQoDFi5TJ8qsrVxjFnQo45E9tAWRS8EG', 'Sarah Wilson', 'instructor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'),
    ('10000000-0000-0000-0000-000000000003', 'michael.chen@lms.local', '$2a$10$ixbHZgaM4n4M3lOd5oslTeQoDFi5TJ8qsrVxjFnQo45E9tAWRS8EG', 'Michael Chen', 'instructor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael');

-- Students (Password: password123)
INSERT INTO users (id, email, password_hash, full_name, role, avatar_url)
VALUES 
    ('50000000-0000-0000-0000-000000000001', 'student@lms.local', '$2a$10$ixbHZgaM4n4M3lOd5oslTeQoDFi5TJ8qsrVxjFnQo45E9tAWRS8EG', 'Alice Johnson', 'student', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'),
    ('50000000-0000-0000-0000-000000000002', 'bob.brown@lms.local', '$2a$10$ixbHZgaM4n4M3lOd5oslTeQoDFi5TJ8qsrVxjFnQo45E9tAWRS8EG', 'Bob Brown', 'student', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'),
    ('50000000-0000-0000-0000-000000000003', 'carol.davis@lms.local', '$2a$10$ixbHZgaM4n4M3lOd5oslTeQoDFi5TJ8qsrVxjFnQo45E9tAWRS8EG', 'Carol Davis', 'student', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol'),
    ('50000000-0000-0000-0000-000000000004', 'david.miller@lms.local', '$2a$10$ixbHZgaM4n4M3lOd5oslTeQoDFi5TJ8qsrVxjFnQo45E9tAWRS8EG', 'David Miller', 'student', 'https://api.dicebear.com/7.x/avataaars/svg?seed=david'),
    ('50000000-0000-0000-0000-000000000005', 'emma.taylor@lms.local', '$2a$10$ixbHZgaM4n4M3lOd5oslTeQoDFi5TJ8qsrVxjFnQo45E9tAWRS8EG', 'Emma Taylor', 'student', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma'),
    ('50000000-0000-0000-0000-000000000006', 'frank.garcia@lms.local', '$2a$10$ixbHZgaM4n4M3lOd5oslTeQoDFi5TJ8qsrVxjFnQo45E9tAWRS8EG', 'Frank Garcia', 'student', 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank');

-- ================== COURSES ==================

INSERT INTO courses (id, title, description, thumbnail_url, instructor_id, is_published, category, level, duration)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'Introduction to Web Development', 'Learn the fundamentals of HTML, CSS, and JavaScript. Build responsive websites from scratch and understand the core concepts of web development.', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800', '10000000-0000-0000-0000-000000000001', true, 'Programming', 'beginner', '8 hours'),
    ('c0000000-0000-0000-0000-000000000002', 'Advanced JavaScript Patterns', 'Master advanced JavaScript concepts including closures, prototypes, async/await, and design patterns used in modern web applications.', 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800', '10000000-0000-0000-0000-000000000001', true, 'Programming', 'advanced', '12 hours'),
    ('c0000000-0000-0000-0000-000000000003', 'Data Science with Python', 'Comprehensive course covering Python for data analysis, visualization with matplotlib and seaborn, machine learning basics with scikit-learn.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', '10000000-0000-0000-0000-000000000002', true, 'Data Science', 'intermediate', '15 hours'),
    ('c0000000-0000-0000-0000-000000000004', 'UI/UX Design Fundamentals', 'Learn user interface and user experience design principles. Create wireframes, prototypes, and understand user research methodologies.', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800', '10000000-0000-0000-0000-000000000002', true, 'Design', 'beginner', '10 hours'),
    ('c0000000-0000-0000-0000-000000000005', 'Database Management Systems', 'Deep dive into relational databases, SQL, PostgreSQL administration, query optimization, and database design best practices.', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800', '10000000-0000-0000-0000-000000000003', true, 'Database', 'intermediate', '14 hours'),
    ('c0000000-0000-0000-0000-000000000006', 'Cloud Computing with AWS', 'Learn Amazon Web Services from basics to advanced. Deploy applications, manage infrastructure, and understand cloud architecture.', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800', '10000000-0000-0000-0000-000000000003', false, 'Cloud', 'advanced', '20 hours');

-- ================== LESSONS ==================

-- Web Development Course Lessons
INSERT INTO lessons (id, course_id, title, content, video_url, order_index, duration)
VALUES 
    ('20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Introduction to HTML', 'Learn the basics of HTML including tags, elements, and document structure. Understand semantic HTML and accessibility best practices.', 'https://www.youtube.com/watch?v=example1', 1, 45),
    ('20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'CSS Fundamentals', 'Master CSS selectors, properties, and the box model. Learn about flexbox, grid, and responsive design techniques.', 'https://www.youtube.com/watch?v=example2', 2, 60),
    ('20000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'JavaScript Basics', 'Introduction to JavaScript programming: variables, data types, functions, and DOM manipulation.', 'https://www.youtube.com/watch?v=example3', 3, 75),
    ('20000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Building Your First Website', 'Hands-on project: combine HTML, CSS, and JavaScript to build a complete responsive website.', 'https://www.youtube.com/watch?v=example4', 4, 90);

-- Advanced JavaScript Course Lessons
INSERT INTO lessons (id, course_id, title, content, video_url, order_index, duration)
VALUES 
    ('20000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'Closures and Scope', 'Deep understanding of JavaScript closures, lexical scope, and memory management.', 'https://www.youtube.com/watch?v=example5', 1, 50),
    ('20000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'Prototypes and Inheritance', 'Master prototypal inheritance, Object.create, and ES6 classes.', 'https://www.youtube.com/watch?v=example6', 2, 55),
    ('20000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'Async Programming', 'Promises, async/await, event loop, and handling asynchronous operations effectively.', 'https://www.youtube.com/watch?v=example7', 3, 70);

-- Data Science Course Lessons
INSERT INTO lessons (id, course_id, title, content, video_url, order_index, duration)
VALUES 
    ('20000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'Python for Data Analysis', 'Introduction to NumPy, Pandas, and data manipulation techniques.', 'https://www.youtube.com/watch?v=example8', 1, 60),
    ('20000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000003', 'Data Visualization', 'Creating compelling visualizations with Matplotlib and Seaborn.', 'https://www.youtube.com/watch?v=example9', 2, 55),
    ('20000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000003', 'Machine Learning Basics', 'Introduction to supervised and unsupervised learning with scikit-learn.', 'https://www.youtube.com/watch?v=example10', 3, 80);

-- UI/UX Design Course Lessons
INSERT INTO lessons (id, course_id, title, content, video_url, order_index, duration)
VALUES 
    ('20000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000004', 'Design Principles', 'Learn fundamental design principles: contrast, alignment, repetition, and proximity.', 'https://www.youtube.com/watch?v=example11', 1, 40),
    ('20000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000004', 'User Research Methods', 'Conducting user interviews, surveys, and usability testing.', 'https://www.youtube.com/watch?v=example12', 2, 50),
    ('20000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000004', 'Wireframing and Prototyping', 'Create wireframes and interactive prototypes using Figma.', 'https://www.youtube.com/watch?v=example13', 3, 65);

-- Database Course Lessons
INSERT INTO lessons (id, course_id, title, content, video_url, order_index, duration)
VALUES 
    ('20000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000005', 'Relational Database Concepts', 'Understanding tables, relationships, normalization, and ER diagrams.', 'https://www.youtube.com/watch?v=example14', 1, 55),
    ('20000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000005', 'SQL Fundamentals', 'Master SELECT, INSERT, UPDATE, DELETE, and JOIN operations.', 'https://www.youtube.com/watch?v=example15', 2, 70),
    ('20000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000005', 'Query Optimization', 'Indexing strategies, query plans, and performance tuning techniques.', 'https://www.youtube.com/watch?v=example16', 3, 60);

-- ================== ENROLLMENTS ==================

INSERT INTO enrollments (id, student_id, course_id, progress, enrolled_at, completed_at)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 75, NOW() - INTERVAL '30 days', NULL),
    ('e0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 100, NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days'),
    ('e0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 50, NOW() - INTERVAL '20 days', NULL),
    ('e0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 25, NOW() - INTERVAL '10 days', NULL),
    ('e0000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 60, NOW() - INTERVAL '45 days', NULL),
    ('e0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 100, NOW() - INTERVAL '90 days', NOW() - INTERVAL '30 days'),
    ('e0000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 100, NOW() - INTERVAL '120 days', NOW() - INTERVAL '60 days'),
    ('e0000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 40, NOW() - INTERVAL '15 days', NULL),
    ('e0000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 80, NOW() - INTERVAL '25 days', NULL),
    ('e0000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 30, NOW() - INTERVAL '8 days', NULL),
    ('e0000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 15, NOW() - INTERVAL '5 days', NULL),
    ('e0000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000005', 0, NOW() - INTERVAL '1 day', NULL);

-- ================== LESSON PROGRESS ==================

INSERT INTO lesson_progress (id, student_id, lesson_id, is_completed, completed_at)
VALUES 
    ('2f000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '25 days'),
    ('2f000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', true, NOW() - INTERVAL '20 days'),
    ('2f000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', true, NOW() - INTERVAL '15 days'),
    ('2f000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '18 days'),
    ('2f000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', true, NOW() - INTERVAL '12 days'),
    ('2f000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '100 days'),
    ('2f000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', true, NOW() - INTERVAL '90 days'),
    ('2f000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', true, NOW() - INTERVAL '80 days'),
    ('2f000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', true, NOW() - INTERVAL '70 days');

-- ================== ASSIGNMENTS ==================

INSERT INTO assignments (id, course_id, title, description, due_date, max_score)
VALUES 
    ('a5000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Build a Personal Portfolio', 'Create a responsive personal portfolio website using HTML, CSS, and JavaScript. Include at least 3 pages.', NOW() + INTERVAL '14 days', 100),
    ('a5000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'CSS Grid Layout Challenge', 'Recreate a complex magazine-style layout using CSS Grid. Must be responsive.', NOW() + INTERVAL '7 days', 50),
    ('a5000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Async JavaScript Project', 'Build an application that fetches data from an API and displays it dynamically.', NOW() + INTERVAL '21 days', 100),
    ('a5000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'Data Analysis Report', 'Analyze the provided dataset and create visualizations with Python. Submit a Jupyter notebook.', NOW() + INTERVAL '10 days', 100),
    ('a5000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 'UI/UX Case Study', 'Complete a UI/UX case study for a mobile app redesign. Include wireframes and prototype.', NOW() + INTERVAL '28 days', 100),
    ('a5000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000005', 'Database Design Project', 'Design a normalized database schema for an e-commerce platform. Include ER diagrams.', NOW() + INTERVAL '14 days', 100);

-- ================== SUBMISSIONS ==================

INSERT INTO submissions (id, assignment_id, student_id, file_url, content, score, feedback, submitted_at, graded_at)
VALUES 
    ('5b000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'https://github.com/alice/portfolio', 'My portfolio website featuring my web development projects.', 85, 'Great work! Nice responsive design. Could improve accessibility.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
    ('5b000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'https://github.com/alice/css-grid', 'CSS Grid layout implementation.', NULL, NULL, NOW() - INTERVAL '1 day', NULL),
    ('5b000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'https://github.com/bob/portfolio', 'Personal portfolio with dark theme.', 92, 'Excellent! Very creative design and clean code.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
    ('5b000000-0000-0000-0000-000000000004', 'a5000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', 'https://colab.research.google.com/carol/analysis', 'Complete data analysis with visualizations.', 78, 'Good analysis. Visualizations need improvement.', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
    ('5b000000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 'https://github.com/david/portfolio', 'Interactive portfolio with animations.', 100, 'Outstanding work! Perfect implementation.', NOW() - INTERVAL '60 days', NOW() - INTERVAL '58 days');

-- ================== QUIZZES ==================

INSERT INTO quizzes (id, course_id, title, time_limit)
VALUES 
    ('0a000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'HTML & CSS Fundamentals Quiz', 20),
    ('0a000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'JavaScript Basics Quiz', 30),
    ('0a000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Advanced JavaScript Concepts', 45),
    ('0a000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'Python Data Analysis Quiz', 30),
    ('0a000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'SQL Fundamentals Test', 40);

-- ================== QUESTIONS ==================

-- HTML & CSS Quiz Questions
INSERT INTO questions (id, quiz_id, question_text, question_type, options, correct_answer, points)
VALUES 
    ('0b000000-0000-0000-0000-000000000001', '0a000000-0000-0000-0000-000000000001', 'What does HTML stand for?', 'multiple_choice', '["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"]', 'Hyper Text Markup Language', 1),
    ('0b000000-0000-0000-0000-000000000002', '0a000000-0000-0000-0000-000000000001', 'Which CSS property is used to change text color?', 'multiple_choice', '["font-color", "text-color", "color", "foreground-color"]', 'color', 1),
    ('0b000000-0000-0000-0000-000000000003', '0a000000-0000-0000-0000-000000000001', 'The <header> tag is a semantic HTML5 element.', 'true_false', '["True", "False"]', 'True', 1),
    ('0b000000-0000-0000-0000-000000000004', '0a000000-0000-0000-0000-000000000001', 'What is the correct CSS syntax for making all <p> elements bold?', 'multiple_choice', '["p {font-weight: bold;}", "<p style=font-weight:bold>", "p {text-weight: bold;}", "p.bold {weight: bold;}"]', 'p {font-weight: bold;}', 1),
    ('0b000000-0000-0000-0000-000000000005', '0a000000-0000-0000-0000-000000000001', 'Flexbox is a one-dimensional layout method.', 'true_false', '["True", "False"]', 'True', 1);

-- JavaScript Basics Quiz Questions
INSERT INTO questions (id, quiz_id, question_text, question_type, options, correct_answer, points)
VALUES 
    ('0b000000-0000-0000-0000-000000000006', '0a000000-0000-0000-0000-000000000002', 'Which keyword is used to declare a variable in JavaScript?', 'multiple_choice', '["var", "let", "const", "All of the above"]', 'All of the above', 1),
    ('0b000000-0000-0000-0000-000000000007', '0a000000-0000-0000-0000-000000000002', 'JavaScript is a statically typed language.', 'true_false', '["True", "False"]', 'False', 1),
    ('0b000000-0000-0000-0000-000000000008', '0a000000-0000-0000-0000-000000000002', 'What is the output of typeof null?', 'multiple_choice', '["null", "undefined", "object", "boolean"]', 'object', 2),
    ('0b000000-0000-0000-0000-000000000009', '0a000000-0000-0000-0000-000000000002', 'Which method adds an element to the end of an array?', 'multiple_choice', '["push()", "pop()", "shift()", "unshift()"]', 'push()', 1),
    ('0b000000-0000-0000-0000-000000000010', '0a000000-0000-0000-0000-000000000002', 'Arrow functions can be used as constructors.', 'true_false', '["True", "False"]', 'False', 2);

-- Advanced JavaScript Quiz Questions
INSERT INTO questions (id, quiz_id, question_text, question_type, options, correct_answer, points)
VALUES 
    ('0b000000-0000-0000-0000-000000000011', '0a000000-0000-0000-0000-000000000003', 'What is a closure in JavaScript?', 'short_answer', NULL, 'A function that has access to variables from its outer scope even after the outer function has returned', 3),
    ('0b000000-0000-0000-0000-000000000012', '0a000000-0000-0000-0000-000000000003', 'Which of these is NOT a phase of the event loop?', 'multiple_choice', '["Timers", "I/O Callbacks", "Render", "Idle"]', 'Render', 2),
    ('0b000000-0000-0000-0000-000000000013', '0a000000-0000-0000-0000-000000000003', 'Promise.all() returns a rejected promise if any promise in the array rejects.', 'true_false', '["True", "False"]', 'True', 2),
    ('0b000000-0000-0000-0000-000000000014', '0a000000-0000-0000-0000-000000000003', 'What does the spread operator do?', 'multiple_choice', '["Expands an iterable into individual elements", "Creates a deep copy of an object", "Merges two arrays destructively", "None of the above"]', 'Expands an iterable into individual elements', 2);

-- Python Quiz Questions
INSERT INTO questions (id, quiz_id, question_text, question_type, options, correct_answer, points)
VALUES 
    ('0b000000-0000-0000-0000-000000000015', '0a000000-0000-0000-0000-000000000004', 'Which library is primarily used for data manipulation in Python?', 'multiple_choice', '["NumPy", "Pandas", "Matplotlib", "SciPy"]', 'Pandas', 1),
    ('0b000000-0000-0000-0000-000000000016', '0a000000-0000-0000-0000-000000000004', 'What is a DataFrame in Pandas?', 'short_answer', NULL, 'A two-dimensional labeled data structure with columns of potentially different types', 2),
    ('0b000000-0000-0000-0000-000000000017', '0a000000-0000-0000-0000-000000000004', 'NumPy arrays are mutable.', 'true_false', '["True", "False"]', 'True', 1),
    ('0b000000-0000-0000-0000-000000000018', '0a000000-0000-0000-0000-000000000004', 'Which method is used to read a CSV file in Pandas?', 'multiple_choice', '["read_csv()", "load_csv()", "import_csv()", "open_csv()"]', 'read_csv()', 1);

-- SQL Quiz Questions
INSERT INTO questions (id, quiz_id, question_text, question_type, options, correct_answer, points)
VALUES 
    ('0b000000-0000-0000-0000-000000000019', '0a000000-0000-0000-0000-000000000005', 'Which SQL clause is used to filter records?', 'multiple_choice', '["WHERE", "FILTER", "HAVING", "SELECT"]', 'WHERE', 1),
    ('0b000000-0000-0000-0000-000000000020', '0a000000-0000-0000-0000-000000000005', 'What is the difference between INNER JOIN and LEFT JOIN?', 'short_answer', NULL, 'INNER JOIN returns only matching rows from both tables, while LEFT JOIN returns all rows from the left table and matching rows from the right table', 3),
    ('0b000000-0000-0000-0000-000000000021', '0a000000-0000-0000-0000-000000000005', 'NULL values can be compared using the = operator.', 'true_false', '["True", "False"]', 'False', 2),
    ('0b000000-0000-0000-0000-000000000022', '0a000000-0000-0000-0000-000000000005', 'Which keyword is used to remove duplicate rows from a result set?', 'multiple_choice', '["UNIQUE", "DISTINCT", "DIFFERENT", "SINGLE"]', 'DISTINCT', 1);

-- ================== QUIZ ATTEMPTS ==================

INSERT INTO quiz_attempts (id, quiz_id, student_id, answers, score, started_at, completed_at)
VALUES 
    ('0c000000-0000-0000-0000-000000000001', '0a000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '{"0b000000-0000-0000-0000-000000000001": "Hyper Text Markup Language", "0b000000-0000-0000-0000-000000000002": "color", "0b000000-0000-0000-0000-000000000003": "True", "0b000000-0000-0000-0000-000000000004": "p {font-weight: bold;}", "0b000000-0000-0000-0000-000000000005": "True"}', 5, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '15 minutes'),
    ('0c000000-0000-0000-0000-000000000002', '0a000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '{"0b000000-0000-0000-0000-000000000006": "All of the above", "0b000000-0000-0000-0000-000000000007": "False", "0b000000-0000-0000-0000-000000000008": "undefined", "0b000000-0000-0000-0000-000000000009": "push()", "0b000000-0000-0000-0000-000000000010": "False"}', 5, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days' + INTERVAL '25 minutes'),
    ('0c000000-0000-0000-0000-000000000003', '0a000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', '{"0b000000-0000-0000-0000-000000000001": "Hyper Text Markup Language", "0b000000-0000-0000-0000-000000000002": "font-color", "0b000000-0000-0000-0000-000000000003": "True", "0b000000-0000-0000-0000-000000000004": "p {font-weight: bold;}", "0b000000-0000-0000-0000-000000000005": "False"}', 3, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '12 minutes'),
    ('0c000000-0000-0000-0000-000000000004', '0a000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', '{"0b000000-0000-0000-0000-000000000015": "Pandas", "0b000000-0000-0000-0000-000000000016": "A table-like structure", "0b000000-0000-0000-0000-000000000017": "True", "0b000000-0000-0000-0000-000000000018": "read_csv()"}', 4, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '20 minutes'),
    ('0c000000-0000-0000-0000-000000000005', '0a000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', '{"0b000000-0000-0000-0000-000000000001": "Hyper Text Markup Language", "0b000000-0000-0000-0000-000000000002": "color", "0b000000-0000-0000-0000-000000000003": "True", "0b000000-0000-0000-0000-000000000004": "p {font-weight: bold;}", "0b000000-0000-0000-0000-000000000005": "True"}', 5, NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days' + INTERVAL '10 minutes');

-- ================== NOTIFICATIONS ==================

INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Welcome to LMS!', 'Welcome to our Learning Management System. Start exploring courses and begin your learning journey!', 'info', true, NOW() - INTERVAL '30 days'),
    ('b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'Course Completed!', 'Congratulations! You have completed "Data Science with Python". Keep up the great work!', 'success', true, NOW() - INTERVAL '5 days'),
    ('b0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 'Assignment Graded', 'Your submission for "Build a Personal Portfolio" has been graded. Score: 85/100', 'info', false, NOW() - INTERVAL '1 day'),
    ('b0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', 'Assignment Due Soon', 'Reminder: "CSS Grid Layout Challenge" is due in 7 days.', 'warning', false, NOW() - INTERVAL '12 hours'),
    ('b0000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000002', 'Welcome to LMS!', 'Welcome! Browse our catalog to find courses that match your interests.', 'info', true, NOW() - INTERVAL '20 days'),
    ('b0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000002', 'New Course Available', 'A new course "Cloud Computing with AWS" is coming soon. Stay tuned!', 'info', false, NOW() - INTERVAL '2 days'),
    ('b0000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000003', 'Assignment Graded', 'Your "Data Analysis Report" has been graded. Score: 78/100', 'info', false, NOW() - INTERVAL '1 day'),
    ('b0000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'New Enrollment', 'A new student has enrolled in your course "Introduction to Web Development".', 'info', true, NOW() - INTERVAL '5 days'),
    ('b0000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Submission Received', 'New assignment submission received for "Build a Personal Portfolio".', 'info', false, NOW() - INTERVAL '2 days'),
    ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'System Update', 'LMS system will undergo maintenance on next Sunday at 2:00 AM.', 'warning', false, NOW() - INTERVAL '3 days');

-- ============================================
-- VERIFICATION: Check inserted data
-- ============================================

-- Uncomment these to verify data insertion:
-- SELECT 'Users' as table_name, COUNT(*) as count FROM users
-- UNION ALL SELECT 'Courses', COUNT(*) FROM courses
-- UNION ALL SELECT 'Lessons', COUNT(*) FROM lessons
-- UNION ALL SELECT 'Enrollments', COUNT(*) FROM enrollments
-- UNION ALL SELECT 'Assignments', COUNT(*) FROM assignments
-- UNION ALL SELECT 'Submissions', COUNT(*) FROM submissions
-- UNION ALL SELECT 'Quizzes', COUNT(*) FROM quizzes
-- UNION ALL SELECT 'Questions', COUNT(*) FROM questions
-- UNION ALL SELECT 'Quiz Attempts', COUNT(*) FROM quiz_attempts
-- UNION ALL SELECT 'Notifications', COUNT(*) FROM notifications;
