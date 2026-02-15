import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="nav">
      <div className="container">
        <Link to="/" className="nav-brand">ETMP</Link>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <NavLink to="/tasks" className={({ isActive }) => linkClass(isActive)}>Tasks</NavLink>
          <NavLink to="/reports" className={({ isActive }) => linkClass(isActive)}>Reports</NavLink>
          {(user.role === 'admin' || user.role === 'manager') && (
            <NavLink to="/audit-logs" className={({ isActive }) => linkClass(isActive)}>Audit Logs</NavLink>
          )}
          <NavLink to="/templates" className={({ isActive }) => linkClass(isActive)}>Templates</NavLink>
          <NotificationBell />
          <span style={{ color: '#6b7280', fontSize: '14px' }}>
            {user.name} ({user.role})
          </span>
          <button className="btn btn-secondary" onClick={logout} style={{ padding: '4px 12px', fontSize: '13px' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

function linkClass(isActive) {
  return isActive ? 'text-blue-600 font-bold' : 'text-gray-600';
}
