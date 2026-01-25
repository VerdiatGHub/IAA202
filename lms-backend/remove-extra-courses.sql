-- ============================================
-- REMOVE ALL COURSES EXCEPT "Introduction to Web Development"
-- Run this script on your DATABASE SERVER VM
-- ============================================

-- This will delete all courses except "Introduction to Web Development"
-- CASCADE will automatically remove all related data:
-- - Lessons
-- - Enrollments
-- - Lesson Progress
-- - Assignments
-- - Submissions
-- - Quizzes
-- - Questions
-- - Quiz Attempts

DELETE FROM courses 
WHERE title != 'Introduction to Web Development';

-- Verify remaining courses
SELECT 
    id, 
    title, 
    category, 
    level, 
    is_published,
    (SELECT COUNT(*) FROM lessons WHERE course_id = courses.id) as lesson_count,
    (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id) as enrollment_count
FROM courses 
ORDER BY created_at;
