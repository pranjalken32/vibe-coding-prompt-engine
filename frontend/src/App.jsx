import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import NotificationPreferences from './pages/NotificationPreferences';
import TaskTemplates from './pages/TaskTemplates';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100">
          <Header />
          <main>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
                <Route path="/templates" element={<ProtectedRoute><TaskTemplates /></ProtectedRoute>} />
                <Route path="/notification-preferences" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
