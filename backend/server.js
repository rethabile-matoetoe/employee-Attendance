const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// MySQL Database setup for Railway
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'shuttle.proxy.rlwy.net',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'KpYuAiuFSTntCjVrGXsOoGfgGXpFkwLe',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT || 56296
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err.message);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(() => {
      db.connect();
    }, 5000);
  } else {
    console.log('✅ Connected to MySQL database on Railway');
    initializeDatabase();
  }
});

function initializeDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS Attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employeeName VARCHAR(255) NOT NULL,
      employeeID VARCHAR(100) NOT NULL,
      date VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating table:', err.message);
    } else {
      console.log('✅ Attendance table ready');
      insertSampleData();
    }
  });
}

function insertSampleData() {
  const checkSQL = "SELECT COUNT(*) as count FROM Attendance";
  
  db.query(checkSQL, (err, results) => {
    if (err) {
      console.error('Error checking table:', err.message);
      return;
    }
    
    const rowCount = results[0].count;
    
    if (rowCount === 0) {
      console.log('📝 Inserting sample data...');
      const sampleData = [
        ['John Smith', 'EMP001', '2024-01-15', 'Present'],
        ['Sarah Johnson', 'EMP002', '2024-01-15', 'Present'],
        ['Mike Wilson', 'EMP003', '2024-01-15', 'Absent']
      ];

      const insertSQL = `INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES ?`;
      
      db.query(insertSQL, [sampleData], (err) => {
        if (err) {
          console.error('Error inserting sample data:', err.message);
        } else {
          console.log('✅ Sample data inserted');
        }
      });
    }
  });
}

// CORS configuration for production
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// API Routes - Updated for MySQL
app.post('/api/attendance', (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;
  
  if (!employeeName || !employeeID || !date || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)`;
  db.query(sql, [employeeName, employeeID, date, status], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Attendance recorded successfully', id: result.insertId });
  });
});

app.get('/api/attendance', (req, res) => {
  const { search } = req.query;
  let sql = `SELECT * FROM Attendance ORDER BY date DESC, id DESC`;
  let params = [];

  if (search) {
    sql = `SELECT * FROM Attendance WHERE employeeName LIKE ? OR employeeID LIKE ? ORDER BY date DESC`;
    params = [`%${search}%`, `%${search}%`];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.delete('/api/attendance/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM Attendance WHERE id = ?';
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record deleted successfully' });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running on Railway with MySQL',
    timestamp: new Date().toISOString(),
    database: 'MySQL'
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: MySQL on Railway`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.end();
  process.exit(0);
});