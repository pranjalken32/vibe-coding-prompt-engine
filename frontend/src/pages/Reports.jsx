import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

export default function Reports() {
  const [taskDistribution, setTaskDistribution] = useState(null);
  const [tasksOverTime, setTasksOverTime] = useState([]);
  const [teamWorkload, setTeamWorkload] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const statusChartRef = useRef(null);
  const priorityChartRef = useRef(null);
  const timeChartRef = useRef(null);

  useEffect(() => {
    loadReportData();
  }, []);

  useEffect(() => {
    if (taskDistribution) {
      drawStatusChart();
      drawPriorityChart();
    }
  }, [taskDistribution]);

  useEffect(() => {
    if (tasksOverTime.length > 0) {
      drawTimeChart();
    }
  }, [tasksOverTime]);

  async function loadReportData() {
    setLoading(true);
    try {
      const [distRes, timeRes, workloadRes] = await Promise.all([
        api.getTaskDistribution(),
        api.getTasksOverTime(),
        api.getTeamWorkload(),
      ]);
      setTaskDistribution(distRes.data);
      setTasksOverTime(timeRes.data);
      setTeamWorkload(workloadRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function drawStatusChart() {
    const canvas = statusChartRef.current;
    if (!canvas || !taskDistribution) return;

    const ctx = canvas.getContext('2d');
    const { byStatus } = taskDistribution;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    const statuses = ['open', 'in_progress', 'review', 'done'];
    const statusLabels = { open: 'Open', in_progress: 'In Progress', review: 'Review', done: 'Done' };
    const colors = { open: '#3b82f6', in_progress: '#f59e0b', review: '#8b5cf6', done: '#10b981' };

    const statusCounts = statuses.map(s => {
      const item = byStatus.find(b => b.status === s);
      return item ? item.count : 0;
    });

    const maxCount = Math.max(...statusCounts, 1);
    const barWidth = chartWidth / statuses.length - 20;

    ctx.fillStyle = '#1f2937';
    ctx.font = '14px sans-serif';

    statuses.forEach((status, i) => {
      const count = statusCounts[i];
      const barHeight = (count / maxCount) * chartHeight;
      const x = padding + i * (chartWidth / statuses.length) + 10;
      const y = height - padding - barHeight;

      ctx.fillStyle = colors[status];
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(count.toString(), x + barWidth / 2, y - 5);

      ctx.save();
      ctx.translate(x + barWidth / 2, height - padding + 20);
      ctx.rotate(-Math.PI / 6);
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(statusLabels[status], 0, 0);
      ctx.restore();
    });
  }

  function drawPriorityChart() {
    const canvas = priorityChartRef.current;
    if (!canvas || !taskDistribution) return;

    const ctx = canvas.getContext('2d');
    const { byPriority } = taskDistribution;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    ctx.clearRect(0, 0, width, height);

    const priorities = ['low', 'medium', 'high', 'critical'];
    const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
    const colors = { low: '#10b981', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };

    const priorityCounts = priorities.map(p => {
      const item = byPriority.find(b => b.priority === p);
      return item ? item.count : 0;
    });

    const total = priorityCounts.reduce((sum, c) => sum + c, 0);
    if (total === 0) return;

    let currentAngle = -Math.PI / 2;

    priorities.forEach((priority, i) => {
      const count = priorityCounts[i];
      const sliceAngle = (count / total) * 2 * Math.PI;

      ctx.fillStyle = colors[priority];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(count.toString(), labelX, labelY);

      currentAngle += sliceAngle;
    });

    // Legend
    priorities.forEach((priority, i) => {
      const legendX = width - 100;
      const legendY = 20 + i * 25;

      ctx.fillStyle = colors[priority];
      ctx.fillRect(legendX, legendY, 15, 15);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(priorityLabels[priority], legendX + 20, legendY + 12);
    });
  }

  function drawTimeChart() {
    const canvas = timeChartRef.current;
    if (!canvas || tasksOverTime.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    const counts = tasksOverTime.map(d => d.count);
    const maxCount = Math.max(...counts, 1);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    tasksOverTime.forEach((data, i) => {
      const x = padding + (i / (tasksOverTime.length - 1)) * chartWidth;
      const y = height - padding - (data.count / maxCount) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#3b82f6';
    tasksOverTime.forEach((data, i) => {
      const x = padding + (i / (tasksOverTime.length - 1)) * chartWidth;
      const y = height - padding - (data.count / maxCount) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw axes
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    const labelStep = Math.max(1, Math.floor(tasksOverTime.length / 5));
    tasksOverTime.forEach((data, i) => {
      if (i % labelStep === 0) {
        const x = padding + (i / (tasksOverTime.length - 1)) * chartWidth;
        const dateLabel = new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        ctx.save();
        ctx.translate(x, height - padding + 15);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(dateLabel, 0, 0);
        ctx.restore();
      }
    });
  }

  if (loading) {
    return <div>Loading reports...</div>;
  }

  if (error) {
    return <div className="error-msg">{error}</div>;
  }

  return (
    <div>
      <h1>Reports</h1>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#f3f4f6' }}>Task Distribution by Status</h2>
        <canvas ref={statusChartRef} width={600} height={300} style={{ background: '#1f2937', borderRadius: '8px', padding: '10px' }} />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#f3f4f6' }}>Task Distribution by Priority</h2>
        <canvas ref={priorityChartRef} width={400} height={300} style={{ background: '#1f2937', borderRadius: '8px', padding: '10px' }} />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#f3f4f6' }}>Tasks Completed Over Time (Last 30 Days)</h2>
        <canvas ref={timeChartRef} width={700} height={300} style={{ background: '#1f2937', borderRadius: '8px', padding: '10px' }} />
      </div>

      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#f3f4f6' }}>Team Workload</h2>
        {teamWorkload.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No assigned tasks yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1f2937', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#374151' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#f3f4f6' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#f3f4f6' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#f3f4f6' }}>Open</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#f3f4f6' }}>In Progress</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#f3f4f6' }}>Review</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#f3f4f6' }}>Done</th>
              </tr>
            </thead>
            <tbody>
              {teamWorkload.map((item, idx) => (
                <tr key={item.userId} style={{ borderTop: idx > 0 ? '1px solid #374151' : 'none' }}>
                  <td style={{ padding: '12px', color: '#f3f4f6' }}>
                    {item.userName}
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{item.userEmail}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#f3f4f6' }}>{item.total}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#3b82f6' }}>{item.open}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#f59e0b' }}>{item.in_progress}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#8b5cf6' }}>{item.review}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#10b981' }}>{item.done}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
