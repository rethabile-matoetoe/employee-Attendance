const express = require('express');
const router = express.Router();
const db = require('./db');

// POST - Add new attendance record
router.post('/', (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;
  
  // Input validation
  if (!employeeName || !employeeID || !date || !status) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  const sql = `INSERT INTO Attendance (employeeName, employeeID, date, status) 
               VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [employeeName, employeeID, date, status], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      message: 'Attendance recorded successfully', 
      id: this.lastID 
    });
  });
});

// GET - Retrieve all attendance records
router.get('/', (req, res) => {
  const sql = `SELECT * FROM Attendance ORDER BY date DESC, id DESC`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// DELETE - Remove attendance record (Bonus feature)
router.delete('/:id', (req, res) => {
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

// GET - Search records (Bonus feature)
router.get('/search', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }
  
  const sql = `SELECT * FROM Attendance 
               WHERE employeeName LIKE ? OR employeeID LIKE ? 
               ORDER BY date DESC`;
  
  const searchTerm = `%${query}%`;
  
  db.all(sql, [searchTerm, searchTerm], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;