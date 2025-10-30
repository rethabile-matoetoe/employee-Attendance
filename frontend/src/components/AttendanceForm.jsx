import React, { useState } from 'react'
import axios from 'axios'
import '../Animations.css'

function AttendanceForm({ onAttendanceAdded }) {
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeID: '',
    date: new Date().toISOString().split('T')[0], // Default to current date
    status: 'Present'
  })
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  // FIXED: Direct API URL
  const API_BASE_URL = 'http://localhost:5000/api';

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const validateForm = () => {
    const newErrors = {}

    // Validate Employee Name
    if (!formData.employeeName.trim()) {
      newErrors.employeeName = 'Employee name is required'
    } else if (formData.employeeName.trim().length < 2) {
      newErrors.employeeName = 'Name must be at least 2 characters'
    }

    // Validate Employee ID
    if (!formData.employeeID.trim()) {
      newErrors.employeeID = 'Employee ID is required'
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.employeeID)) {
      newErrors.employeeID = 'ID can only contain letters, numbers, and hyphens'
    }

    // Validate Date - allow past dates but not future dates
    if (!formData.date) {
      newErrors.date = 'Date is required'
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      
      if (selectedDate > today) {
        newErrors.date = 'Cannot select future date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Add shake animation to form
      const form = e.target
      form.classList.add('shake')
      setTimeout(() => form.classList.remove('shake'), 500)
      return
    }

    setLoading(true)

    try {
      await axios.post(`${API_BASE_URL}/attendance`, {
        ...formData,
        employeeName: formData.employeeName.trim(),
        employeeID: formData.employeeID.trim()
      })
      
      // Show success message
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
      // Reset form but keep the selected date for convenience
      setFormData({
        employeeName: '',
        employeeID: '',
        date: formData.date, // Keep the selected date
        status: 'Present'
      })
      
      // Clear errors
      setErrors({})
      
      // Refresh dashboard
      onAttendanceAdded()
    } catch (error) {
      console.error('Error recording attendance:', error)
      
      let errorMessage = 'Error recording attendance. Please try again.'
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data.error || errorMessage
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection.'
      }
      
      alert(errorMessage)
      
      // Add error animation
      const form = e.target
      form.classList.add('shake')
      setTimeout(() => form.classList.remove('shake'), 500)
    } finally {
      setLoading(false)
    }
  }

  const handleClearForm = () => {
    // Reset to current date when clearing form
    setFormData({
      employeeName: '',
      employeeID: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Present'
    })
    setErrors({})
  }

  // Helper to format date for display
  const getDateDisplayText = () => {
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);
    
    if (selectedDateStart.getTime() === today.getTime()) {
      return "Today";
    } else if (selectedDateStart < today) {
      return "Past Date";
    }
    return "Selected Date";
  }

  return (
    <div className="attendance-form slide-in-left">
      <h2>Mark Attendance</h2>
      
      {/* Success Message */}
      {showSuccess && (
        <div className="success-message bounce-in">
          <span className="success-icon"></span>
          Attendance recorded successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="fade-in">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="employeeName">
              Employee Name *
              {errors.employeeName && (
                <span className="error-text"> - {errors.employeeName}</span>
              )}
            </label>
            <input
              type="text"
              id="employeeName"
              name="employeeName"
              value={formData.employeeName}
              onChange={handleChange}
              required
              placeholder="Enter employee name"
              className={errors.employeeName ? 'error-input' : ''}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="employeeID">
              Employee ID *
              {errors.employeeID && (
                <span className="error-text"> - {errors.employeeID}</span>
              )}
            </label>
            <input
              type="text"
              id="employeeID"
              name="employeeID"
              value={formData.employeeID}
              onChange={handleChange}
              required
              placeholder="Enter employee ID"
              className={errors.employeeID ? 'error-input' : ''}
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">
              Date *
              {errors.date && (
                <span className="error-text"> - {errors.date}</span>
              )}
            </label>
            <div className="date-input-container">
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={errors.date ? 'error-input' : ''}
                disabled={loading}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
              />
              <div className="date-indicator">
                {getDateDisplayText()}
              </div>
            </div>
            <div className="date-help-text">
              Select today's date or any past date
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              disabled={loading}
              className={loading ? 'disabled-select' : ''}
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="clear-btn"
            onClick={handleClearForm}
            disabled={loading}
          >
            Clear Form
          </button>
          
          <button 
            type="submit" 
            className={`submit-btn ${loading ? 'pulse' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Recording...
              </>
            ) : (
              <>
                <span className="submit-icon"></span>
                Record Attendance
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AttendanceForm