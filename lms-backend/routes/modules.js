const express = require('express');
const { query, getClient } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/courses/:courseId/modules - Get all modules for a course
router.get('/courses/:courseId/modules', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.params;

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

        // Get modules with their lessons
        const modulesResult = await query(`
            SELECT 
                m.id, m.course_id, m.title, m.description, m.order_index,
                m.created_at, m.updated_at,
                COUNT(l.id) as lesson_count
            FROM modules m
            LEFT JOIN lessons l ON l.module_id = m.id
            WHERE m.course_id = $1
            GROUP BY m.id
            ORDER BY m.order_index ASC
        `, [courseId]);

        res.json({
            modules: modulesResult.rows.map(module => ({
                id: module.id,
                courseId: module.course_id,
                title: module.title,
                description: module.description,
                orderIndex: module.order_index,
                lessonCount: parseInt(module.lesson_count),
                createdAt: module.created_at,
                updatedAt: module.updated_at
            }))
        });
    } catch (error) {
        console.error('Get modules error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/courses/:courseId/modules - Create new module
router.post('/courses/:courseId/modules', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description } = req.body;

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

        // Get the next order_index (max + 1)
        const orderResult = await query(
            'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM modules WHERE course_id = $1',
            [courseId]
        );
        const nextOrder = orderResult.rows[0].next_order;

        // Insert the new module
        const result = await query(`
            INSERT INTO modules (course_id, title, description, order_index)
            VALUES ($1, $2, $3, $4)
            RETURNING id, course_id, title, description, order_index, created_at, updated_at
        `, [courseId, title.trim(), description || null, nextOrder]);

        const module = result.rows[0];
        res.status(201).json({
            id: module.id,
            courseId: module.course_id,
            title: module.title,
            description: module.description,
            orderIndex: module.order_index,
            createdAt: module.created_at,
            updatedAt: module.updated_at
        });
    } catch (error) {
        console.error('Create module error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/courses/:courseId/modules/:moduleId - Get specific module
router.get('/courses/:courseId/modules/:moduleId', authenticateToken, async (req, res) => {
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

        // Check access
        if (!course.is_published && 
            req.user.role !== 'admin' && 
            course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get module
        const moduleResult = await query(`
            SELECT id, course_id, title, description, order_index, created_at, updated_at
            FROM modules
            WHERE id = $1 AND course_id = $2
        `, [moduleId, courseId]);

        if (moduleResult.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const module = moduleResult.rows[0];

        // Get lessons for this module
        const lessonsResult = await query(`
            SELECT id, title, content, video_url, order_index, duration, is_required, created_at
            FROM lessons
            WHERE module_id = $1
            ORDER BY order_index ASC
        `, [moduleId]);

        res.json({
            id: module.id,
            courseId: module.course_id,
            title: module.title,
            description: module.description,
            orderIndex: module.order_index,
            lessons: lessonsResult.rows.map(l => ({
                id: l.id,
                title: l.title,
                content: l.content,
                videoUrl: l.video_url,
                orderIndex: l.order_index,
                duration: l.duration,
                isRequired: l.is_required,
                createdAt: l.created_at
            })),
            createdAt: module.created_at,
            updatedAt: module.updated_at
        });
    } catch (error) {
        console.error('Get module error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/courses/:courseId/modules/:moduleId - Update module
router.put('/courses/:courseId/modules/:moduleId', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const { title, description, orderIndex } = req.body;

        // Check if course exists and user has permission
        const courseResult = await query(
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

        // Check if module exists
        const moduleCheck = await query(
            'SELECT id FROM modules WHERE id = $1 AND course_id = $2',
            [moduleId, courseId]
        );

        if (moduleCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (title !== undefined && title.trim() !== '') {
            updates.push(`title = $${paramIndex++}`);
            params.push(title.trim());
        }

        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(description || null);
        }

        if (orderIndex !== undefined) {
            updates.push(`order_index = $${paramIndex++}`);
            params.push(orderIndex);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updated_at = NOW()`);
        params.push(moduleId);

        const result = await query(`
            UPDATE modules 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, course_id, title, description, order_index, created_at, updated_at
        `, params);

        const module = result.rows[0];
        res.json({
            id: module.id,
            courseId: module.course_id,
            title: module.title,
            description: module.description,
            orderIndex: module.order_index,
            createdAt: module.created_at,
            updatedAt: module.updated_at
        });
    } catch (error) {
        console.error('Update module error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/courses/:courseId/modules/:moduleId - Delete module
router.delete('/courses/:courseId/modules/:moduleId', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;

        // Check if course exists and user has permission
        const courseResult = await query(
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

        // Check if module exists
        const moduleCheck = await query(
            'SELECT id FROM modules WHERE id = $1 AND course_id = $2',
            [moduleId, courseId]
        );

        if (moduleCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }

        // Delete module (cascades to lessons due to ON DELETE CASCADE)
        await query('DELETE FROM modules WHERE id = $1', [moduleId]);

        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        console.error('Delete module error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/courses/:courseId/modules/reorder - Reorder modules
router.put('/courses/:courseId/modules/reorder', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    const client = await getClient();
    
    try {
        const { courseId } = req.params;
        const { moduleIds } = req.body;

        // Validate request body
        if (!moduleIds || !Array.isArray(moduleIds) || moduleIds.length === 0) {
            return res.status(400).json({ error: 'moduleIds array is required' });
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

        // Verify all modules belong to this course
        const moduleCheckResult = await client.query(
            'SELECT id FROM modules WHERE id = ANY($1) AND course_id = $2',
            [moduleIds, courseId]
        );

        if (moduleCheckResult.rows.length !== moduleIds.length) {
            return res.status(400).json({ error: 'One or more modules do not belong to this course' });
        }

        // Begin transaction
        await client.query('BEGIN');

        // Update order_index for each module
        for (let i = 0; i < moduleIds.length; i++) {
            await client.query(
                'UPDATE modules SET order_index = $1, updated_at = NOW() WHERE id = $2',
                [i, moduleIds[i]]
            );
        }

        // Commit transaction
        await client.query('COMMIT');

        // Fetch updated modules
        const updatedModulesResult = await client.query(`
            SELECT 
                m.id, m.course_id, m.title, m.description, m.order_index,
                m.created_at, m.updated_at,
                COUNT(l.id) as lesson_count
            FROM modules m
            LEFT JOIN lessons l ON l.module_id = m.id
            WHERE m.course_id = $1
            GROUP BY m.id
            ORDER BY m.order_index ASC
        `, [courseId]);

        res.json({
            modules: updatedModulesResult.rows.map(module => ({
                id: module.id,
                courseId: module.course_id,
                title: module.title,
                description: module.description,
                orderIndex: module.order_index,
                lessonCount: parseInt(module.lesson_count),
                createdAt: module.created_at,
                updatedAt: module.updated_at
            }))
        });
    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        console.error('Reorder modules error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
