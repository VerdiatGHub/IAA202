const express = require('express');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await query(
            `SELECT id, user_id, title, message, type, is_read, created_at 
             FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 20`,
            [req.user.id]
        );

        const notifications = result.rows.map(n => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: n.is_read,
            createdAt: n.created_at
        }));

        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const result = await query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
            [req.user.id]
        );

        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE id = $1 AND user_id = $2 
             RETURNING id, user_id, title, message, type, is_read, created_at`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        const n = result.rows[0];
        res.json({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: n.is_read,
            createdAt: n.created_at
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        await query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
            [req.user.id]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

module.exports = router;
