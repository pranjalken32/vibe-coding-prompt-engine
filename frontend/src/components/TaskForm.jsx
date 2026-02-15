import { useState, useEffect } from 'react';

export default function TaskForm({ task, users, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    assigneeId: '',
    dueDate: '',
    isRecurring: false,
    recurrence: null,
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'open',
        priority: task.priority || 'medium',
        assigneeId: task.assigneeId?._id || task.assigneeId || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        isRecurring: task.isRecurring || false,
        recurrence: task.recurrence || null,
      });
    }
  }, [task]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const dataToSend = { ...form };
    if (!dataToSend.isRecurring) {
        dataToSend.recurrence = null;
    }
    onSubmit(dataToSend);
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-bold mb-4">{task ? 'Edit Task' : 'New Task'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input id="title" name="title" value={form.title} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
            <select id="priority" name="priority" value={form.priority} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">Assignee</label>
            <select id="assigneeId" name="assigneeId" value={form.assigneeId} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u._id || u.id} value={u._id || u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
            <input id="dueDate" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        </div>
        <div className="space-y-2">
            <div className="flex items-center">
                <input
                    id="isRecurring"
                    name="isRecurring"
                    type="checkbox"
                    checked={form.isRecurring}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900">
                    Is this a recurring task?
                </label>
            </div>
            {form.isRecurring && (
                <div>
                    <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700">Repeats</label>
                    <select
                        id="recurrence"
                        name="recurrence"
                        value={form.recurrence || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="" disabled>Select frequency</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            )}
        </div>
        <div className="flex gap-2">
          <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">{task ? 'Update' : 'Create'}</button>
          <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
