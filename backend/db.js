const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'attendance.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create Attendance table
db.run(`CREATE TABLE IF NOT EXISTS Attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employeeName TEXT NOT NULL,
  employeeID TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL
)`, (err) => {
  if (err) {
    console.error('Error creating table:', err.message);
  } else {
    console.log('Attendance table ready.');
  }
});

module.exports = db;