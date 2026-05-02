const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2'); //✅ Developer changed mysql → mysql2, package.json
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection using environment variables from docker-compose
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'mysql',         // comes from docker-compose
  user: process.env.DB_USER || 'appuser',       // comes from docker-compose
  password: process.env.DB_PASSWORD || 'apppass', // comes from docker-compose
  database: process.env.DB_NAME || 'test_db',   // comes from docker-compose
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    process.exit(1);
  }
  console.log('Database connected.');

  // Create users table if not exists
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      role ENUM('Admin', 'User') NOT NULL
    )
  `;

  db.query(createUsersTable, (err) => {
    if (err) {
      console.error('Failed to create users table:', err.stack);
      process.exit(1);
    }
    console.log('Users table ready.');
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add a user
app.post('/api/users', (req, res) => {
  const { name, email, role } = req.body;
  db.query(
    'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
    [name, email, role],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: results.insertId, name, email, role });
    }
  );
});

// Update a user
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  db.query(
    'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
    [name, email, role, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ id, name, email, role });
    }
  );
});

// Delete a user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'User deleted successfully' });
  });
});

// Serve React frontend (dist folder copied here by Dockerfile)
app.use(express.static(path.join(__dirname, 'public')));

// All unknown routes go to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});