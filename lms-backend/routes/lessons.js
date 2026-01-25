const express = require('express');
const { query, getClient } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/courses/:courseId/modules/:moduleId/lessons - Get all lessons for a module
router.get('/courses/:courseId/modules/:moduleId/lessons', authenticateToken, async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;

        // Check if course exists and user has access
        const courseResult = await query(
            'SELECT id, instructor_id, is_published FROM courses WHERE id = $1',
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const course = courseResult.rows[0];

        // Check access - students can only see published courses
        if (!course.is_published && 
            req.user.role !== 'admin' && 
            course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if module exists and belongs to this course
        const moduleResult = await query(
            'SELECT id FROM modules WHERE id = $1 AND course_id = $2',
            [moduleId, courseId]
        );

        if (moduleResult.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }

        // Get lessons for this module
        const lessonsResult = await query(`
            SELECT 
                id, course_id, module_id, title, content, video_url, 
                order_index, duration, is_required, created_at, updated_at
            FROM lessons
            WHERE module_id = $1
            ORDER BY order_index ASC
        `, [moduleId]);

        res.json({
            lessons: lessonsResult.rows.map(lesson => ({
                id: lesson.id,
                courseId: lesson.course_id,
                moduleId: lesson.module_id,
                title: lesson.title,
                content: lesson.content,
                videoUrl: lesson.video_url,
                orderIndex: lesson.order_index,
                duration: lesson.duration,
                isRequired: lesson.is_required,
                createdAt: lesson.created_at,
                updatedAt: lesson.updated_at
            }))
        });
    } catch (error) {
        console.error('Get lessons error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/courses/:courseId/modules/:moduleId/lessons - Create new lesson
router.post('/courses/:courseId/modules/:moduleId/lessons', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const { title, content, videoUrl, duration, isRequired } = req.body;

        // Validate required fields
        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Check if course exists and user has permission
        const courseResult = await query(
            'SELECT id, instructor_id FROM courses WHERE id = $1',
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const course = courseResult.rows[0];

        // Check authorization - instructor can only edit their own courses
        if (req.user.role !== 'admin' && course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if module exists and belongs to this course
        const moduleResult = await query(
            'SELECT id FROM modules WHERE id = $1 AND course_id = $2',
            [moduleId, courseId]
        );

        if (moduleResult.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }

        // Get the next order_index (max + 1) within this module
        const orderResult = await query(
            'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM lessons WHERE module_id = $1',
            [moduleId]
        );
        const nextOrder = orderResult.rows[0].next_order;

        // Insert the new lesson
        const result = await query(`
            INSERT INTO lessons (course_id, module_id, title, content, video_url, duration, is_required, order_index)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, course_id, module_id, title, content, video_url, duration, is_required, order_index, created_at, updated_at
        `, [
            courseId, 
            moduleId, 
            title.trim(), 
            content || null, 
            videoUrl || null, 
            duration || null, 
            isRequired !== undefined ? isRequired : true, 
            nextOrder
        ]);

        const lesson = result.rows[0];
        res.status(201).json({
            id: lesson.id,
            courseId: lesson.course_id,
            moduleId: lesson.module_id,
            title: lesson.title,
            content: lesson.content,
            videoUrl: lesson.video_url,
            duration: lesson.duration,
            isRequired: lesson.is_required,
            orderIndex: lesson.order_index,
            createdAt: lesson.created_at,
            updatedAt: lesson.updated_at
        });
    } catch (error) {
        console.error('Create lesson error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/lessons/:lessonId - Get specific lesson
router.get('/lessons/:lessonId', authenticateToken, async (req, res) => {
    try {
        const { lessonId } = req.params;

        // Get lesson with course info
        const lessonResult = await query(`
            SELECT 
                l.id, l.course_id, l.module_id, l.title, l.content, l.video_url,
                l.order_index, l.duration, l.is_required, l.created_at, l.updated_at,
                c.instructor_id, c.is_published
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = $1
        `, [lessonId]);

        if (lessonResult.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const lesson = lessonResult.rows[0];

        // Check access
        if (!lesson.is_published && 
            req.user.role !== 'admin' && 
            lesson.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({
            id: lesson.id,
            courseId: lesson.course_id,
            moduleId: lesson.module_id,
            title: lesson.title,
            content: lesson.content,
            videoUrl: lesson.video_url,
            orderIndex: lesson.order_index,
            duration: lesson.duration,
            isRequired: lesson.is_required,
            createdAt: lesson.created_at,
            updatedAt: lesson.updated_at
        });
    } catch (error) {
        console.error('Get lesson error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/lessons/:lessonId - Update lesson
router.put('/lessons/:lessonId', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, content, videoUrl, duration, isRequired, orderIndex } = req.body;

        // Get lesson with course info to check permissions
        const lessonCheck = await query(`
            SELECT l.id, l.course_id, c.instructor_id
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = $1
        `, [lessonId]);

        if (lessonCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const lesson = lessonCheck.rows[0];

        // Check authorization
        if (req.user.role !== 'admin' && lesson.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (title !== undefined && title.trim() !== '') {
            updates.push(`title = $${paramIndex++}`);
            params.push(title.trim());
        }

        if (content !== undefined) {
            updates.push(`content = $${paramIndex++}`);
            params.push(content || null);
        }

        if (videoUrl !== undefined) {
            updates.push(`video_url = $${paramIndex++}`);
            params.push(videoUrl || null);
        }

        if (duration !== undefined) {
            updates.push(`duration = $${paramIndex++}`);
            params.push(duration || null);
        }

        if (isRequired !== undefined) {
            updates.push(`is_required = $${paramIndex++}`);
            params.push(isRequired);
        }

        if (orderIndex !== undefined) {
            updates.push(`order_index = $${paramIndex++}`);
            params.push(orderIndex);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updated_at = NOW()`);
        params.push(lessonId);

        const result = await query(`
            UPDATE lessons 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, course_id, module_id, title, content, video_url, duration, is_required, order_index, created_at, updated_at
        `, params);

        const updatedLesson = result.rows[0];
        res.json({
            id: updatedLesson.id,
            courseId: updatedLesson.course_id,
            moduleId: updatedLesson.module_id,
            title: updatedLesson.title,
            content: updatedLesson.content,
            videoUrl: updatedLesson.video_url,
            duration: updatedLesson.duration,
            isRequired: updatedLesson.is_required,
            orderIndex: updatedLesson.order_index,
            createdAt: updatedLesson.created_at,
            updatedAt: updatedLesson.updated_at
        });
    } catch (error) {
        console.error('Update lesson error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/lessons/:lessonId - Delete lesson
router.delete('/lessons/:lessonId', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { lessonId } = req.params;

        // Get lesson with course info to check permissions
        const lessonCheck = await query(`
            SELECT l.id, l.course_id, c.instructor_id
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = $1
        `, [lessonId]);

        if (lessonCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const lesson = lessonCheck.rows[0];

        // Check authorization
        if (req.user.role !== 'admin' && lesson.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Delete lesson (cascades to content_items due to ON DELETE CASCADE)
        await query('DELETE FROM lessons WHERE id = $1', [lessonId]);

        res.json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('Delete lesson error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/courses/:courseId/modules/:moduleId/lessons/reorder - Reorder lessons within a module
router.put('/courses/:courseId/modules/:moduleId/lessons/reorder', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    const client = await getClient();
    
    try {
        const { courseId, moduleId } = req.params;
        const { lessonIds } = req.body;

        // Validate request body
        if (!lessonIds || !Array.isArray(lessonIds) || lessonIds.length === 0) {
            return res.status(400).json({ error: 'lessonIds array is required' });
        }

        // Check if course exists and user has permission
        const courseResult = await client.query(
            'SELECT id, instructor_id FROM courses WHERE id = $1',
            [courseId]
        );

        if (courseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const course = courseResult.rows[0];

        // Check authorization
        if (req.user.role !== 'admin' && course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if module exists and belongs to this course
        const moduleResult = await client.query(
            'SELECT id FROM modules WHERE id = $1 AND course_id = $2',
            [moduleId, courseId]
        );

        if (moduleResult.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }

        // Verify all lessons belong to this module
        const lessonCheckResult = await client.query(
            'SELECT id FROM lessons WHERE id = ANY($1) AND module_id = $2',
            [lessonIds, moduleId]
        );

        if (lessonCheckResult.rows.length !== lessonIds.length) {
            return res.status(400).json({ error: 'One or more lessons do not belong to this module' });
        }

        // Begin transaction
        await client.query('BEGIN');

        // Update order_index for each lesson
        for (let i = 0; i < lessonIds.length; i++) {
            await client.query(
                'UPDATE lessons SET order_index = $1, updated_at = NOW() WHERE id = $2',
                [i, lessonIds[i]]
            );
        }

        // Commit transaction
        await client.query('COMMIT');

        // Fetch updated lessons
        const updatedLessonsResult = await client.query(`
            SELECT 
                id, course_id, module_id, title, content, video_url, 
                order_index, duration, is_required, created_at, updated_at
            FROM lessons
            WHERE module_id = $1
            ORDER BY order_index ASC
        `, [moduleId]);

        res.json({
            lessons: updatedLessonsResult.rows.map(lesson => ({
                id: lesson.id,
                courseId: lesson.course_id,
                moduleId: lesson.module_id,
                title: lesson.title,
                content: lesson.content,
                videoUrl: lesson.video_url,
                orderIndex: lesson.order_index,
                duration: lesson.duration,
                isRequired: lesson.is_required,
                createdAt: lesson.created_at,
                updatedAt: lesson.updated_at
            }))
        });
    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        console.error('Reorder lessons error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
