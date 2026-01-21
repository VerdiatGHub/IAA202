const express = require('express');
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/enrollments - Get enrollments
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { studentId, courseId, limit = 50, offset = 0 } = req.query;

        let sql = `
            SELECT 
                e.id, e.student_id, e.course_id, e.progress, e.enrolled_at, e.completed_at,
                c.title as course_title, c.thumbnail_url as course_thumbnail,
                c.level as course_level, c.category as course_category,
                u.full_name as student_name, u.email as student_email
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            JOIN users u ON e.student_id = u.id
        `;

        const params = [];
        const conditions = [];

        // Students can only see their own enrollments
        if (req.user.role === 'student') {
            conditions.push(`e.student_id = $${params.length + 1}`);
            params.push(req.user.id);
        } else if (studentId) {
            conditions.push(`e.student_id = $${params.length + 1}`);
            params.push(studentId);
        }

        if (courseId) {
            conditions.push(`e.course_id = $${params.length + 1}`);
            params.push(courseId);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY e.enrolled_at DESC';
        sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await query(sql, params);

        res.json({
            enrollments: result.rows.map(e => ({
                id: e.id,
                studentId: e.student_id,
                courseId: e.course_id,
                progress: e.progress,
                enrolledAt: e.enrolled_at,
                completedAt: e.completed_at,
                course: {
                    id: e.course_id,
                    title: e.course_title,
                    thumbnailUrl: e.course_thumbnail,
                    level: e.course_level,
                    category: e.course_category
                },
                student: {
                    id: e.student_id,
                    fullName: e.student_name,
                    email: e.student_email
                }
            }))
        });
    } catch (error) {
        console.error('Get enrollments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/enrollments/my - Get current user's enrollments
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                e.id, e.student_id, e.course_id, e.progress, e.enrolled_at, e.completed_at,
                c.title as course_title, c.description as course_description,
                c.thumbnail_url as course_thumbnail, c.level as course_level,
                c.category as course_category, c.duration as course_duration,
                u.full_name as instructor_name,
                (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as lesson_count
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE e.student_id = $1
            ORDER BY e.enrolled_at DESC
        `, [req.user.id]);

        res.json({
            enrollments: result.rows.map(e => ({
                id: e.id,
                studentId: e.student_id,
                courseId: e.course_id,
                progress: e.progress,
                enrolledAt: e.enrolled_at,
                completedAt: e.completed_at,
                course: {
                    id: e.course_id,
                    title: e.course_title,
                    description: e.course_description,
                    thumbnailUrl: e.course_thumbnail,
                    level: e.course_level,
                    category: e.course_category,
                    duration: e.course_duration,
                    instructorName: e.instructor_name,
                    lessonCount: parseInt(e.lesson_count)
                }
            }))
        });
    } catch (error) {
        console.error('Get my enrollments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/enrollments/stats - Get enrollment statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            // Student stats
            const [enrolled, completed, avgProgress] = await Promise.all([
                query('SELECT COUNT(*) FROM enrollments WHERE student_id = $1', [req.user.id]),
                query('SELECT COUNT(*) FROM enrollments WHERE student_id = $1 AND completed_at IS NOT NULL', [req.user.id]),
                query('SELECT AVG(progress) FROM enrollments WHERE student_id = $1', [req.user.id])
            ]);

            res.json({
                enrolledCourses: parseInt(enrolled.rows[0].count),
                completedCourses: parseInt(completed.rows[0].count),
                averageProgress: Math.round(parseFloat(avgProgress.rows[0].avg) || 0)
            });
        } else {
            // Admin/Instructor stats
            const [total, avgProgress] = await Promise.all([
                query('SELECT COUNT(*) FROM enrollments'),
                query('SELECT AVG(progress) FROM enrollments')
            ]);

            res.json({
                totalEnrollments: parseInt(total.rows[0].count),
                averageProgress: Math.round(parseFloat(avgProgress.rows[0].avg) || 0)
            });
        }
    } catch (error) {
        console.error('Get enrollment stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/enrollments - Enroll in a course
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { courseId, studentId } = req.body;

        // Use current user if studentId not provided (or if not admin)
        const targetStudentId = (req.user.role === 'admin' && studentId) ? studentId : req.user.id;

        if (!courseId) {
            return res.status(400).json({ error: 'Course ID is required' });
        }

        // Check if course exists and is published
        const course = await query('SELECT id, is_published FROM courses WHERE id = $1', [courseId]);
        if (course.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (!course.rows[0].is_published && req.user.role !== 'admin') {
            return res.status(400).json({ error: 'Cannot enroll in unpublished course' });
        }

        // Check if already enrolled
        const existing = await query(
            'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
            [targetStudentId, courseId]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Already enrolled in this course' });
        }

        // Create enrollment
        const result = await query(`
            INSERT INTO enrollments (student_id, course_id)
            VALUES ($1, $2)
            RETURNING id, student_id, course_id, progress, enrolled_at
        `, [targetStudentId, courseId]);

        const enrollment = result.rows[0];
        res.status(201).json({
            id: enrollment.id,
            studentId: enrollment.student_id,
            courseId: enrollment.course_id,
            progress: enrollment.progress,
            enrolledAt: enrollment.enrolled_at
        });
    } catch (error) {
        console.error('Create enrollment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/enrollments/:id - Update enrollment progress
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { progress } = req.body;

        // Check ownership
        const existing = await query('SELECT student_id FROM enrollments WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        if (req.user.role !== 'admin' && existing.rows[0].student_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (progress === undefined || progress < 0 || progress > 100) {
            return res.status(400).json({ error: 'Progress must be between 0 and 100' });
        }

        const completedAt = progress === 100 ? 'NOW()' : 'NULL';
        const result = await query(`
            UPDATE enrollments 
            SET progress = $1, completed_at = ${progress === 100 ? 'NOW()' : 'NULL'}
            WHERE id = $2
            RETURNING id, student_id, course_id, progress, enrolled_at, completed_at
        `, [progress, id]);

        const enrollment = result.rows[0];
        res.json({
            id: enrollment.id,
            studentId: enrollment.student_id,
            courseId: enrollment.course_id,
            progress: enrollment.progress,
            enrolledAt: enrollment.enrolled_at,
            completedAt: enrollment.completed_at
        });
    } catch (error) {
        console.error('Update enrollment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/enrollments/:id - Unenroll from course
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const existing = await query('SELECT student_id FROM enrollments WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        if (req.user.role !== 'admin' && existing.rows[0].student_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await query('DELETE FROM enrollments WHERE id = $1', [id]);
        res.json({ message: 'Unenrolled successfully' });
    } catch (error) {
        console.error('Delete enrollment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
