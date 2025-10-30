import React, { useState } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import '../Animations.css'

function DownloadAttendance() {
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0],
    format: 'pdf'
  })

  // FIXED: Direct API URL for local development
  const API_BASE_URL = 'http://localhost:5000/api';

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDownload = async () => {
    if (!filters.startDate) {
      alert('Please select a start date')
      return
    }

    setLoading(true)
    try {
      console.log('Fetching attendance data from:', `${API_BASE_URL}/attendance`)
      const response = await axios.get(`${API_BASE_URL}/attendance`)
      const allData = response.data
      
      console.log('Total records fetched:', allData.length)
      
      // Filter data based on date range
      const filteredData = allData.filter(record => {
        const recordDate = new Date(record.date)
        const startDate = new Date(filters.startDate)
        const endDate = new Date(filters.endDate)
        
        return recordDate >= startDate && recordDate <= endDate
      })

      console.log('Filtered records:', filteredData.length)

      if (filteredData.length === 0) {
        alert('No records found for the selected date range')
        return
      }

      // Generate file based on format
      switch (filters.format) {
        case 'pdf':
          generatePDF(filteredData)
          break
        case 'word':
          generateWordDoc(filteredData)
          break
        case 'csv':
          generateCSV(filteredData)
          break
        case 'json':
          generateJSON(filteredData)
          break
        default:
          generatePDF(filteredData)
      }

    } catch (error) {
      console.error('Error downloading attendance:', error)
      let errorMessage = 'Error downloading attendance data. Please try again.'
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data.error || errorMessage
        console.error('Server error:', error.response.data)
      } else if (error.request) {
        // Network error - backend not reachable
        errorMessage = 'Network error: Cannot connect to backend server. Make sure the backend is running on localhost:5000'
        console.error('Network error:', error.request)
      } else {
        // Other errors
        console.error('Unexpected error:', error.message)
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = (data) => {
    try {
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text('Employee Attendance Report', 105, 20, { align: 'center' })
      
      // Date Range
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Date Range: ${filters.startDate} to ${filters.endDate}`, 105, 30, { align: 'center' })
      
      // Statistics
      const presentCount = data.filter(record => record.status === 'Present').length
      const absentCount = data.filter(record => record.status === 'Absent').length
      const attendanceRate = data.length > 0 ? ((presentCount / data.length) * 100).toFixed(1) : 0
      
      doc.setFontSize(11)
      doc.text(`Total Records: ${data.length}`, 20, 45)
      doc.text(`Present: ${presentCount}`, 20, 52)
      doc.text(`Absent: ${absentCount}`, 20, 59)
      doc.text(`Attendance Rate: ${attendanceRate}%`, 20, 66)
      
      // Table headers
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.setFillColor(41, 128, 185)
      doc.rect(20, 75, 170, 8, 'F')
      doc.text('Employee Name', 25, 80)
      doc.text('Employee ID', 70, 80)
      doc.text('Date', 110, 80)
      doc.text('Status', 150, 80)
      
      // Table rows
      doc.setTextColor(0, 0, 0)
      let yPosition = 85
      
      data.forEach((record, index) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245)
          doc.rect(20, yPosition - 4, 170, 6, 'F')
        }
        
        doc.text(record.employeeName || 'N/A', 25, yPosition)
        doc.text(record.employeeID || 'N/A', 70, yPosition)
        doc.text(record.date || 'N/A', 110, yPosition)
        doc.text(record.status || 'N/A', 150, yPosition)
        
        yPosition += 7
      })
      
      // Footer
      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Page ${i} of ${totalPages}`, 105, 290, { align: 'center' })
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 295, { align: 'center' })
      }
      
      // Download PDF
      doc.save(`attendance_report_${filters.startDate}_to_${filters.endDate}.pdf`)
      console.log('PDF generated successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF document. Please try again.')
    }
  }

  const generateWordDoc = (data) => {
    try {
      // Create HTML content for Word document
      const presentCount = data.filter(record => record.status === 'Present').length
      const absentCount = data.filter(record => record.status === 'Absent').length
      const attendanceRate = data.length > 0 ? ((presentCount / data.length) * 100).toFixed(1) : 0
      
      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Employee Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; text-align: center; }
            .summary { background: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #3498db; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #3498db; color: white; padding: 10px; text-align: left; }
            td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f8f9fa; }
            .present { color: #27ae60; font-weight: bold; }
            .absent { color: #e74c3c; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Employee Attendance Report</h1>
          <div style="text-align: center; color: #7f8c8d; margin-bottom: 20px;">
            Date Range: ${filters.startDate} to ${filters.endDate}
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Records:</strong> ${data.length}</p>
            <p><strong>Present:</strong> ${presentCount}</p>
            <p><strong>Absent:</strong> ${absentCount}</p>
            <p><strong>Attendance Rate:</strong> ${attendanceRate}%</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(record => `
                <tr>
                  <td>${record.employeeName || 'N/A'}</td>
                  <td>${record.employeeID || 'N/A'}</td>
                  <td>${record.date || 'N/A'}</td>
                  <td class="${(record.status || '').toLowerCase()}">${record.status || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} | Total Records: ${data.length}</p>
          </div>
        </body>
        </html>
      `
      
      // Create and download Word document
      const blob = new Blob([htmlContent], { 
        type: 'application/msword;charset=utf-8' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance_report_${filters.startDate}_to_${filters.endDate}.doc`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      console.log('Word document generated successfully')
    } catch (error) {
      console.error('Error generating Word document:', error)
      alert('Error generating Word document. Please try again.')
    }
  }

  const generateCSV = (data) => {
    try {
      const headers = ['Employee Name', 'Employee ID', 'Date', 'Status']
      const csvRows = [
        headers.join(','),
        ...data.map(row => [
          `"${row.employeeName || 'N/A'}"`,
          `"${row.employeeID || 'N/A'}"`,
          `"${row.date || 'N/A'}"`,
          `"${row.status || 'N/A'}"`
        ].join(','))
      ]
      
      const content = csvRows.join('\n')
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance_${filters.startDate}_to_${filters.endDate}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      console.log('CSV file generated successfully')
    } catch (error) {
      console.error('Error generating CSV:', error)
      alert('Error generating CSV file. Please try again.')
    }
  }

  const generateJSON = (data) => {
    try {
      const content = JSON.stringify({
        reportInfo: {
          title: 'Employee Attendance Report',
          dateRange: `${filters.startDate} to ${filters.endDate}`,
          generated: new Date().toISOString(),
          totalRecords: data.length
        },
        data: data
      }, null, 2)
      
      const blob = new Blob([content], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance_${filters.startDate}_to_${filters.endDate}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      console.log('JSON file generated successfully')
    } catch (error) {
      console.error('Error generating JSON:', error)
      alert('Error generating JSON file. Please try again.')
    }
  }

  return (
    <div className="download-attendance fade-in">
      <div className="download-header">
        <h2>Download Attendance Data</h2>
        <p>Export attendance records in your preferred format</p>
      </div>

      <div className="download-filters">
        <div className="filter-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date *</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="format">Export Format</label>
            <select
              id="format"
              name="format"
              value={filters.format}
              onChange={handleFilterChange}
            >
              <option value="pdf">PDF Document</option>
              <option value="word">Word Document</option>
              <option value="csv">CSV (Excel)</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button 
            className="download-btn"
            onClick={handleDownload}
            disabled={loading || !filters.startDate}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Preparing Download...
              </>
            ) : (
              <>
                <span className="download-icon"></span>
                Download Attendance Report
              </>
            )}
          </button>
        </div>
      </div>

      <div className="download-info">
        <div className="info-card">
          <h3>Export Information</h3>
          <ul>
            <li>• <strong>PDF Document</strong> - Professional report with formatting and summary</li>
            <li>• <strong>Word Document</strong> - Editable document with table formatting</li>
            <li>• <strong>CSV Format</strong> - Compatible with Excel and Google Sheets</li>
            <li>• <strong>JSON Format</strong> - Useful for developers and data analysis</li>
            <li>• Select date range to filter records</li>
            <li>• All exports include summary statistics and detailed records</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DownloadAttendance