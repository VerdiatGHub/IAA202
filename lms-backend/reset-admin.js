const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function resetAdmin() {
    try {
        console.log('🔒 Generating new hash for "admin123"...');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('admin123', salt);

        console.log('🔄 Updating admin user in database...');
        const res = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
            [hash, 'admin@lms.local']
        );

        if (res.rowCount > 0) {
            console.log('✅ Success! Admin password reset to "admin123".');
            console.log('User:', res.rows[0]);
        } else {
            console.error('❌ Admin user not found in database!');
        }
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        pool.end();
    }
}

resetAdmin();
