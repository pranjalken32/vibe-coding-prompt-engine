import { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, createTask, updateTask, deleteTask, getUsers, getTaskTemplates, createTaskFromTemplate } from '../utils/api';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [error, setError] = useState('');
  
  const orgId = user?.orgId;

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  const canEdit = ['admin', 'manager', 'member'].includes(user?.role);
  const canDelete = user?.role === 'admin';
  const canCreate = ['admin', 'manager', 'member'].includes(user?.role);

  const loadTasks = async () => {
    if (!orgId) return;
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (assigneeFilter) params.append('assigneeId', assigneeFilter);
      
      const res = await getTasks(orgId, params);
      if (res.data.success) {
        setTasks(res.data.data);
      } else {
        setError(res.data.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to load tasks.');
    }
  }

  useEffect(() => {
    loadTasks();
    if (orgId) {
        getUsers(orgId).then(res => {
            if (res.data.success) setUsers(res.data.data);
        }).catch(() => {});
        getTaskTemplates(orgId).then(res => {
            if (res.data.success) setTemplates(res.data.data);
        }).catch(() => {});
    }
  }, [orgId, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  async function handleSubmit(formData) {
    try {
      if (editingTask) {
        await updateTask(orgId, editingTask._id, formData);
      } else {
        await createTask(orgId, formData);
      }
      setShowForm(false);
      setEditingTask(null);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(orgId, id);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  function handleEdit(task) {
    setEditingTask(task);
    setShowForm(true);
  }

  async function handleCreateFromTemplate(templateId) {
    try {
        await createTaskFromTemplate(orgId, templateId);
        setShowTemplateModal(false);
        loadTasks();
    } catch (err) {
        setError(err.response?.data?.error || 'Failed to create task from template.');
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex gap-2">
            {canCreate && !showForm && (
            <>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700" onClick={() => { setEditingTask(null); setShowForm(true); }}>
                    New Task
                </button>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700" onClick={() => setShowTemplateModal(true)}>
                    Create from Template
                </button>
            </>
            )}
        </div>
      </div>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
      
      {/* Search and Filters */}
      <div className="mb-6 flex gap-4 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow p-2 border rounded-md"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded-md"
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
          className="p-2 border rounded-md"
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
          className="p-2 border rounded-md"
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
            className="p-2 bg-gray-200 rounded-md"
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

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Create Task from Template</h2>
                <ul className="divide-y divide-gray-200">
                    {templates.map(template => (
                        <li key={template._id} className="py-3 flex justify-between items-center">
                            <span>{template.name}</span>
                            <button
                                onClick={() => handleCreateFromTemplate(template._id)}
                                className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700"
                            >
                                Create
                            </button>
                        </li>
                    ))}
                </ul>
                <button onClick={() => setShowTemplateModal(false)} className="mt-4 text-sm text-gray-600">Cancel</button>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks found.</p>
        ) : (
            tasks.map(task => (
            <TaskCard
                key={task._id}
                task={task}
                onEdit={canEdit ? handleEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
            />
            ))
        )}
      </div>
    </div>
  );
}
