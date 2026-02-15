import React, { useState, useEffect, useContext } from 'react';
import { getTaskTemplates, createTaskTemplate, updateTaskTemplate, deleteTaskTemplate } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import TaskTemplateForm from '../components/TaskTemplateForm';

const TaskTemplates = () => {
  const { user } = useContext(AuthContext);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const orgId = user?.orgId;

  const fetchTemplates = async () => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      const res = await getTaskTemplates(orgId);
      if (res.data.success) {
        setTemplates(res.data.data);
      } else {
        setError(res.data.error);
      }
    } catch (err) {
      setError('Failed to fetch templates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [orgId]);

  const handleCreate = async (formData) => {
    try {
      await createTaskTemplate(orgId, formData);
      fetchTemplates();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to create template', error);
      setError(error.response?.data?.error || 'Failed to create template.');
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateTaskTemplate(orgId, editingTemplate._id, formData);
      fetchTemplates();
      setIsFormOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to update template', error);
      setError(error.response?.data?.error || 'Failed to update template.');
    }
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTaskTemplate(orgId, templateId);
        fetchTemplates();
      } catch (error) {
        console.error('Failed to delete template', error);
        setError(error.response?.data?.error || 'Failed to delete template.');
      }
    }
  };

  const openCreateForm = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const openEditForm = (template) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Task Templates</h1>
        <button
          onClick={openCreateForm}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Create Template
        </button>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">{editingTemplate ? 'Edit Template' : 'Create New Template'}</h2>
          <TaskTemplateForm
            onSubmit={editingTemplate ? handleUpdate : handleCreate}
            initialData={editingTemplate}
            orgId={orgId}
          />
          <button onClick={() => setIsFormOpen(false)} className="mt-4 text-sm text-gray-600">Cancel</button>
        </div>
      )}

      {isLoading ? (
        <p>Loading templates...</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {templates.map((template) => (
              <li key={template._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-indigo-600 truncate">{template.name}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <button onClick={() => openEditForm(template)} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(template._id)} className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {template.title}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskTemplates;
