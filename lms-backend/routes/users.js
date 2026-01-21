const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { role, search, limit = 50, offset = 0 } = req.query;

        let sql = 'SELECT id, email, full_name, avatar_url, role, created_at, updated_at FROM users';
        const params = [];
        const conditions = [];

        if (role) {
            conditions.push(`role = $${params.length + 1}`);
            params.push(role);
        }

        if (search) {
            conditions.push(`(full_name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`);
            params.push(`%${search}%`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC';
        sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await query(sql, params);

        // Get total count
        let countSql = 'SELECT COUNT(*) FROM users';
        if (conditions.length > 0) {
            countSql += ' WHERE ' + conditions.join(' AND ');
        }
        const countResult = await query(countSql, params.slice(0, -2));

        res.json({
            users: result.rows.map(user => ({
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                avatarUrl: user.avatar_url,
                role: user.role,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            })),
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users/stats - Get user statistics (admin only)
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [studentCount, instructorCount, adminCount, recentUsers] = await Promise.all([
            query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
            query("SELECT COUNT(*) FROM users WHERE role = 'instructor'"),
            query("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
            query(`
                SELECT id, email, full_name, role, created_at 
                FROM users 
                ORDER BY created_at DESC 
                LIMIT 5
            `)
        ]);

        res.json({
            students: parseInt(studentCount.rows[0].count),
            instructors: parseInt(instructorCount.rows[0].count),
            admins: parseInt(adminCount.rows[0].count),
            total: parseInt(studentCount.rows[0].count) +
                parseInt(instructorCount.rows[0].count) +
                parseInt(adminCount.rows[0].count),
            recentUsers: recentUsers.rows.map(u => ({
                id: u.id,
                email: u.email,
                fullName: u.full_name,
                role: u.role,
                createdAt: u.created_at
            }))
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Users can only view their own profile unless they're admin
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await query(
            'SELECT id, email, full_name, avatar_url, role, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url,
            role: user.role,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/users - Create new user (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { email, password, fullName, role = 'student' } = req.body;

        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required' });
        }

        // Check if email already exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const result = await query(
            `INSERT INTO users (email, password_hash, full_name, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, email, full_name, avatar_url, role, created_at`,
            [email.toLowerCase(), passwordHash, fullName, role]
        );

        const user = result.rows[0];
        res.status(201).json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url,
            role: user.role,
            createdAt: user.created_at
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/users/:id - Update user
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, avatarUrl, role, password } = req.body;

        // Users can only update their own profile unless they're admin
        // Only admins can change roles
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (role && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can change user roles' });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (fullName) {
            updates.push(`full_name = $${paramIndex++}`);
            params.push(fullName);
        }

        if (avatarUrl !== undefined) {
            updates.push(`avatar_url = $${paramIndex++}`);
            params.push(avatarUrl);
        }

        if (role && req.user.role === 'admin') {
            updates.push(`role = $${paramIndex++}`);
            params.push(role);
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            updates.push(`password_hash = $${paramIndex++}`);
            params.push(passwordHash);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(id);
        const result = await query(
            `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() 
             WHERE id = $${paramIndex} 
             RETURNING id, email, full_name, avatar_url, role, created_at, updated_at`,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url,
            role: user.role,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (req.user.id === id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
