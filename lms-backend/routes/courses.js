const express = require('express');
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/courses - Get all courses
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { published, instructorId, category, level, search, limit = 50, offset = 0 } = req.query;

        let sql = `
            SELECT 
                c.id, c.title, c.description, c.thumbnail_url, c.instructor_id,
                c.is_published, c.is_public, c.category, c.level, c.duration, c.created_at, c.updated_at,
                u.full_name as instructor_name,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrollment_count,
                (SELECT COUNT(*) FROM lessons l 
                 JOIN modules m ON l.module_id = m.id 
                 WHERE m.course_id = c.id) as lesson_count,
                (SELECT COUNT(*) FROM submissions s 
                 JOIN assignments a ON s.assignment_id = a.id 
                 WHERE a.course_id = c.id AND s.score IS NULL) as pending_submissions
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
        `;

        const params = [];
        const conditions = [];

        // Non-admins can only see published courses or their own courses
        if (req.user.role === 'student') {
            conditions.push('c.is_published = true');
        } else if (req.user.role === 'instructor') {
            conditions.push('(c.is_published = true OR c.instructor_id = $' + (params.length + 1) + ')');
            params.push(req.user.id);
        }

        if (published !== undefined) {
            conditions.push(`c.is_published = $${params.length + 1}`);
            params.push(published === 'true');
        }

        if (instructorId) {
            conditions.push(`c.instructor_id = $${params.length + 1}`);
            params.push(instructorId);
        }

        if (category) {
            conditions.push(`c.category = $${params.length + 1}`);
            params.push(category);
        }

        if (level) {
            conditions.push(`c.level = $${params.length + 1}`);
            params.push(level);
        }

        if (search) {
            conditions.push(`(c.title ILIKE $${params.length + 1} OR c.description ILIKE $${params.length + 1})`);
            params.push(`%${search}%`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY c.created_at DESC';
        sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await query(sql, params);

        res.json({
            courses: result.rows.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                thumbnailUrl: course.thumbnail_url,
                instructorId: course.instructor_id,
                instructorName: course.instructor_name,
                isPublished: course.is_published,
                isPublic: course.is_public,
                category: course.category,
                level: course.level,
                duration: course.duration,
                enrollmentCount: parseInt(course.enrollment_count),
                lessonCount: parseInt(course.lesson_count),
                pendingSubmissions: parseInt(course.pending_submissions || 0),
                createdAt: course.created_at,
                updatedAt: course.updated_at
            }))
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/courses/stats - Get course statistics (admin only)
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [totalCourses, publishedCourses, totalEnrollments] = await Promise.all([
            query('SELECT COUNT(*) FROM courses'),
            query('SELECT COUNT(*) FROM courses WHERE is_published = true'),
            query('SELECT COUNT(*) FROM enrollments')
        ]);

        res.json({
            total: parseInt(totalCourses.rows[0].count),
            published: parseInt(publishedCourses.rows[0].count),
            totalEnrollments: parseInt(totalEnrollments.rows[0].count)
        });
    } catch (error) {
        console.error('Get course stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/courses/:id - Get course by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT 
                c.id, c.title, c.description, c.thumbnail_url, c.instructor_id,
                c.is_published, c.is_public, c.category, c.level, c.duration, c.created_at, c.updated_at,
                u.full_name as instructor_name, u.email as instructor_email,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrollment_count,
                (SELECT COUNT(*) FROM lessons l 
                 JOIN modules m ON l.module_id = m.id 
                 WHERE m.course_id = c.id) as lesson_count
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE c.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const course = result.rows[0];

        // Check access
        if (!course.is_published &&
            req.user.role !== 'admin' &&
            course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get lessons with their modules
        const lessons = await query(`
            SELECT l.id, l.title, l.content, l.video_url, l.order_index, l.duration, l.created_at,
                   m.id as module_id, m.title as module_title
            FROM lessons l
            JOIN modules m ON l.module_id = m.id
            WHERE m.course_id = $1
            ORDER BY m.order_index, l.order_index
        `, [id]);

        res.json({
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnailUrl: course.thumbnail_url,
            instructorId: course.instructor_id,
            instructor: {
                id: course.instructor_id,
                fullName: course.instructor_name,
                email: course.instructor_email
            },
            isPublished: course.is_published,
            isPublic: course.is_public,
            category: course.category,
            level: course.level,
            duration: course.duration,
            enrollmentCount: parseInt(course.enrollment_count),
            lessonCount: parseInt(course.lesson_count),
            lessons: lessons.rows.map(l => ({
                id: l.id,
                title: l.title,
                content: l.content,
                videoUrl: l.video_url,
                orderIndex: l.order_index,
                duration: l.duration,
                moduleId: l.module_id,
                moduleTitle: l.module_title,
                createdAt: l.created_at
            })),
            createdAt: course.created_at,
            updatedAt: course.updated_at
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/courses - Create new course (instructor/admin only)
router.post('/', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { title, description, thumbnailUrl, category, level, duration } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const result = await query(`
            INSERT INTO courses (title, description, thumbnail_url, instructor_id, category, level, duration)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, title, description, thumbnail_url, instructor_id, is_published, category, level, duration, created_at
        `, [title, description, thumbnailUrl, req.user.id, category, level || 'beginner', duration]);

        const course = result.rows[0];
        res.status(201).json({
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnailUrl: course.thumbnail_url,
            instructorId: course.instructor_id,
            isPublished: course.is_published,
            category: course.category,
            level: course.level,
            duration: course.duration,
            createdAt: course.created_at
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/courses/:id - Update course
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, thumbnailUrl, category, level, duration, isPublished, isPublic } = req.body;

        // Check ownership
        const existing = await query('SELECT instructor_id FROM courses WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (req.user.role !== 'admin' && existing.rows[0].instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (title) {
            updates.push(`title = $${paramIndex++}`);
            params.push(title);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(description);
        }
        if (thumbnailUrl !== undefined) {
            updates.push(`thumbnail_url = $${paramIndex++}`);
            params.push(thumbnailUrl);
        }
        if (category !== undefined) {
            updates.push(`category = $${paramIndex++}`);
            params.push(category);
        }
        if (level) {
            updates.push(`level = $${paramIndex++}`);
            params.push(level);
        }
        if (duration !== undefined) {
            updates.push(`duration = $${paramIndex++}`);
            params.push(duration);
        }
        if (isPublished !== undefined) {
            updates.push(`is_published = $${paramIndex++}`);
            params.push(isPublished);
        }
        if (isPublic !== undefined) {
            updates.push(`is_public = $${paramIndex++}`);
            params.push(isPublic);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(id);
        const result = await query(`
            UPDATE courses SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $${paramIndex}
            RETURNING id, title, description, thumbnail_url, instructor_id, is_published, is_public, category, level, duration, created_at, updated_at
        `, params);

        const course = result.rows[0];
        res.json({
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnailUrl: course.thumbnail_url,
            instructorId: course.instructor_id,
            isPublished: course.is_published,
            isPublic: course.is_public,
            category: course.category,
            level: course.level,
            duration: course.duration,
            createdAt: course.created_at,
            updatedAt: course.updated_at
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/courses/:id - Delete course
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const existing = await query('SELECT instructor_id FROM courses WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (req.user.role !== 'admin' && existing.rows[0].instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await query('DELETE FROM courses WHERE id = $1', [id]);
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
