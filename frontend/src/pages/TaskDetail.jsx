import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';

const priorityStyles = {
  low: { bg: '#d1fae5', color: '#065f46', label: 'Low' },
  medium: { bg: '#dbeafe', color: '#1e40af', label: 'Medium' },
  high: { bg: '#fed7aa', color: '#9a3412', label: 'High' },
  critical: { bg: '#fecaca', color: '#991b1b', label: 'Critical' },
};

function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

function formatActor(actor) {
  if (!actor) return 'Unknown';
  return actor.name || actor.email || 'Unknown';
}

function activityTitle(item) {
  switch (item.type) {
    case 'task_created':
      return 'Task created';
    case 'status_changed':
      return 'Status changed';
    case 'assignee_changed':
      return 'Assignee changed';
    case 'task_updated':
      return 'Task updated';
    case 'task_deleted':
      return 'Task deleted';
    case 'comment_added':
      return 'Comment';
    default:
      return 'Activity';
  }
}

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [activity, setActivity] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const priority = useMemo(() => {
    const p = priorityStyles[task?.priority] || priorityStyles.medium;
    return p;
  }, [task?.priority]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [taskRes, activityRes] = await Promise.all([
        api.getTask(id),
        api.getTaskActivity(id),
      ]);
      setTask(taskRes.data);
      setActivity(activityRes.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentBody.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await api.addTaskComment(id, { body: commentBody });
      setCommentBody('');
      const activityRes = await api.getTaskActivity(id);
      setActivity(activityRes.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p style={{ color: '#9ca3af' }}>Loading task…</p>;
  }

  if (error) {
    return <div className="error-msg">{error}</div>;
  }

  if (!task) {
    return <p style={{ color: '#9ca3af' }}>Task not found.</p>;
  }

  return (
    <div>
      <div className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '6px' }}>{task.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className={`badge ${task.status}`}>{task.status}</span>
            <span className="badge" style={{ background: priority.bg, color: priority.color }}>{priority.label}</span>
            {task.assigneeId?.name && <span style={{ fontSize: '12px', color: '#9ca3af' }}>Assigned to: {task.assigneeId.name}</span>}
            {task.dueDate && <span style={{ fontSize: '12px', color: '#9ca3af' }}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
          </div>
        </div>
        <Link to="/tasks" className="btn" style={{ padding: '6px 10px' }}>Back</Link>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        {task.description ? (
          <p style={{ margin: 0, color: '#f3f4f6', lineHeight: 1.5 }}>{task.description}</p>
        ) : (
          <p style={{ margin: 0, color: '#9ca3af' }}>No description.</p>
        )}
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {task.createdBy?.name && <span>Created by: {task.createdBy.name}</span>}
          {task.createdAt && <span>Created: {formatDateTime(task.createdAt)}</span>}
          {task.completedAt && <span>Completed: {formatDateTime(task.completedAt)}</span>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Add Comment</h3>
        <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Write a comment…"
            rows={3}
            style={{
              padding: '10px 12px',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#f3f4f6',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" type="submit" disabled={submitting || !commentBody.trim()}>
              {submitting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: '14px' }}>Activity</h3>
        {activity.length === 0 ? (
          <p style={{ color: '#9ca3af', margin: 0 }}>No activity yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activity.map((item, idx) => (
              <div key={`${item.type}-${item.at}-${idx}`} style={{ borderTop: idx === 0 ? 'none' : '1px solid #374151', paddingTop: idx === 0 ? 0 : '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{activityTitle(item)}</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>by {formatActor(item.actor)}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDateTime(item.at)}</span>
                </div>
                {item.type === 'comment_added' ? (
                  <p style={{ margin: '8px 0 0 0', color: '#f3f4f6', whiteSpace: 'pre-wrap' }}>{item.message}</p>
                ) : (
                  <p style={{ margin: '8px 0 0 0', color: '#d1d5db' }}>{item.message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
