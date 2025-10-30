import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../Animations.css'

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const menuItems = [
    {
      path: '/attendance',
      name: 'Mark Attendance',
      icon: '⊕',
      description: 'Record employee attendance'
    },
    {
      path: '/dashboard',
      name: 'View Records',
      icon: '≡',
      description: 'View and manage attendance records'
    },
    {
      path: '/download',
      name: 'Download',
      icon: '⤓',
      description: 'Export attendance data'
    }
  ]

  const isActive = (path) => {
    return location.pathname === path || (path === '/attendance' && location.pathname === '/')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className={`menu-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Attendance System</h2>
          <button 
            className="close-sidebar"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''} fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => setIsOpen(false)}
            >
              <div className="nav-icon">{item.icon}</div>
              <div className="nav-content">
                <div className="nav-name">{item.name}</div>
                <div className="nav-description">{item.description}</div>
              </div>
              <div className="nav-indicator"></div>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">HR Manager</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar