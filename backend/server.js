const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database setup (SQLite for Railway)
const sqlite3 = require('sqlite3').verbose();
const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'attendance.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS Attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeName TEXT NOT NULL,
      employeeID TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating table:', err.message);
    } else {
      console.log('✅ Attendance table ready');
      insertSampleData();
    }
  });
}

function insertSampleData() {
  db.get("SELECT COUNT(*) as count FROM Attendance", (err, row) => {
    if (!err && row.count === 0) {
      console.log('📝 Inserting sample data...');
      const sampleData = [
        ['John Smith', 'EMP001', '2024-01-15', 'Present'],
        ['Sarah Johnson', 'EMP002', '2024-01-15', 'Present'],
        ['Mike Wilson', 'EMP003', '2024-01-15', 'Absent']
      ];

      const insertSQL = `INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)`;
      sampleData.forEach(employee => {
        db.run(insertSQL, employee);
      });
      console.log('✅ Sample data inserted');
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

// API Routes
app.post('/api/attendance', (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;
  
  if (!employeeName || !employeeID || !date || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)`;
  db.run(sql, [employeeName, employeeID, date, status], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Attendance recorded successfully', id: this.lastID });
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

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.delete('/api/attendance/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM Attendance WHERE id = ?', id, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record deleted successfully' });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running on Railway',
    timestamp: new Date().toISOString()
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
});