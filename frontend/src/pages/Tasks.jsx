import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  const canEdit = ['admin', 'manager', 'member'].includes(user?.role);
  const canDelete = user?.role === 'admin';
  const canCreate = ['admin', 'manager', 'member'].includes(user?.role);

  useEffect(() => {
    loadTasks();
    api.getUsers().then(res => setUsers(res.data)).catch(() => {});
  }, [searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  async function loadTasks() {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (assigneeFilter) params.append('assigneeId', assigneeFilter);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await api.getTasks(queryString);
      setTasks(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(formData) {
    try {
      if (editingTask) {
        await api.updateTask(editingTask._id, formData);
      } else {
        await api.createTask(formData);
      }
      setShowForm(false);
      setEditingTask(null);
      loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(task) {
    setEditingTask(task);
    setShowForm(true);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tasks</h1>
        {canCreate && !showForm && (
          <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowForm(true); }}>
            New Task
          </button>
        )}
      </div>
      {error && <div className="error-msg">{error}</div>}
      
      {/* Search and Filters */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search tasks by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1 1 300px',
            padding: '8px 12px',
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#f3f4f6',
            fontSize: '14px',
          }}
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#f3f4f6',
            fontSize: '14px',
          }}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#f3f4f6',
            fontSize: '14px',
          }}
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#f3f4f6',
            fontSize: '14px',
          }}
        >
          <option value="">All Assignees</option>
          {users.map(u => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>
        
        {(searchQuery || statusFilter || priorityFilter || assigneeFilter) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
              setPriorityFilter('');
              setAssigneeFilter('');
            }}
            style={{
              padding: '8px 16px',
              background: '#374151',
              border: 'none',
              borderRadius: '6px',
              color: '#9ca3af',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>
      
      {showForm && (
        <TaskForm
          task={editingTask}
          users={users}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}
      {tasks.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>No tasks found.</p>
      ) : (
        tasks.map(task => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))
      )}
    </div>
  );
}
