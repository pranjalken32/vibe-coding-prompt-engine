import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchUnreadCount() {
    try {
      const res = await api.getNotificationUnreadCount();
      setUnreadCount(res.data.count);
    } catch {
      /* silent */
    }
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await api.getNotifications('?limit=10');
      setNotifications(res.data);
    } catch {
      /* silent */
    }
    setLoading(false);
  }

  function toggleDropdown() {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  }

  async function markAsRead(id) {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      /* silent */
    }
  }

  async function markAllRead() {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={toggleDropdown}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '4px',
          fontSize: '20px',
          lineHeight: 1,
          color: '#4b5563',
        }}
        aria-label="Notifications"
      >
        &#128276;
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-6px',
              background: '#dc2626',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '360px',
            maxHeight: '420px',
            overflowY: 'auto',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 1000,
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              Loading...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              No notifications
            </div>
          )}

          {!loading &&
            notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  background: n.read ? 'white' : '#eff6ff',
                  cursor: n.read ? 'default' : 'pointer',
                }}
                onClick={() => !n.read && markAsRead(n._id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#111' }}>{n.title}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#4b5563', marginTop: '4px', lineHeight: 1.4 }}>
                  {n.message}
                </p>
                {n.triggeredBy && (
                  <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'block' }}>
                    by {n.triggeredBy.name}
                  </span>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
