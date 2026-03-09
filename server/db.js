const mysql = require('mysql2/promise');
require('dotenv').config();

// Load from env variables to keep secrets out of Git
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL via Env Config');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS diary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS memories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    connection.release();
    console.log('Tables verified and initialised');
  } catch (err) {
    console.error('Database Initialization Failed:', err.message);
  }
}

module.exports = { pool, initDB };
