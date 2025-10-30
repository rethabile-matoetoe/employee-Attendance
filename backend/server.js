const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - FIXED
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json());

// Database setup - Use MySQL on Railway, SQLite locally
let db;
if (process.env.NODE_ENV === 'production' && process.env.DB_HOST) {
  // Production - MySQL on Railway
  const mysql = require('mysql2');
  console.log('🔗 Connecting to MySQL on Railway...');
  
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  db.connect((err) => {
    if (err) {
      console.error('❌ MySQL Connection Error:', err.message);
    } else {
      console.log('✅ Connected to MySQL database on Railway');
      initializeDatabase();
    }
  });
} else {
  // Development - SQLite locally
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'attendance.db');
  console.log('🔗 Connecting to SQLite locally...');
  
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ SQLite Connection Error:', err.message);
    } else {
      console.log('✅ Connected to SQLite database locally');
      initializeDatabase();
    }
  });
}

function initializeDatabase() {
  let createTableSQL;
  
  if (process.env.NODE_ENV === 'production' && process.env.DB_HOST) {
    // MySQL table
    createTableSQL = `
      CREATE TABLE IF NOT EXISTS Attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeName VARCHAR(255) NOT NULL,
        employeeID VARCHAR(100) NOT NULL,
        date VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } else {
    // SQLite table
    createTableSQL = `
      CREATE TABLE IF NOT EXISTS Attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeName TEXT NOT NULL,
        employeeID TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
  }

  // Use appropriate query method based on database type
  if (typeof db.run === 'function') {
    // SQLite
    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('❌ Error creating table:', err.message);
      } else {
        console.log('✅ Attendance table ready');
        insertSampleData();
      }
    });
  } else {
    // MySQL
    db.query(createTableSQL, (err) => {
      if (err) {
        console.error('❌ Error creating table:', err.message);
      } else {
        console.log('✅ Attendance table ready');
        insertSampleData();
      }
    });
  }
}

function insertSampleData() {
  const checkSQL = "SELECT COUNT(*) as count FROM Attendance";
  
  const handleResults = (err, results) => {
    if (err) {
      console.error('Error checking table:', err.message);
      return;
    }
    
    let rowCount;
    if (Array.isArray(results)) {
      // MySQL results
      rowCount = results[0].count;
    } else {
      // SQLite results
      rowCount = results.count;
    }
    
    if (rowCount === 0) {
      console.log('📝 Inserting sample data...');
      const sampleData = [
        ['John Smith', 'EMP001', '2024-01-15', 'Present'],
        ['Sarah Johnson', 'EMP002', '2024-01-15', 'Present'],
        ['Mike Wilson', 'EMP003', '2024-01-15', 'Absent']
      ];

      if (typeof db.run === 'function') {
        // SQLite insert
        const insertSQL = `INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)`;
        sampleData.forEach(employee => {
          db.run(insertSQL, employee);
        });
      } else {
        // MySQL insert
        const insertSQL = `INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES ?`;
        db.query(insertSQL, [sampleData]);
      }
      console.log('✅ Sample data inserted');
    }
  };

  // Use appropriate query method
  if (typeof db.run === 'function') {
    db.get(checkSQL, handleResults);
  } else {
    db.query(checkSQL, handleResults);
  }
}

// Unified API Routes that work with both SQLite and MySQL
app.post('/api/attendance', (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;
  
  if (!employeeName || !employeeID || !date || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)`;
  
  const handleResult = (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const id = result.insertId || result.lastID;
    res.json({ message: 'Attendance recorded successfully', id });
  };

  if (typeof db.run === 'function') {
    db.run(sql, [employeeName, employeeID, date, status], handleResult);
  } else {
    db.query(sql, [employeeName, employeeID, date, status], handleResult);
  }
});

app.get('/api/attendance', (req, res) => {
  const { search } = req.query;
  let sql = `SELECT * FROM Attendance ORDER BY date DESC, id DESC`;
  let params = [];

  if (search) {
    sql = `SELECT * FROM Attendance WHERE employeeName LIKE ? OR employeeID LIKE ? ORDER BY date DESC`;
    params = [`%${search}%`, `%${search}%`];
  }

  const handleResults = (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  };

  if (typeof db.run === 'function') {
    db.all(sql, params, handleResults);
  } else {
    db.query(sql, params, handleResults);
  }
});

// ADDED: Search route that was missing
app.get('/api/attendance/search', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }
  
  const sql = `SELECT * FROM Attendance 
               WHERE employeeName LIKE ? OR employeeID LIKE ? 
               ORDER BY date DESC`;
  const searchTerm = `%${query}%`;
  
  const handleResults = (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  };

  if (typeof db.run === 'function') {
    db.all(sql, [searchTerm, searchTerm], handleResults);
  } else {
    db.query(sql, [searchTerm, searchTerm], handleResults);
  }
});

app.delete('/api/attendance/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM Attendance WHERE id = ?';
  
  const handleResult = (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const changes = result.affectedRows || result.changes;
    if (changes === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record deleted successfully' });
  };

  if (typeof db.run === 'function') {
    db.run(sql, [id], handleResult);
  } else {
    db.query(sql, [id], handleResult);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const dbType = (process.env.NODE_ENV === 'production' && process.env.DB_HOST) ? 'MySQL (Railway)' : 'SQLite (Local)';
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: dbType,
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
  const dbType = (process.env.NODE_ENV === 'production' && process.env.DB_HOST) ? 'MySQL on Railway' : 'SQLite locally';
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${dbType}`);
});