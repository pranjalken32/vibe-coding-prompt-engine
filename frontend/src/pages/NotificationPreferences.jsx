import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState({ email: true, inApp: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrefs();
  }, []);

  async function fetchPrefs() {
    try {
      const res = await api.getNotificationPreferences();
      setPrefs(res.data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleToggle(key) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.updateNotificationPreferences(updated);
      setMessage('Preferences saved');
    } catch (err) {
      setPrefs(prefs);
      setError(err.message);
    }
    setSaving(false);
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Notification Preferences</h1>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {message && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '14px' }}>
          {message}
        </div>
      )}

      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Email Notifications</h3>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
            Receive notifications via email when tasks are assigned to you or when task statuses change.
          </p>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
            <div
              onClick={() => handleToggle('email')}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: prefs.email ? '#2563eb' : '#d1d5db',
                position: 'relative',
                transition: 'background 0.2s',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: prefs.email ? '22px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {prefs.email ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>In-App Notifications</h3>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
            See notifications in the bell icon dropdown within the application.
          </p>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
            <div
              onClick={() => handleToggle('inApp')}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: prefs.inApp ? '#2563eb' : '#d1d5db',
                position: 'relative',
                transition: 'background 0.2s',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: prefs.inApp ? '22px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {prefs.inApp ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </div>

      {saving && (
        <div style={{ marginTop: '12px', color: '#6b7280', fontSize: '13px' }}>Saving...</div>
      )}
    </div>
  );
}
