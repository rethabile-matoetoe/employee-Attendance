import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import AttendanceForm from './components/AttendanceForm'
import AttendanceDashboard from './components/AttendanceDashboard'
import DownloadAttendance from './components/DownloadAttendance'
import './App.css'

function App() {
  const [refresh, setRefresh] = useState(false)

  const handleAttendanceAdded = () => {
    setRefresh(prev => !prev)
  }

  return (
    <Router>
      <div className="App">
        <Sidebar />
        <div className="main-content">
          <header className="app-header">
            <h1>Employee Attendance Tracker</h1>
            <p>HR Management System</p>
          </header>
          
          <main className="app-main">
            <Routes>
              <Route 
                path="/" 
                element={
                  <AttendanceForm onAttendanceAdded={handleAttendanceAdded} />
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <AttendanceDashboard refresh={refresh} />
                } 
              />
              <Route 
                path="/download" 
                element={
                  <DownloadAttendance />
                } 
              />
              <Route 
                path="/attendance" 
                element={
                  <AttendanceForm onAttendanceAdded={handleAttendanceAdded} />
                } 
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App