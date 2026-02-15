import React, { useState, useEffect } from 'react';
import { getUsers } from '../utils/api';

const TaskTemplateForm = ({ onSubmit, initialData = {}, orgId }) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    priority: 'medium',
    assigneeId: '',
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'medium',
        assigneeId: initialData.assigneeId || '',
      });
    }
  }, [initialData]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getUsers(orgId);
        if (res.data.success) {
          setUsers(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
    if (orgId) {
      fetchUsers();
    }
  }, [orgId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Template Name</label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Task Title</label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          id="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        ></textarea>
      </div>
      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
        <select
          name="priority"
          id="priority"
          value={formData.priority}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div>
        <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">Default Assignee</label>
        <select
          name="assigneeId"
          id="assigneeId"
          value={formData.assigneeId}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">None</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Save Template
      </button>
    </form>
  );
};

export default TaskTemplateForm;
