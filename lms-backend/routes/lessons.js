const express = require('express');
const { query, getClient } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const lessonService = require('../services/lessonService');

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

        // Get lessons using service layer
        const lessons = await lessonService.findByModuleId(moduleId);

        res.json({ lessons });
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

        // Create lesson using service layer
        const lesson = await lessonService.create(courseId, moduleId, {
            title,
            content,
            videoUrl,
            duration,
            isRequired
        });

        res.status(201).json(lesson);
    } catch (error) {
        console.error('Create lesson error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/lessons/:lessonId - Get specific lesson
router.get('/lessons/:lessonId', authenticateToken, async (req, res) => {
    try {
        const { lessonId } = req.params;

        // Get lesson using service layer
        const lesson = await lessonService.findById(lessonId);

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        // Check access
        if (!lesson.isPublished && 
            req.user.role !== 'admin' && 
            lesson.instructorId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Remove internal fields before sending response
        const { instructorId, isPublished, ...lessonData } = lesson;

        res.json(lessonData);
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

        // Update lesson using service layer
        const updatedLesson = await lessonService.update(lessonId, {
            title,
            content,
            videoUrl,
            duration,
            isRequired,
            orderIndex
        });

        res.json(updatedLesson);
    } catch (error) {
        console.error('Update lesson error:', error);
        if (error.message === 'No fields to update') {
            return res.status(400).json({ error: error.message });
        }
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

        // Delete lesson using service layer (cascades to content_items)
        await lessonService.deleteLesson(lessonId);

        res.json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('Delete lesson error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/courses/:courseId/modules/:moduleId/lessons/reorder - Reorder lessons within a module
router.put('/courses/:courseId/modules/:moduleId/lessons/reorder', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const { lessonIds } = req.body;

        // Validate request body
        if (!lessonIds || !Array.isArray(lessonIds) || lessonIds.length === 0) {
            return res.status(400).json({ error: 'lessonIds array is required' });
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

        // Check authorization
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

        // Verify all lessons belong to this module
        const lessonCheckResult = await query(
            'SELECT id FROM lessons WHERE id = ANY($1) AND module_id = $2',
            [lessonIds, moduleId]
        );

        if (lessonCheckResult.rows.length !== lessonIds.length) {
            return res.status(400).json({ error: 'One or more lessons do not belong to this module' });
        }

        // Reorder lessons using service layer
        const orderMap = lessonIds.map((id, index) => ({ id, orderIndex: index }));
        await lessonService.reorder(moduleId, orderMap);

        // Fetch updated lessons
        const lessons = await lessonService.findByModuleId(moduleId);

        res.json({ lessons });
    } catch (error) {
        console.error('Reorder lessons error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
