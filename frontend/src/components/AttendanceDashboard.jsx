import React, { useState, useEffect } from 'react'
import axios from 'axios'
import '../Animations.css'

function AttendanceDashboard({ refresh }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(null)

  // FIXED: Direct API URL
  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchRecords()
  }, [refresh])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance`)
      setRecords(response.data)
    } catch (error) {
      console.error('Error fetching records:', error)
      alert('Error loading attendance records')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchRecords()
      return
    }

    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance/search?query=${encodeURIComponent(searchQuery)}`)
      setRecords(response.data)
    } catch (error) {
      console.error('Error searching records:', error)
      alert('Error searching records')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, employeeName) => {
    if (!window.confirm(`Are you sure you want to delete attendance record for ${employeeName}?`)) {
      return
    }

    setDeleteLoading(id)
    try {
      await axios.delete(`${API_BASE_URL}/attendance/${id}`)
      
      setShowDeleteSuccess(true)
      setTimeout(() => setShowDeleteSuccess(false), 3000)
      
      fetchRecords() // Refresh the list
    } catch (error) {
      console.error('Error deleting record:', error)
      let errorMessage = 'Error deleting record'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      alert(errorMessage)
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleSort = (key) => {
    let direction = 'desc'
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setDateFilter('')
    setStatusFilter('')
    fetchRecords()
  }

  // Filter and sort records
  const filteredRecords = records
    .filter(record => {
      if (dateFilter && record.date !== dateFilter) return false
      if (statusFilter && record.status !== statusFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          record.employeeName.toLowerCase().includes(query) ||
          record.employeeID.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA
      }
      
      if (sortConfig.key === 'name') {
        const nameA = a.employeeName.toLowerCase()
        const nameB = b.employeeName.toLowerCase()
        return sortConfig.direction === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA)
      }
      
      if (sortConfig.key === 'status') {
        return sortConfig.direction === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status)
      }

      return 0
    })

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const getStats = () => {
    const total = filteredRecords.length
    const present = filteredRecords.filter(r => r.status === 'Present').length
    const absent = filteredRecords.filter(r => r.status === 'Absent').length
    const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : 0
    
    return { total, present, absent, attendanceRate }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="attendance-dashboard fade-in">
        <div className="dashboard-loading">
          <div className="loading-spinner large"></div>
          <p>Loading attendance records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="attendance-dashboard fade-in">
      {/* Success Message */}
      {showDeleteSuccess && (
        <div className="success-message bounce-in">
          <span className="success-icon">✅</span>
          Record deleted successfully!
        </div>
      )}

      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Attendance Records</h2>
          <div className="record-count">
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
          </div>
        </div>
        
        <div className="controls">
          <div className="search-group">
            <input
              type="text"
              className="search-box"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="search-btn">
              
            </button>
          </div>

          <select 
            className="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>

          <input
            type="date"
            className="date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <button onClick={handleClearFilters} className="clear-filters-btn">
            Clear Filters
          </button>

          <button onClick={fetchRecords} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card total">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Records</div>
        </div>
        <div className="stat-card present">
          <div className="stat-value">{stats.present}</div>
          <div className="stat-label">Present</div>
        </div>
        <div className="stat-card absent">
          <div className="stat-value">{stats.absent}</div>
          <div className="stat-label">Absent</div>
        </div>
        <div className="stat-card rate">
          <div className="stat-value">{stats.attendanceRate}%</div>
          <div className="stat-label">Attendance Rate</div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="no-records bounce-in">
          <div className="no-records-icon">📊</div>
          <h3>No attendance records found</h3>
          <p>
            {records.length === 0 
              ? "No records in the system. Start by marking attendance above."
              : "No records match your current filters. Try adjusting your search criteria."
            }
          </p>
          {(searchQuery || dateFilter || statusFilter) && (
            <button onClick={handleClearFilters} className="clear-filters-btn">
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                   {('name')}
                </th>
                <th>Employee ID</th>
                <th onClick={() => handleSort('date')} className="sortable">
                  {('date')}
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                   {('status')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, index) => (
                <tr 
                  key={record.id} 
                  className="fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <td className="employee-name">{record.employeeName}</td>
                  <td className="employee-id">{record.employeeID}</td>
                  <td className="attendance-date">{record.date}</td>
                  <td>
                    <span className={`status-badge status-${record.status.toLowerCase()}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={`delete-btn ${deleteLoading === record.id ? 'loading' : ''}`}
                      onClick={() => handleDelete(record.id, record.employeeName)}
                      disabled={deleteLoading === record.id}
                    >
                      {deleteLoading === record.id ? (
                        <>
                          <span className="loading-spinner small"></span>
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AttendanceDashboard